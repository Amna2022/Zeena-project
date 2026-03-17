import json
import urllib.request

# API endpoint for creating a new booking
url = "http://127.0.0.1:5000/api/bookings"

# sample booking data sent to backend
data = {
    "name": "Moony Test",
    "whatsapp": "07123456789",
    "timeslot_id": 4,
    "location_type": "client_home",
    "payment_method": "cash",
    "notes": "test booking",
    "design_choice": "Bridal"
}

# build HTTP POST request with JSON body
req = urllib.request.Request(
    url,
    data=json.dumps(data).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    # send request to API
    with urllib.request.urlopen(req) as resp:
        print("STATUS:", resp.status)  # response status code
        print(resp.read().decode())   # response body

# handle API errors (e.g. validation, missing fields)
except urllib.error.HTTPError as e:
    print("STATUS:", e.code)
    print(e.read().decode())

# handle connection or unexpected errors
except Exception as e:
    print("ERROR:", e)