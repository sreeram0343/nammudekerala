from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.models import Notification

def get_user_notifications(db: Session, user_id: int) -> List[Notification]:
    return db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).all()

def mark_notification_read(db: Session, notification_id: int, user_id: int) -> dict:
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    return {"status": "success"}
