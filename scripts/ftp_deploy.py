"""One-shot FTP deploy: wipe /public_html then upload frontend/build.

Uses a single persistent FTP session (more reliable than many curl calls).
Credentials are read from environment variables so they are not hard-coded.
"""
import os
import sys
from ftplib import FTP, error_perm

HOST = os.environ["FTP_HOST"]
USER = os.environ["FTP_USER"]
PWD = os.environ["FTP_PWD"]
REMOTE_ROOT = os.environ.get("FTP_REMOTE", "/public_html")
LOCAL_BUILD = os.environ["LOCAL_BUILD"]
SKIP_SUFFIXES = (".map",)

deleted_files = 0
deleted_dirs = 0
uploaded = 0


def entries(ftp, path):
    """Return list of (name, is_dir) for a remote dir, using MLSD if possible."""
    items = []
    try:
        for name, facts in ftp.mlsd(path):
            if name in (".", ".."):
                continue
            items.append((name, facts.get("type") == "dir"))
        return items
    except error_perm:
        pass
    except Exception:
        pass
    # Fallback: nlst + cwd probe
    try:
        names = ftp.nlst(path)
    except error_perm:
        return items
    for full in names:
        name = full.split("/")[-1]
        if name in (".", ".."):
            continue
        is_dir = False
        try:
            ftp.cwd(path + "/" + name)
            is_dir = True
        except error_perm:
            is_dir = False
        items.append((name, is_dir))
    return items


def wipe_children(ftp, path):
    global deleted_files, deleted_dirs
    for name, is_dir in entries(ftp, path):
        full = path + "/" + name
        if is_dir:
            wipe_children(ftp, full)
            try:
                ftp.rmd(full)
                deleted_dirs += 1
                print(f"  RMD  {full}")
            except error_perm as e:
                print(f"  !RMD {full} -> {e}")
        else:
            try:
                ftp.delete(full)
                deleted_files += 1
                print(f"  DEL  {full}")
            except error_perm as e:
                print(f"  !DEL {full} -> {e}")


def ensure_dir(ftp, path):
    try:
        ftp.mkd(path)
    except error_perm:
        pass  # already exists


def upload_dir(ftp, local_dir, remote_dir):
    global uploaded
    ensure_dir(ftp, remote_dir)
    for entry in sorted(os.listdir(local_dir)):
        lp = os.path.join(local_dir, entry)
        rp = remote_dir + "/" + entry
        if os.path.isdir(lp):
            upload_dir(ftp, lp, rp)
        else:
            if entry.endswith(SKIP_SUFFIXES):
                continue
            with open(lp, "rb") as fh:
                ftp.storbinary(f"STOR {rp}", fh)
            uploaded += 1
            print(f"  PUT  {rp}")


def main():
    ftp = FTP(HOST, timeout=120)
    ftp.login(USER, PWD)
    ftp.set_pasv(True)
    print(f"Connected as {USER}. Wiping {REMOTE_ROOT} ...")
    ensure_dir(ftp, REMOTE_ROOT)
    wipe_children(ftp, REMOTE_ROOT)
    print(f"Deleted files={deleted_files} dirs={deleted_dirs}")
    print(f"Uploading {LOCAL_BUILD} -> {REMOTE_ROOT} ...")
    upload_dir(ftp, LOCAL_BUILD, REMOTE_ROOT)
    print(f"Uploaded files={uploaded}")
    print("Remaining top-level entries:")
    for name, is_dir in entries(ftp, REMOTE_ROOT):
        print(f"  {'d' if is_dir else '-'} {name}")
    ftp.quit()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        sys.exit(1)
