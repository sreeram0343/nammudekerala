from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.models import Report, Post

def create_report(db: Session, post_id: int, reason: str, details: str, user_id: int) -> Report:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    db_report = Report(
        user_id=user_id,
        post_id=post_id,
        reason=reason,
        details=details
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report
