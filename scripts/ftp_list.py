from ftplib import FTP
import sys

if len(sys.argv) != 5:
    print("Usage: ftp_list.py <host> <user> <pass> <remote_dir>")
    sys.exit(2)

host, user, pw, remote_dir = sys.argv[1:5]

ftp = FTP(host, timeout=30)
ftp.login(user, pw)
ftp.set_pasv(False)

print('Connected, listing', remote_dir)

entries = []

def walk(path, depth=0):
    try:
        ftp.cwd(path)
    except Exception as e:
        print('Cannot enter', path, e)
        return
    items = []
    try:
        items = ftp.nlst()
    except Exception as e:
        print('nlst failed for', path, e)
        return
    for it in items:
        if it in ('.','..'):
            continue
        full = path.rstrip('/') + '/' + it if path!='/' else '/' + it
        try:
            ftp.cwd(it)
            ftp.cwd('..')
            print('  ' * depth + '- [dir] ' + it)
            walk(full, depth+1)
        except Exception:
            print('  ' * depth + '- [file] ' + it)

walk(remote_dir)
ftp.quit()
