from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.models import Comment, Post, Notification
from backend.schemas import CommentCreate
from backend.services.websocket_service import manager

def create_new_comment(db: Session, comment_in: CommentCreate, current_user) -> dict:
    post = db.query(Post).filter(Post.id == comment_in.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if comment_in.parent_id:
        parent = db.query(Comment).filter(Comment.id == comment_in.parent_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent comment not found")
            
    db_comment = Comment(
        post_id=comment_in.post_id,
        user_id=current_user.id,
        parent_id=comment_in.parent_id,
        content=comment_in.content
    )
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Notify post owner of a new comment if the commenter is not the owner
    if post.user_id != current_user.id:
        comment_notif = Notification(
            user_id=post.user_id,
            post_id=post.id,
            type="new_comment",
            title="New Comment on your Report 💬",
            content=f"@{current_user.username} commented: '{comment_in.content[:40]}...'"
        )
        db.add(comment_notif)
        db.commit()
        
        # Broadcast via websocket
        await manager.broadcast({
            "type": "notification",
            "user_id": post.user_id,
            "title": comment_notif.title,
            "content": comment_notif.content
        })
        
    return {
        "id": db_comment.id,
        "post_id": db_comment.post_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "user_image": current_user.profile_image,
        "user_role": current_user.role,
        "parent_id": db_comment.parent_id,
        "content": db_comment.content,
        "created_at": db_comment.created_at,
        "replies": []
    }

def get_post_comments_tree(db: Session, post_id: int) -> List[dict]:
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at).all()
    
    comment_map = {}
    roots = []
    
    for c in comments:
        c_res = {
            "id": c.id,
            "post_id": c.post_id,
            "user_id": c.user.id,
            "username": c.user.username,
            "user_image": c.user.profile_image,
            "user_role": c.user.role,
            "parent_id": c.parent_id,
            "content": c.content,
            "created_at": c.created_at,
            "replies": []
        }
        comment_map[c.id] = c_res
        
    for c in comments:
        c_res = comment_map[c.id]
        if c.parent_id is None:
            roots.append(c_res)
        else:
            parent_res = comment_map.get(c.parent_id)
            if parent_res:
                parent_res["replies"].append(c_res)
                
    return roots
