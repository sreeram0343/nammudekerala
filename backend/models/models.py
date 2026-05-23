from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for Google-only users
    google_id = Column(String, unique=True, index=True, nullable=True)
    role = Column(String, default="citizen", nullable=False)  # citizen, representative, admin
    profile_image = Column(String, nullable=True)
    constituency_id = Column(Integer, ForeignKey("assemblies.id"), nullable=True)

    # Relationships
    constituency = relationship("Assembly", back_populates="users")
    posts = relationship("Post", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    votes = relationship("Vote", back_populates="user")
    official_replies = relationship("RepresentativeReply", back_populates="representative")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    follows = relationship("Follow", back_populates="user", cascade="all, delete-orphan")
    reports_filed = relationship("Report", back_populates="user", cascade="all, delete-orphan")


class Assembly(Base):
    __tablename__ = "assemblies"

    id = Column(Integer, primary_key=True, index=True)
    assembly_name = Column(String, unique=True, index=True, nullable=False)
    district = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    constituency_type = Column(String, default="General", nullable=False)
    followers_count = Column(Integer, default=0, nullable=False)
    issue_count = Column(Integer, default=0, nullable=False)
    mla_name = Column(String, nullable=True)
    mla_verified = Column(Boolean, default=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    users = relationship("User", back_populates="constituency")
    posts = relationship("Post", back_populates="assembly")
    follows = relationship("Follow", back_populates="assembly", cascade="all, delete-orphan")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    media_url = Column(String, nullable=True)
    assembly_id = Column(Integer, ForeignKey("assemblies.id"), nullable=False)
    category = Column(String, nullable=False)  # Roads, Waste, Water, etc.
    upvotes_count = Column(Integer, default=0)
    downvotes_count = Column(Integer, default=0)
    is_anonymous = Column(Boolean, default=False)
    status = Column(String, default="reported")  # reported, acknowledged, resolved
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="posts")
    assembly = relationship("Assembly", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="post", cascade="all, delete-orphan")
    replies = relationship("RepresentativeReply", back_populates="post", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="post", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], back_populates="replies")
    replies = relationship("Comment", back_populates="parent", cascade="all, delete-orphan")


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    vote_type = Column(String, nullable=False)  # up, down

    # Relationships
    user = relationship("User", back_populates="votes")
    post = relationship("Post", back_populates="votes")


class RepresentativeReply(Base):
    __tablename__ = "representative_replies"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # MLA/Rep user id
    content = Column(String, nullable=False)
    progress_proof_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    post = relationship("Post", back_populates="replies")
    representative = relationship("User", back_populates="official_replies")


class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assembly_id = Column(Integer, ForeignKey("assemblies.id"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="follows")
    assembly = relationship("Assembly", back_populates="follows")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    type = Column(String, nullable=False)  # new_post, mla_reply, milestone, etc.
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")
    post = relationship("Post", back_populates="notifications")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    reason = Column(String, nullable=False)
    details = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="reports_filed")
    post = relationship("Post", back_populates="reports")
