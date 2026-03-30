# Zeena – Henna Booking Web Application

Zeena is a mobile-first web application that organises the booking workflow for henna services.  
It replaces unstructured communication (e.g. WhatsApp) with a clear step-by-step booking system.

---

## Features

### Client Flow
- select an available time slot  
- enter booking details  
- choose a design (gallery or upload)  
- preview the design on a hand image  
- submit a booking request  

### Artist Dashboard
- view bookings by status:
  - pending  
  - accepted  
  - declined  
  - change_requested  
- open booking details  
- update booking status  

---

## How It Works

1. user selects a time slot  
2. booking details are entered and validated  
3. design is selected or uploaded  
4. optional preview is applied  
5. booking is submitted to the backend  
6. booking is created with status `pending`  
7. artist reviews and updates the booking  

---

## Tech Stack

- HTML, CSS, JavaScript  
- Python (Flask)  
- SQLAlchemy  
- Docker  

---

## API Overview

- `POST /api/bookings` → create booking  
- `GET /api/bookings?status=...` → filter bookings  
- `GET /api/timeslots` → retrieve availability  
- `PATCH /api/bookings/<id>` → update status  

---

## Key Implementation Details

- each time slot can only have one booking (enforced by database constraint)  
- booking status controls slot availability  
- frontend uses localStorage for multi-step flow  
- dashboard uses sessionStorage for login state  
- booking conflicts are handled with HTTP 409 responses  

---

## Payment

No payment processing is implemented.  
The selected payment method is stored as part of the booking data for future use.

---

## Running the Project

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend

Open:

```
pages/select-availability.html
```

---

## Docker

```bash
cd backend
docker build -t zeena-backend .
docker run -p 5000:5000 zeena-backend
```

---

## Limitations

- no real authentication system  
- no payment integration  
- relies on browser storage  
- dashboard uses artificial loading delay  

---

## Future Improvements

- add authentication  
- integrate payment system  
- improve data handling  
- remove artificial delays  