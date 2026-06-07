from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from backend.models import Assembly, Post

def get_all_assemblies(db: Session, search: Optional[str] = None, district: Optional[str] = None) -> List[Assembly]:
    query = db.query(Assembly)
    if search:
        query = query.filter(
            (Assembly.assembly_name.ilike(f"%{search}%")) |
            (Assembly.slug.ilike(f"%{search}%"))
        )
    if district:
        query = query.filter(Assembly.district.ilike(f"%{district}%"))
    return query.order_by(Assembly.assembly_name).all()


def get_global_stats(db: Session) -> dict:
    total = db.query(Post).count()
    resolved = db.query(Post).filter(Post.status == "resolved").count()
    acknowledged = db.query(Post).filter(Post.status == "acknowledged").count()
    reported = db.query(Post).filter(Post.status == "reported").count()
    
    rate = (resolved / total * 100) if total > 0 else 100.0
    
    # Active hotspot: find the assembly with the most issues
    hotspot_assembly = db.query(
        Assembly, func.count(Post.id).label("post_count")
    ).join(Post).group_by(Assembly.id).order_by(desc("post_count")).first()
    
    active_hotspot_str = "All quiet across Kerala! Pristine community launch."
    if hotspot_assembly:
        asm, count = hotspot_assembly
        active_hotspot_str = f"@{asm.assembly_name} is currently the most active with {count} reports filed."
        
    return {
        "total_issues": total,
        "resolved_issues": resolved,
        "acknowledged_issues": acknowledged,
        "reported_issues": reported,
        "resolution_rate": round(rate, 1),
        "active_hotspot": active_hotspot_str
    }

def get_assembly_stats(db: Session, name: str) -> dict:
    # Perform case-insensitive search by name or slug
    assembly = db.query(Assembly).filter(
        (func.lower(Assembly.assembly_name) == name.lower()) | 
        (func.lower(Assembly.slug) == name.lower())
    ).first()
    if not assembly:
        raise HTTPException(status_code=404, detail="Assembly not found")
        
    # Get issue counts
    total = db.query(Post).filter(Post.assembly_id == assembly.id).count()
    resolved = db.query(Post).filter(Post.assembly_id == assembly.id, Post.status == "resolved").count()
    acknowledged = db.query(Post).filter(Post.assembly_id == assembly.id, Post.status == "acknowledged").count()
    reported = db.query(Post).filter(Post.assembly_id == assembly.id, Post.status == "reported").count()
    
    rate = (resolved / total * 100) if total > 0 else 100.0
    
    return {
        "id": assembly.id,
        "assembly_name": assembly.assembly_name,
        "district": assembly.district,
        "slug": assembly.slug,
        "constituency_type": assembly.constituency_type,
        "followers_count": assembly.followers_count,
        "issue_count": total,
        "mla_name": assembly.mla_name,
        "mla_verified": assembly.mla_verified,
        "total_issues": total,
        "resolved_issues": resolved,
        "acknowledged_issues": acknowledged,
        "ignored_issues": reported,
        "resolution_rate": round(rate, 1),
        "created_at": assembly.created_at
    }
