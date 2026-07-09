from ftplib import FTP
import os
import sys

if len(sys.argv) != 6:
    print("Usage: ftp_upload.py <host> <user> <pass> <local_dir> <remote_dir>")
    sys.exit(2)

host, user, pw, local_dir, remote_dir = sys.argv[1:6]
local_dir = os.path.abspath(local_dir)

if not os.path.isdir(local_dir):
    print(f"Local directory not found: {local_dir}")
    sys.exit(1)

def ensure_dir(ftp, path):
    path = path.strip('/')
    if path == '':
        return
    parts = path.split('/')
    cur = ''
    for p in parts:
        cur = cur + '/' + p if cur else p
        try:
            ftp.cwd(p)
        except Exception:
            try:
                ftp.mkd(p)
                ftp.cwd(p)
            except Exception as e:
                print('Could not create or enter', p, '->', e)
                raise
    # after ensuring, return to root
    ftp.cwd('/')

def upload_with_mode(passive):
    ftp = FTP(host, timeout=30)
    ftp.login(user, pw)
    ftp.set_pasv(passive)
    print('Connected to', host, 'pasv=', passive)

    # ensure remote_dir exists
    try:
        ftp.cwd('/')
        ensure_dir(ftp, remote_dir)
    except Exception as e:
        print('Failed ensuring remote dir:', e)
        ftp.quit()
        return (0, sum(len(files) for _, _, files in os.walk(local_dir)))

    uploaded = 0
    failed = 0
    for root, dirs, files in os.walk(local_dir):
        rel = os.path.relpath(root, local_dir)
        if rel == '.':
            remote_path = remote_dir
        else:
            remote_path = remote_dir.rstrip('/') + '/' + rel.replace('\\', '/')
        # create remote_path
        try:
            ftp.cwd('/')
            ensure_dir(ftp, remote_path)
        except Exception as e:
            print('Failed to create remote path', remote_path, e)
            failed += len(files)
            continue
        # change to remote_path
        try:
            ftp.cwd('/')
            for part in remote_path.strip('/').split('/'):
                if part:
                    ftp.cwd(part)
        except Exception as e:
            print('Failed to enter remote path', remote_path, e)
            failed += len(files)
            continue

        for fname in files:
            local_file = os.path.join(root, fname)
            try:
                with open(local_file, 'rb') as f:
                    ftp.storbinary('STOR ' + fname, f)
                uploaded += 1
                print('Uploaded', os.path.join(rel, fname))
            except Exception as e:
                print('Failed', local_file, e)
                failed += 1

    ftp.quit()
    return (uploaded, failed)


# try passive then active mode
total_uploaded = 0
total_failed = 0
for mode in (True, False):
    uploaded, failed = upload_with_mode(mode)
    total_uploaded += uploaded
    total_failed = failed  # take last failure count
    if uploaded > 0 and failed == 0:
        break

print(f'Done. Uploaded: {total_uploaded}, Failed: {total_failed}')
