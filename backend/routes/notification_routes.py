from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.schemas import NotificationResponse
from backend.models import User
from backend.utils.security import get_required_current_user
from backend.controllers.notification_controller import (
    get_user_notifications,
    mark_notification_read,
    mark_all_notifications_read
)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return get_user_notifications(db, current_user.id)

@router.post("/read-all")
def mark_all_read(
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return mark_all_notifications_read(db, current_user.id)

@router.post("/{notification_id}/read")
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return mark_notification_read(db, notification_id, current_user.id)

