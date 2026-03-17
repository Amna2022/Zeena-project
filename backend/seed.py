from datetime import datetime, timedelta, time
from app import app
from extensions import db
from models import TimeSlot


def seed_timeslots(days_ahead=7, start_hour=10, end_hour=17):
    created_count = 0
    today = datetime.now().date()

    for day_offset in range(days_ahead):
        current_date = today + timedelta(days=day_offset)

        for hour in range(start_hour, end_hour + 1):
            slot_datetime = datetime.combine(current_date, time(hour=hour))

            exists = TimeSlot.query.filter_by(start_datetime=slot_datetime).first()

            if not exists:
                db.session.add(
                    TimeSlot(
                        start_datetime=slot_datetime,
                        is_active=True
                    )
                )
                created_count += 1

    db.session.commit()
    return created_count


with app.app_context():
    created = seed_timeslots(days_ahead=7, start_hour=10, end_hour=17)
    print(f"Seed complete ✅ Created {created} time slots")