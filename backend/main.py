import os
import shutil
import uuid
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from backend.database import get_db, Base, engine
from backend.models import User, Assembly, Post, Comment, Vote, RepresentativeReply
from backend.schemas import (
    UserCreate, UserResponse, Token, UserLogin,
    AssemblyResponse, AssemblyStats,
    PostCreate, PostResponse,
    CommentCreate, CommentResponse,
    VoteSubmit,
    RepresentativeReplyCreate, RepresentativeReplyResponse
)
from backend.auth import get_password_hash, verify_password, create_access_token, get_current_user, get_required_current_user

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nammude Kerala API",
    description="Backend API for Reddit-style Kerala civic issues reporting and community discussions",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve local uploads statically
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ----------------- WebSocket Connection Manager -----------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Remove dead connections
                pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for any client messages (ping)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ----------------- File Upload Endpoint -----------------
@app.post("/api/upload")
def upload_file(file: UploadFile = File(...)):
    # Simple local file upload
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"http://localhost:8000/uploads/{filename}"}

# ----------------- Authentication Endpoints -----------------
@app.post("/api/auth/signup", response_model=UserResponse)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if username or email already exists
    db_user_username = db.query(User).filter(User.username == user_in.username).first()
    if db_user_username:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user_email = db.query(User).filter(User.email == user_in.email).first()
    if db_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_in.password)
    
    # Representative account verification check or default citizen avatar
    avatar_seed = user_in.username
    profile_image = f"https://api.dicebear.com/7.x/avataaars/svg?seed={avatar_seed}"
    
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role,
        profile_image=profile_image,
        constituency_id=user_in.constituency_id
    )
    
    db.add(db_user)
    
    # If registering as a representative, dynamically link/verify them on the assembly
    if user_in.role == "representative" and user_in.constituency_id:
        assembly = db.query(Assembly).filter(Assembly.id == user_in.constituency_id).first()
        if assembly:
            assembly.mla_name = user_in.username.replace("_", " ").title()
            assembly.mla_verified = True
            
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == login_data.username).first()
    if not db_user or not verify_password(login_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": db_user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_required_current_user)):
    return current_user

# ----------------- Assemblies Endpoints -----------------
@app.get("/api/assemblies", response_model=List[AssemblyResponse])
def get_assemblies(db: Session = Depends(get_db)):
    return db.query(Assembly).order_by(Assembly.assembly_name).all()

@app.get("/api/stats")
def get_global_stats(db: Session = Depends(get_db)):
    total = db.query(Post).count()
    resolved = db.query(Post).filter(Post.status == "resolved").count()
    acknowledged = db.query(Post).filter(Post.status == "acknowledged").count()
    reported = db.query(Post).filter(Post.status == "reported").count()
    
    rate = (resolved / total * 100) if total > 0 else 100.0
    
    # Active hotspot: find the assembly with the most issues, or None
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

@app.get("/api/assembly/{name}", response_model=AssemblyStats)
def get_assembly_stats(name: str, db: Session = Depends(get_db)):
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

# ----------------- Helper mapping for Post responses -----------------
def map_db_post_to_response(post: Post, current_user: Optional[User] = None) -> PostResponse:
    # Handle anonymity
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
        
    # Determine if user voted
    user_vote = None
    if current_user:
        vote = next((v for v in post.votes if v.user_id == current_user.id), None)
        if vote:
            user_vote = vote.vote_type
            
    # Map representative replies
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

# ----------------- Posts Endpoints -----------------
@app.get("/api/posts", response_model=List[PostResponse])
def get_posts(
    assembly_name: Optional[str] = None,
    category: Optional[str] = None,
    sort: str = "trending",  # trending, new, ignored
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Post)
    
    # Filter by assembly tag
    if assembly_name:
        assembly = db.query(Assembly).filter(func.lower(Assembly.assembly_name) == assembly_name.lower()).first()
        if assembly:
            query = query.filter(Post.assembly_id == assembly.id)
            
    # Filter by category
    if category:
        query = query.filter(func.lower(Post.category) == category.lower())
        
    posts = query.all()
    
    # Map to Response Objects
    mapped_posts = [map_db_post_to_response(p, current_user) for p in posts]
    
    # Perform sorting
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

@app.get("/api/posts/{post_id}", response_model=PostResponse)
def get_post_by_id(post_id: int, current_user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return map_db_post_to_response(post, current_user)

@app.post("/api/posts", response_model=PostResponse)
async def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    # Find assembly by tag name or slug
    clean_tag = post_in.assembly_tag.replace("@", "").strip()
    assembly = db.query(Assembly).filter(
        (func.lower(Assembly.assembly_name) == clean_tag.lower()) |
        (func.lower(Assembly.slug) == clean_tag.lower())
    ).first()
    if not assembly:
        raise HTTPException(status_code=400, detail=f"Assembly @{clean_tag} is not a valid constituency in Kerala.")
        
    # Increment issue count on assembly
    assembly.issue_count += 1
        
    # Standardize coordinate coordinates if none provided
    lat = post_in.latitude if post_in.latitude is not None else assembly.latitude
    lon = post_in.longitude if post_in.longitude is not None else assembly.longitude
    
    # Auto category mapping based on simple NLP trigger simulation
    category = post_in.category
    content_lower = post_in.content.lower()
    title_lower = post_in.title.lower()
    
    # Simple local NLP fallback categorization
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
    
    # Broadcast notification to sockets about a new post
    notification = {
        "type": "new_post",
        "post_id": db_post.id,
        "title": db_post.title,
        "assembly_name": assembly.assembly_name,
        "category": db_post.category
    }
    await manager.broadcast(notification)
    
    return map_db_post_to_response(db_post, current_user)

# ----------------- Votes Endpoints -----------------
@app.post("/api/vote")
def submit_vote(vote_in: VoteSubmit, current_user: User = Depends(get_required_current_user), db: Session = Depends(get_db)):
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
        
    # Recalculate upvotes / downvotes counts on the post directly for faster retrieval
    up_count = db.query(Vote).filter(Vote.post_id == post.id, Vote.vote_type == "up").count()
    down_count = db.query(Vote).filter(Vote.post_id == post.id, Vote.vote_type == "down").count()
    
    post.upvotes_count = up_count
    post.downvotes_count = down_count
    db.commit()
    
    return {"status": "success", "upvotes": up_count, "downvotes": down_count}

# ----------------- Comments Endpoints -----------------
@app.post("/api/comments", response_model=CommentResponse)
def create_comment(
    comment_in: CommentCreate,
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
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
    
    # Format Response Object
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

@app.get("/api/comments/{post_id}", response_model=List[CommentResponse])
def get_comments(post_id: int, db: Session = Depends(get_db)):
    # Fetch all comments for a post
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at).all()
    
    # Construct comment tree recursively
    comment_map = {}
    roots = []
    
    for c in comments:
        # Check if parent post is anonymous (irrelevant for comments, comments are not anonymous in current PRD)
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

# ----------------- Representative Action Endpoints -----------------
@app.post("/api/posts/{post_id}/reply", response_model=RepresentativeReplyResponse)
async def submit_representative_reply(
    post_id: int,
    reply_in: RepresentativeReplyCreate,
    status_update: str = "acknowledged",  # acknowledged, resolved
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    # Ensure user is a representative or admin
    if current_user.role not in ["representative", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified representatives can respond officially to citizen reports."
        )
        
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Standardize representative reply
    db_reply = RepresentativeReply(
        post_id=post_id,
        user_id=current_user.id,
        content=reply_in.content,
        progress_proof_url=reply_in.progress_proof_url
    )
    db.add(db_reply)
    
    # Update post status
    if status_update in ["acknowledged", "resolved"]:
        post.status = status_update
        
    db.commit()
    db.refresh(db_reply)
    
    # Broadcast notification to sockets about MLA reply
    notification = {
        "type": "mla_reply",
        "post_id": post.id,
        "title": post.title,
        "mla_name": current_user.mla_name if hasattr(current_user, 'mla_name') else current_user.username,
        "status": post.status
    }
    await manager.broadcast(notification)
    
    # Resolve representative name
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
