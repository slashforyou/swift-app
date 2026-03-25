import urllib.request, urllib.error, json

TOKEN = "ea4c3634303782a9ffe3f19cbba336897e562707b49d6c497364d7e14dba24e90563ffda60ef0063d874b3aa737540575c98cdfb1b558a065c30cc96fd47c014"
URL = "https://altivo.fr/swift-app/v1/feedback"

data = json.dumps({"type": "bug", "message": "Test via public URL"}).encode()
req = urllib.request.Request(URL, data=data, method="POST")
req.add_header("Authorization", "Bearer " + TOKEN)
req.add_header("Content-Type", "application/json")

try:
    resp = urllib.request.urlopen(req, timeout=10)
    print("Status:", resp.status)
    print("Response:", resp.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code, e.read().decode())
except Exception as e:
    print("Error:", e)
