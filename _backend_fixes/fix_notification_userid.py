#!/usr/bin/env python3
base = "/srv/www/htdocs/swiftapp/server/endPoints/v1/"
files = ["listNotifications.js", "markAllNotificationsRead.js", "updateNotification.js", "deleteNotification.js"]
for fname in files:
    path = base + fname
    with open(path) as f:
        c = f.read()
    orig = c
    c = c.replace("req.user?.userId || 15", "req.user?.id")
    c = c.replace("req.user?.userId", "req.user?.id")
    with open(path, "w") as f:
        f.write(c)
    print(fname, "->", "FIXED" if c != orig else "unchanged")
