from datetime import datetime
from extensions import db

# Time slots table
class TimeSlot(db.Model):
    __tablename__ = "timeslots"

    id = db.Column(db.Integer, primary_key=True)
    start_datetime = db.Column(db.DateTime, nullable=False, unique=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        # Basic slot data only (availability is calculated in the API)
        return {
            "id": self.id,
            "start_datetime": self.start_datetime.isoformat(),
            "is_active": self.is_active
        }

# Clients table
class Client(db.Model):
    __tablename__ = "clients"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    whatsapp = db.Column(db.String(30), nullable=False)
    address = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

# Bookings table
class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=False)
    timeslot_id = db.Column(db.Integer, db.ForeignKey("timeslots.id"), nullable=False, unique=True)  # no double booking
    location_type = db.Column(db.String(20), nullable=False)  # artist_place / client_home
    payment_method = db.Column(db.String(20), nullable=False, default="cash")
    notes = db.Column(db.Text, nullable=True)
    design_choice = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="pending")  # allowed: "pending", "accepted", "declined", "change_requested"
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    client = db.relationship("Client", backref="bookings")
        # One booking per slot (because timeslot_id is unique)
    timeslot = db.relationship("TimeSlot", backref="booking", uselist=False)