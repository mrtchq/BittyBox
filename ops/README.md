# BittyBox static-permission guard

Hermes shells use `umask 077`, so a plain copy can make a new public JS/CSS
asset unreadable by Nginx. Full deployments must use:

```bash
rsync -a --delete --chmod=D755,F644 SOURCE/ TARGET/
```

For partial deployments, invoke:

```bash
/usr/local/sbin/bittybox-fix-static-permissions
```

The oneshot service uses descriptor-based Python traversal with `O_NOFOLLOW`
and `fchmod`. It excludes hidden entries and descendants, symlinks, special
files, cross-device directories, and multiply-linked files. Production and
staging document roots are root-owned and not writable by group or others.

Two activators are installed:

- `.path`: a best-effort low-latency trigger for direct changes to the public
  roots and their top-level `assets` directories;
- `.timer`: the correctness backstop, running after boot and every minute so
  nested changes, chmod-only changes, and already-present bad modes are caught.

Installation must explicitly start the oneshot once; neither activation unit is
relied upon for the initial repair. Verify the referenced JS and CSS URLs—not
just `/`—return HTTP 200 with the correct MIME types after every deployment.
