from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.schemas import CommentResponse, CommentCreate
from backend.models import User
from backend.utils.security import get_required_current_user
from backend.controllers.comment_controller import (
    create_new_comment,
    get_post_comments_tree,
    delete_user_comment
)

router = APIRouter(tags=["Comments"])

@router.post("/api/comments", response_model=CommentResponse)
async def create_comment(
    comment_in: CommentCreate,
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return await create_new_comment(db, comment_in, current_user)

@router.get("/api/comments/{post_id}", response_model=List[CommentResponse])
def get_comments(post_id: int, db: Session = Depends(get_db)):
    return get_post_comments_tree(db, post_id)

@router.delete("/api/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return delete_user_comment(db, comment_id, current_user.id, current_user.role)

