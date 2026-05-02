import urllib.request, json, sys

token = "ExponentPushToken[SxXaIhC5m0ZL7u6CZndY0j]"
payload = json.dumps({
    "to": token,
    "title": "Test Cobbr",
    "body": "Notif push OK - ca marche !",
    "sound": "default"
}).encode("utf-8")

req = urllib.request.Request(
    "https://exp.host/--/api/v2/push/send",
    data=payload,
    headers={"Content-Type": "application/json", "Accept": "application/json"},
    method="POST"
)
try:
    with urllib.request.urlopen(req) as r:
        body = r.read().decode("utf-8")
        print("OK:", body)
except urllib.error.HTTPError as e:
    print("HTTP Error", e.code, e.read().decode("utf-8"))
except Exception as ex:
    print("Error:", ex)
    sys.exit(1)
