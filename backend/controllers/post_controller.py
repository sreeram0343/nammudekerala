from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models import User, Assembly, Post, Vote, Notification
from backend.schemas import PostCreate, VoteSubmit
from backend.services.websocket_service import manager

def map_db_post_to_response(post: Post, current_user: Optional[User] = None) -> dict:
    if post.is_anonymous:
        username = "Anonymous Citizen"
        user_image = "https://api.dicebear.com/7.x/initials/svg?seed=AC"
        user_role = "citizen"
        user_id = None
    else:
        username = post.user.username
        user_image = post.user.profile_image
        user_role = post.user.role
        user_id = post.user.id
        
    user_vote = None
    if current_user:
        vote = next((v for v in post.votes if v.user_id == current_user.id), None)
        if vote:
            user_vote = vote.vote_type
            
    replies = []
    for reply in post.replies:
        rep_name = reply.representative.username
        if reply.representative.constituency:
            rep_name = f"{reply.representative.constituency.mla_name} (MLA)"
            
        replies.append({
            "id": reply.id,
            "post_id": reply.post_id,
            "content": reply.content,
            "progress_proof_url": reply.progress_proof_url,
            "created_at": reply.created_at,
            "representative_name": rep_name
        })
        
    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "media_url": post.media_url,
        "assembly_id": post.assembly_id,
        "assembly_name": post.assembly.assembly_name,
        "assembly_slug": post.assembly.slug,
        "category": post.category,
        "upvotes_count": post.upvotes_count,
        "downvotes_count": post.downvotes_count,
        "is_anonymous": post.is_anonymous,
        "status": post.status,
        "latitude": post.latitude,
        "longitude": post.longitude,
        "created_at": post.created_at,
        "comments_count": len(post.comments),
        "user_id": user_id,
        "username": username,
        "user_image": user_image,
        "user_role": user_role,
        "user_vote": user_vote,
        "replies": replies
    }

def get_posts_list(
    db: Session,
    assembly_name: Optional[str] = None,
    category: Optional[str] = None,
    sort: str = "trending",
    current_user: Optional[User] = None
) -> List[dict]:
    query = db.query(Post)
    
    if assembly_name:
        assembly = db.query(Assembly).filter(
            (func.lower(Assembly.assembly_name) == assembly_name.lower()) |
            (func.lower(Assembly.slug) == assembly_name.lower())
        ).first()
        if assembly:
            query = query.filter(Post.assembly_id == assembly.id)
            
    if category:
        query = query.filter(func.lower(Post.category) == category.lower())
        
    posts = query.all()
    mapped_posts = [map_db_post_to_response(p, current_user) for p in posts]
    
    if sort == "new":
        mapped_posts.sort(key=lambda x: x["created_at"], reverse=True)
    elif sort == "ignored":
        # Issues with upvotes >= 10 and status is reported (no reply yet)
        mapped_posts = [p for p in mapped_posts if p["upvotes_count"] >= 10 and p["status"] == "reported"]
        mapped_posts.sort(key=lambda x: x["upvotes_count"], reverse=True)
    else:  # trending
        # score = upvotes - downvotes + comments * 2
        mapped_posts.sort(
            key=lambda x: (x["upvotes_count"] - x["downvotes_count"] + x["comments_count"] * 2), 
            reverse=True
        )
        
    return mapped_posts

def get_single_post(db: Session, post_id: int, current_user: Optional[User] = None) -> dict:
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return map_db_post_to_response(post, current_user)

