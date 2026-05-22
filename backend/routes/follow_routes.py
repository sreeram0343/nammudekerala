from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.utils.security import get_required_current_user
from backend.controllers.follow_controller import toggle_follow_assembly

router = APIRouter(prefix="/api/follows", tags=["Follows"])

@router.post("/assembly/{assembly_id}")
def follow_assembly(
    assembly_id: int,
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return toggle_follow_assembly(db, assembly_id, current_user.id)
