#!/usr/bin/env python3
"""Safely normalize permissions for BittyBox public static trees.

Traversal uses directory file descriptors plus O_NOFOLLOW. Permission changes are
performed with fchmod on already-open descriptors, avoiding path-based symlink and
rename races. Hidden entries, symlinks, special files, cross-device directories,
and multiply-linked files are deliberately skipped.
"""

from __future__ import annotations

import argparse
import errno
import os
import stat
import sys
from dataclasses import dataclass

DEFAULT_ROOTS = (
    "/var/www/bittybox.org/docs",
    "/var/www/test.bittybox.org/docs",
)

_OPEN_FLAGS = os.O_RDONLY | os.O_CLOEXEC | os.O_NOFOLLOW | os.O_NONBLOCK


@dataclass
class Result:
    corrected_files: int = 0
    corrected_dirs: int = 0
    skipped_symlinks: int = 0
    skipped_special: int = 0
    skipped_hardlinks: int = 0
    skipped_mounts: int = 0
    vanished: int = 0


def _normalize_dir(dir_fd: int, root_device: int, result: Result) -> None:
    """Walk one opened directory without resolving names outside its fd."""
    try:
        names = os.listdir(dir_fd)
    except OSError as exc:
        raise RuntimeError(f"cannot list opened directory fd {dir_fd}: {exc}") from exc

    for name in names:
        if name.startswith("."):
            continue
        try:
            child_fd = os.open(name, _OPEN_FLAGS, dir_fd=dir_fd)
        except OSError as exc:
            if exc.errno in (errno.ELOOP, errno.EMLINK):
                result.skipped_symlinks += 1
                continue
            if exc.errno in (errno.ENOENT, errno.ENOTDIR):
                result.vanished += 1
                continue
            raise

        try:
            info = os.fstat(child_fd)
            if stat.S_ISDIR(info.st_mode):
                if info.st_dev != root_device:
                    result.skipped_mounts += 1
                    continue
                if stat.S_IMODE(info.st_mode) != 0o755:
                    os.fchmod(child_fd, 0o755)
                    result.corrected_dirs += 1
                _normalize_dir(child_fd, root_device, result)
            elif stat.S_ISREG(info.st_mode):
                # Avoid changing permissions on a file that is hard-linked outside
                # the public tree. Normal build artifacts have one link.
                if info.st_nlink != 1:
                    result.skipped_hardlinks += 1
                    continue
                if stat.S_IMODE(info.st_mode) != 0o644:
                    os.fchmod(child_fd, 0o644)
                    result.corrected_files += 1
            else:
                result.skipped_special += 1
        finally:
            os.close(child_fd)


def normalize_root(root: str, result: Result) -> None:
    try:
        root_fd = os.open(root, _OPEN_FLAGS | os.O_DIRECTORY)
    except FileNotFoundError:
        print(f"bittybox-perms: root absent, skipped: {root}", file=sys.stderr)
        return
    except OSError as exc:
        raise RuntimeError(f"refusing root {root!r}: {exc}") from exc

    try:
        info = os.fstat(root_fd)
        if not stat.S_ISDIR(info.st_mode):
            raise RuntimeError(f"refusing non-directory root: {root}")
        if stat.S_IMODE(info.st_mode) != 0o755:
            os.fchmod(root_fd, 0o755)
            result.corrected_dirs += 1
        _normalize_dir(root_fd, info.st_dev, result)
    finally:
        os.close(root_fd)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("roots", nargs="*", default=list(DEFAULT_ROOTS))
    args = parser.parse_args()
    result = Result()
    for root in args.roots:
        normalize_root(os.path.abspath(root), result)
    print(
        "bittybox-perms: "
        f"files={result.corrected_files} dirs={result.corrected_dirs} "
        f"symlinks_skipped={result.skipped_symlinks} "
        f"hardlinks_skipped={result.skipped_hardlinks} "
        f"special_skipped={result.skipped_special} "
        f"mounts_skipped={result.skipped_mounts} vanished={result.vanished}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
