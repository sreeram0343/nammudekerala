from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import RepresentativeReplyResponse, RepresentativeReplyCreate
from backend.models import User
from backend.utils.security import get_required_current_user
from backend.controllers.representative_controller import submit_rep_reply

router = APIRouter(tags=["Representative Action"])

@router.post("/api/posts/{post_id}/reply", response_model=RepresentativeReplyResponse)
async def submit_representative_reply(
    post_id: int,
    reply_in: RepresentativeReplyCreate,
    status_update: str = "acknowledged",  # acknowledged, resolved
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return await submit_rep_reply(db, post_id, reply_in, status_update, current_user)
