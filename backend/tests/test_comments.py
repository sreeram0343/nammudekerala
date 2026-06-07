import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from backend.database import Base
from backend.models import User, Assembly, Post, Comment, Report
from backend.schemas import CommentCreate
from backend.controllers.comment_controller import (
    create_new_comment,
    get_post_comments_tree,
    delete_user_comment
)
from backend.controllers.report_controller import create_report

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(name="db")
def db_fixture():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed a test assembly
    test_assembly = Assembly(
        id=1,
        assembly_name="Kazhakuttom",
        district="Thiruvananthapuram",
        slug="kazhakuttom",
        latitude=8.5686,
        longitude=76.8731
    )
    db.add(test_assembly)
    
    # Seed users
    user1 = User(
        id=1,
        username="citizen_one",
        email="one@example.com",
        role="citizen"
    )
    user2 = User(
        id=2,
        username="citizen_two",
        email="two@example.com",
        role="citizen"
    )
    db.add(user1)
    db.add(user2)
    
    # Seed a post
    post = Post(
        id=100,
        user_id=1,
        title="Broke bridge",
        content="The bridge is broken.",
        assembly_id=1,
        category="Roads"
    )
    db.add(post)
    db.commit()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.mark.asyncio
async def test_comments_creation_and_tree(db):
    user1 = db.query(User).filter(User.id == 1).first()
    user2 = db.query(User).filter(User.id == 2).first()
    
    # Create main comment by user 2
    comment_in = CommentCreate(post_id=100, content="I agree, it's very dangerous.")
    c1 = await create_new_comment(db, comment_in, user2)
    assert c1["content"] == "I agree, it's very dangerous."
    assert c1["parent_id"] is None
    
    # Create reply by user 1 to c1
    reply_in = CommentCreate(post_id=100, content="Yes, we need actions soon.", parent_id=c1["id"])
    c2 = await create_new_comment(db, reply_in, user1)
    assert c2["parent_id"] == c1["id"]
    
    # Retrieve comments tree
    tree = get_post_comments_tree(db, 100)
    assert len(tree) == 1
    assert tree[0]["id"] == c1["id"]
    assert len(tree[0]["replies"]) == 1
    assert tree[0]["replies"][0]["id"] == c2["id"]

@pytest.mark.asyncio
async def test_delete_comment_authorized_and_unauthorized(db):
    user1 = db.query(User).filter(User.id == 1).first()
    user2 = db.query(User).filter(User.id == 2).first()
    
    comment_in = CommentCreate(post_id=100, content="Test comment")
    c1 = await create_new_comment(db, comment_in, user2)
    
    # Try to delete comment by user 1 (unauthorized)
    with pytest.raises(HTTPException) as exc_info:
        delete_user_comment(db, comment_id=c1["id"], user_id=user1.id, user_role="citizen")
    assert exc_info.value.status_code == 403
    
    # Delete comment by user 2 (owner)
    res = delete_user_comment(db, comment_id=c1["id"], user_id=user2.id, user_role="citizen")
    assert res["status"] == "success"
    assert db.query(Comment).filter(Comment.id == c1["id"]).first() is None

def test_file_report_success(db):
    res = create_report(db, post_id=100, reason="Spam", details="Repeated posting", user_id=2)
    assert res.id is not None
    assert res.post_id == 100
    assert res.reason == "Spam"
    assert res.user_id == 2
    
    # Verify in DB
    report = db.query(Report).filter(Report.id == res.id).first()
    assert report is not None
    assert report.details == "Repeated posting"
