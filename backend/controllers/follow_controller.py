from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.models import Follow, Assembly

def toggle_follow_assembly(db: Session, assembly_id: int, user_id: int) -> dict:
    assembly = db.query(Assembly).filter(Assembly.id == assembly_id).first()
    if not assembly:
        raise HTTPException(status_code=404, detail="Assembly constituency not found")
        
    existing_follow = db.query(Follow).filter(
        Follow.assembly_id == assembly_id,
        Follow.user_id == user_id
    ).first()
    
    if existing_follow:
        db.delete(existing_follow)
        assembly.followers_count = max(0, assembly.followers_count - 1)
        db.commit()
        return {"status": "unfollowed", "followers_count": assembly.followers_count}
    else:
        new_follow = Follow(user_id=user_id, assembly_id=assembly_id)
        db.add(new_follow)
        assembly.followers_count += 1
        db.commit()
        return {"status": "followed", "followers_count": assembly.followers_count}

def check_follow_status(db: Session, assembly_id: int, user_id: int) -> dict:
    follow = db.query(Follow).filter(
        Follow.assembly_id == assembly_id,
        Follow.user_id == user_id
    ).first()
    return {"following": follow is not None}

def get_followed_assemblies(db: Session, user_id: int):
    return db.query(Assembly).join(Follow).filter(Follow.user_id == user_id).order_by(Assembly.assembly_name).all()

