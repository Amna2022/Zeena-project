import json
import urllib.request

# endpoint to update an existing booking (by ID)
url = "http://127.0.0.1:5000/api/bookings/1"

# payload to update booking status
data = {
    "status": "accepted"
}

# build PATCH request with JSON body
req = urllib.request.Request(
    url,
    data=json.dumps(data).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="PATCH"
)

try:
    # send request to backend
    with urllib.request.urlopen(req) as resp:
        print("STATUS:", resp.status)  # HTTP status code
        print(resp.read().decode())   # response content

# handle API-level errors (e.g. invalid ID or status)
except urllib.error.HTTPError as e:
    print("STATUS:", e.code)
    print(e.read().decode())

# handle connection or unexpected issues
except Exception as e:
    print("ERROR:", e)