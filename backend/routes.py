from flask import Blueprint, jsonify, request
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import TimeSlot, Booking, Client

api = Blueprint("api", __name__)


@api.get("/health")
def health():
    return jsonify({"status": "ok", "message": "Zeena backend is running"})


# =========================================
# Artist Login Endpoint
# =========================================

@api.post("/artist-login")
def artist_login():

    # Make sure request is JSON
    if not request.is_json:
        return jsonify({
            "success": False,
            "message": "Request must be JSON"
        }), 400

    # Get JSON data from request
    data = request.get_json(silent=True)

    # If no data was sent
    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is missing"
        }), 400

    # Get username and password from request
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", "")).strip()

    # Basic validation
    if not username or not password:
        return jsonify({
            "success": False,
            "message": "Username and password are required"
        }), 400

    # -----------------------------------------
    # Demo artist credentials (simple login)
    # In real systems this would come from DB
    # -----------------------------------------
    ARTIST_USERNAME = "moony"
    ARTIST_PASSWORD = "zeena123"

    # Check credentials
    if username != ARTIST_USERNAME or password != ARTIST_PASSWORD:
        return jsonify({
            "success": False,
            "message": "Invalid username or password"
        }), 401

    # Login successful
    return jsonify({
        "success": True,
        "message": "Login successful",
        "artist": {
            "username": ARTIST_USERNAME
        }
    }), 200


@api.get("/timeslots")
def get_timeslots():
    # Write this in browser: /api/timeslots?date=YYYY-MM-DD
    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"error": "date is required in format YYYY-MM-DD"}), 400

    try:
        day = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "invalid date format. Use YYYY-MM-DD"}), 400

    start = datetime.combine(day, datetime.min.time())
    end = datetime.combine(day, datetime.max.time())

    slots = (
        TimeSlot.query
        .filter(TimeSlot.is_active == True)
        .filter(TimeSlot.start_datetime >= start, TimeSlot.start_datetime <= end)
        .order_by(TimeSlot.start_datetime.asc())
        .all()
    )

    # Only bookings that still block the slot
    blocking_statuses = ["pending", "accepted", "change_requested"]

    booked_ids = {
        b.timeslot_id
        for b in Booking.query
            .filter(Booking.status.in_(blocking_statuses))
            .with_entities(Booking.timeslot_id)
            .all()
    }

    result = []
    for s in slots:
        result.append({
            "id": s.id,
            "start_datetime": s.start_datetime.isoformat(),
            "available": (s.id not in booked_ids)
        })

    return jsonify(result)


@api.get("/bookings")
def list_bookings():
    # Example in browser: /api/bookings?status=pending
    status = request.args.get("status")

    q = Booking.query
    if status:
        q = q.filter(Booking.status == status)

    bookings = q.order_by(Booking.created_at.desc()).all()

    result = []
    for b in bookings:
        result.append({
            "id": b.id,
            "status": b.status,
            "client": {
                "name": b.client.name,
                "whatsapp": b.client.whatsapp,
                "address": b.client.address
            },
            "timeslot": {
                "id": b.timeslot_id,
                "start_datetime": b.timeslot.start_datetime.isoformat()
            },
            "location_type": b.location_type,
            "payment_method": b.payment_method,
            "notes": b.notes,
            "design_choice": b.design_choice,
            "created_at": b.created_at.isoformat()
        })

    return jsonify(result)


@api.get("/bookings/<int:booking_id>")
def get_booking(booking_id):
    booking = Booking.query.get(booking_id)

    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    return jsonify({
        "id": booking.id,
        "status": booking.status,
        "client": {
            "name": booking.client.name,
            "whatsapp": booking.client.whatsapp,
            "address": booking.client.address
        },
        "timeslot": {
            "id": booking.timeslot_id,
            "start_datetime": booking.timeslot.start_datetime.isoformat()
        },
        "location_type": booking.location_type,
        "payment_method": booking.payment_method,
        "notes": booking.notes,
        "design_choice": booking.design_choice,
        "created_at": booking.created_at.isoformat()
    }), 200