async def create_new_post(db: Session, post_in: PostCreate, current_user: User) -> dict:
    clean_tag = post_in.assembly_tag.replace("@", "").strip()
    assembly = db.query(Assembly).filter(
        (func.lower(Assembly.assembly_name) == clean_tag.lower()) |
        (func.lower(Assembly.slug) == clean_tag.lower())
    ).first()
    if not assembly:
        raise HTTPException(status_code=400, detail=f"Assembly @{clean_tag} is not a valid constituency in Kerala.")
        
    assembly.issue_count += 1
        
    lat = post_in.latitude if post_in.latitude is not None else assembly.latitude
    lon = post_in.longitude if post_in.longitude is not None else assembly.longitude
    
    # NLP-based auto-categorization
    category = post_in.category
    content_lower = post_in.content.lower()
    title_lower = post_in.title.lower()
    
    if "water" in content_lower or "leak" in content_lower or "pipe" in content_lower or "drinking" in title_lower:
        category = "Water"
    elif "garbage" in content_lower or "waste" in content_lower or "dumping" in title_lower or "bins" in content_lower:
        category = "Waste"
    elif "road" in content_lower or "pothole" in content_lower or "patchwork" in content_lower:
        category = "Roads"
    elif "flood" in content_lower or "drain" in content_lower or "waterlogging" in title_lower:
        category = "Flooding"
    elif "corrupt" in content_lower or "bribe" in content_lower or "vigilance" in content_lower:
        category = "Corruption"
        
    db_post = Post(
        user_id=current_user.id,
        title=post_in.title,
        content=post_in.content,
        media_url=post_in.media_url,
        assembly_id=assembly.id,
        category=category,
        is_anonymous=post_in.is_anonymous,
        latitude=lat,
        longitude=lon,
        status="reported"
    )
    
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    
    # Create notification for followers of this assembly
    from backend.models import Follow
    followers = db.query(Follow).filter(
        Follow.assembly_id == assembly.id,
        Follow.user_id != current_user.id
    ).all()
    
    for f in followers:
        notif = Notification(
            user_id=f.user_id,
            post_id=db_post.id,
            type="new_post",
            title=f"New issue in @{assembly.assembly_name} 📢",
            content=f"A new issue '{db_post.title}' was reported in {assembly.assembly_name}."
        )
        db.add(notif)
    if followers:
        db.commit()
        for f in followers:
            await manager.broadcast({
                "type": "notification",
                "user_id": f.user_id,
                "title": f"New issue in @{assembly.assembly_name} 📢",
                "content": f"A new issue '{db_post.title}' was reported in {assembly.assembly_name}."
            })
    
    # Broadcast realtime WS event
    await manager.broadcast({
        "type": "new_post",
        "post_id": db_post.id,
        "title": db_post.title,
        "assembly_name": assembly.assembly_name,
        "category": db_post.category
    })
    
    return map_db_post_to_response(db_post, current_user)

async def submit_post_vote(db: Session, vote_in: VoteSubmit, current_user: User) -> dict:
    post = db.query(Post).filter(Post.id == vote_in.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    existing_vote = db.query(Vote).filter(Vote.post_id == vote_in.post_id, Vote.user_id == current_user.id).first()
    
    if vote_in.vote_type == "none":
        if existing_vote:
            db.delete(existing_vote)
            db.commit()
    else:
        if existing_vote:
            existing_vote.vote_type = vote_in.vote_type
        else:
            new_vote = Vote(user_id=current_user.id, post_id=vote_in.post_id, vote_type=vote_in.vote_type)
            db.add(new_vote)
        db.commit()
        
    up_count = db.query(Vote).filter(Vote.post_id == post.id, Vote.vote_type == "up").count()
    down_count = db.query(Vote).filter(Vote.post_id == post.id, Vote.vote_type == "down").count()
    
    post.upvotes_count = up_count
    post.downvotes_count = down_count
    db.commit()
    
    # Dynamic Upvote Milestone Achievements
    if up_count in [5, 10, 50, 100]:
        milestone_type = f"upvotes_{up_count}"
        # Check if already notified
        notif_exists = db.query(Notification).filter(
            Notification.user_id == post.user_id,
            Notification.post_id == post.id,
            Notification.type == milestone_type
        ).first()
        
        if not notif_exists and post.user_id != current_user.id:
            milestone_notif = Notification(
                user_id=post.user_id,
                post_id=post.id,
                type=milestone_type,
                title="Upvote Milestone Reached! 🚀",
                content=f"Your civic report '{post.title}' has gained {up_count} upvotes. Kerala citizens support your voice!"
            )
            db.add(milestone_notif)
            db.commit()
            
            # Broadcast notification
            await manager.broadcast({
                "type": "notification",
                "user_id": post.user_id,
                "title": milestone_notif.title,
                "content": milestone_notif.content
            })
            
    return {"status": "success", "upvotes": up_count, "downvotes": down_count}
