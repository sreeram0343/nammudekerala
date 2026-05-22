from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.models import RepresentativeReply, Post, Notification
from backend.schemas import RepresentativeReplyCreate
from backend.services.websocket_service import manager

async def submit_rep_reply(
    db: Session,
    post_id: int,
    reply_in: RepresentativeReplyCreate,
    status_update: str,
    current_user
) -> dict:
    if current_user.role not in ["representative", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified representatives can respond officially to citizen reports."
        )
        
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    db_reply = RepresentativeReply(
        post_id=post_id,
        user_id=current_user.id,
        content=reply_in.content,
        progress_proof_url=reply_in.progress_proof_url
    )
    db.add(db_reply)
    
    if status_update in ["acknowledged", "resolved"]:
        post.status = status_update
        
    db.commit()
    db.refresh(db_reply)
    
    # Notify the citizen who filed the report
    mla_display_name = current_user.mla_name if getattr(current_user, 'mla_name', None) else current_user.username
    post_owner_notif = Notification(
        user_id=post.user_id,
        post_id=post.id,
        type="mla_response",
        title=f"Official MLA Action! 🏛️",
        content=f"MLA @{mla_display_name} has officially responded to your report '{post.title}'. Status updated to {post.status}."
    )
    db.add(post_owner_notif)
    db.commit()
    
    # Broadcast realtime notifications via WebSockets
    await manager.broadcast({
        "type": "mla_reply",
        "post_id": post.id,
        "title": post.title,
        "mla_name": mla_display_name,
        "status": post.status
    })
    
    await manager.broadcast({
        "type": "notification",
        "user_id": post.user_id,
        "title": post_owner_notif.title,
        "content": post_owner_notif.content
    })
    
    rep_name = current_user.username
    if current_user.constituency:
        rep_name = f"{current_user.constituency.mla_name} (MLA)"
        
    return {
        "id": db_reply.id,
        "post_id": db_reply.post_id,
        "content": db_reply.content,
        "progress_proof_url": db_reply.progress_proof_url,
        "created_at": db_reply.created_at,
        "representative_name": rep_name
    }
