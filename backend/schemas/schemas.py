from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# ----------------- User Schemas -----------------
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str = "citizen"  # citizen, representative, admin
    constituency_id: Optional[int] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    profile_image: Optional[str] = None
    constituency_id: Optional[int] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# ----------------- Assembly Schemas -----------------
class AssemblyBase(BaseModel):
    assembly_name: str
    district: str
    slug: str
    constituency_type: str = "General"
    followers_count: int = 0
    issue_count: int = 0
    mla_name: Optional[str] = None
    mla_verified: bool = False
    latitude: float
    longitude: float
    created_at: datetime

class AssemblyResponse(AssemblyBase):
    id: int

    class Config:
        from_attributes = True

class AssemblyStats(BaseModel):
    id: int
    assembly_name: str
    district: str
    slug: str
    constituency_type: str
    followers_count: int
    issue_count: int
    mla_name: Optional[str] = None
    mla_verified: bool
    total_issues: int
    resolved_issues: int
    acknowledged_issues: int
    ignored_issues: int
    resolution_rate: float
    created_at: datetime

# ----------------- Representative Reply Schemas -----------------
class RepresentativeReplyCreate(BaseModel):
    content: str
    progress_proof_url: Optional[str] = None

class RepresentativeReplyResponse(BaseModel):
    id: int
    post_id: int
    content: str
    progress_proof_url: Optional[str] = None
    created_at: datetime
    representative_name: str

    class Config:
        from_attributes = True

# ----------------- Post Schemas -----------------
class PostCreate(BaseModel):
    title: str
    content: str
    media_url: Optional[str] = None
    assembly_tag: str  # e.g. "Kazhakuttom"
    category: str
    is_anonymous: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    media_url: Optional[str] = None
    assembly_id: int
    assembly_name: str
    assembly_slug: str
    category: str
    upvotes_count: int
    downvotes_count: int
    is_anonymous: bool
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    comments_count: int
    user_id: Optional[int] = None
    username: str  # "Anonymous" if is_anonymous is True
    user_image: Optional[str] = None
    user_role: str
    user_vote: Optional[str] = None  # "up", "down", or null for the current user
    replies: List[RepresentativeReplyResponse] = []

    class Config:
        from_attributes = True

# ----------------- Comment Schemas -----------------
class CommentCreate(BaseModel):
    post_id: int
    content: str
    parent_id: Optional[int] = None

class CommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: Optional[int] = None
    username: str
    user_image: Optional[str] = None
    user_role: str
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
    replies: List['CommentResponse'] = []

    class Config:
        from_attributes = True

# Required for self-referential nested replies in Pydantic
CommentResponse.model_rebuild()

# ----------------- Vote Schemas -----------------
class VoteSubmit(BaseModel):
    post_id: int
    vote_type: str  # "up", "down", or "none" (to retract)

# ----------------- Follow Schemas -----------------
class FollowToggle(BaseModel):
    assembly_id: int

class FollowResponse(BaseModel):
    id: int
    user_id: int
    assembly_id: int

    class Config:
        from_attributes = True

# ----------------- Notification Schemas -----------------
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    post_id: Optional[int] = None
    type: str
    title: str
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Report Schemas -----------------
class ReportCreate(BaseModel):
    post_id: int
    reason: str
    details: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    reason: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
