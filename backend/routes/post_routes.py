from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.schemas import PostResponse, PostCreate, VoteSubmit
from backend.models import User
from backend.utils.security import get_current_user, get_required_current_user
from backend.controllers.post_controller import get_posts_list, get_single_post, create_new_post, submit_post_vote

router = APIRouter(tags=["Posts"])

@router.get("/api/posts", response_model=List[PostResponse])
def get_posts(
    assembly_name: Optional[str] = None,
    category: Optional[str] = None,
    sort: str = "trending",
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_posts_list(db, assembly_name, category, sort, current_user)

@router.get("/api/posts/{post_id}", response_model=PostResponse)
def get_post_by_id(
    post_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_single_post(db, post_id, current_user)

@router.post("/api/posts", response_model=PostResponse)
async def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return await create_new_post(db, post_in, current_user)

@router.post("/api/vote")
async def submit_vote(
    vote_in: VoteSubmit,
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return await submit_post_vote(db, vote_in, current_user)