@api.post("/bookings")
def create_booking():
    # Create a booking with safer validation

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is missing or invalid"}), 400

    # Read and clean fields
    name = str(data.get("name", "")).strip()
    whatsapp = str(data.get("whatsapp", "")).strip()
    address = str(data.get("address", "")).strip() or None
    location_type = str(data.get("location_type", "")).strip()
    payment_method = str(data.get("payment_method", "cash")).strip()
    notes = str(data.get("notes", "")).strip() or None
    design_choice = str(data.get("design_choice", "")).strip() or None
    timeslot_raw = data.get("timeslot_id")

    # Required field checks
    missing = []
    if not name:
        missing.append("name")
    if not whatsapp:
        missing.append("whatsapp")
    if not location_type:
        missing.append("location_type")
    if timeslot_raw in [None, ""]:
        missing.append("timeslot_id")

    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    # Validate timeslot_id is an integer
    try:
        timeslot_id = int(timeslot_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "timeslot_id must be a valid number"}), 400

    # Validate location_type
    allowed_location_types = ["artist_place", "client_home"]
    if location_type not in allowed_location_types:
        return jsonify({
            "error": "location_type must be 'artist_place' or 'client_home'"
        }), 400

    # Validate payment_method
    allowed_payment_methods = ["cash", "card_future"]
    if payment_method not in allowed_payment_methods:
        return jsonify({
            "error": "payment_method must be 'cash' or 'card_future'"
        }), 400

    # Optional simple WhatsApp validation
    whatsapp_digits = "".join(ch for ch in whatsapp if ch.isdigit())
    if len(whatsapp_digits) < 7:
        return jsonify({"error": "whatsapp number looks invalid"}), 400

    # Check timeslot exists
    timeslot = TimeSlot.query.get(timeslot_id)
    if not timeslot:
        return jsonify({"error": "Time slot not found"}), 404

    # Check slot is active
    if not timeslot.is_active:
        return jsonify({"error": "This time slot is no longer available."}), 409

    # Check slot is not already blocked by another active booking
    blocking_statuses = ["pending", "accepted", "change_requested"]
    existing_booking = Booking.query.filter(
        Booking.timeslot_id == timeslot_id,
        Booking.status.in_(blocking_statuses)
    ).first()

    if existing_booking:
        return jsonify({"error": "This time slot is already booked."}), 409

    # Create client record
    client = Client(
        name=name,
        whatsapp=whatsapp,
        address=address
    )
    db.session.add(client)
    db.session.flush()

    # Create booking record
    booking = Booking(
        client_id=client.id,
        timeslot_id=timeslot_id,
        location_type=location_type,
        payment_method=payment_method,
        notes=notes,
        design_choice=design_choice,
        status="pending"
    )
    db.session.add(booking)

    # Close slot after booking is created
    timeslot.is_active = False

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "This time slot is already booked."}), 409
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Something went wrong while creating the booking"}), 500

    return jsonify({
        "booking_id": booking.id,
        "status": booking.status,
        "message": "Booking created successfully"
    }), 201


@api.patch("/bookings/<int:booking_id>")
def update_booking_status(booking_id):
    # Update booking status with safer business rules

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body is missing or invalid"}), 400

    new_status = data.get("status")
    allowed_statuses = ["accepted", "declined", "change_requested"]

    if not isinstance(new_status, str):
        return jsonify({"error": "status is required and must be a string"}), 400

    new_status = new_status.strip()

    if new_status not in allowed_statuses:
        return jsonify({
            "error": "Invalid status value. Allowed values: accepted, declined, change_requested"
        }), 400

    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    current_status = booking.status

    # Only allow artist actions from pending or change_requested
    allowed_transitions = {
        "pending": ["accepted", "declined", "change_requested"],
        "change_requested": ["accepted", "declined"],
        "accepted": [],
        "declined": []
    }

    if new_status == current_status:
        return jsonify({
            "message": "Booking already has this status",
            "booking_id": booking.id,
            "status": booking.status
        }), 200

    if new_status not in allowed_transitions.get(current_status, []):
        return jsonify({
            "error": f"Cannot change booking status from '{current_status}' to '{new_status}'"
        }), 409

    booking.status = new_status

    # Keep slot state always in sync with booking status
    if new_status == "declined":
        booking.timeslot.is_active = True
    else:
        booking.timeslot.is_active = False

    db.session.commit()

    return jsonify({
        "message": "Booking status updated successfully",
        "booking_id": booking.id,
        "status": booking.status,
        "timeslot": {
            "id": booking.timeslot.id,
            "is_active": booking.timeslot.is_active
        }
    }), 200