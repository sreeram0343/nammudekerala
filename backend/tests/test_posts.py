import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from backend.database import Base
from backend.models import User, Assembly, Post, Vote, Notification
from backend.schemas import PostCreate, VoteSubmit
from backend.controllers.post_controller import (
    create_new_post,
    submit_post_vote,
    delete_user_post
)

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
    
    # Seed test users
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
    db.commit()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.mark.asyncio
async def test_create_post_success_and_nlp_categorization(db):
    user = db.query(User).filter(User.id == 1).first()
    
    # 1. Test "Roads" category categorization
    post_in = PostCreate(
        title="Big pothole near bypass",
        content="There is a huge road pothole making driving dangerous.",
        assembly_tag="@Kazhakuttom",
        category="General"
    )
    post = await create_new_post(db, post_in, user)
    assert post["title"] == "Big pothole near bypass"
    assert post["category"] == "Roads"
    assert post["status"] == "reported"
    
    # Verify assembly issue_count was incremented
    assembly = db.query(Assembly).filter(Assembly.id == 1).first()
    assert assembly.issue_count == 1

    # 2. Test "Water" category categorization
    post_in_water = PostCreate(
        title="Drinking water leak",
        content="Water pipe broke and clean drinking water is leaking.",
        assembly_tag="@Kazhakuttom",
        category="General"
    )
    post_water = await create_new_post(db, post_in_water, user)
    assert post_water["category"] == "Water"

@pytest.mark.asyncio
async def test_create_post_invalid_assembly(db):
    user = db.query(User).filter(User.id == 1).first()
    post_in = PostCreate(
        title="Pothole",
        content="Road is broken.",
        assembly_tag="@InvalidAssembly",
        category="General"
    )
    with pytest.raises(HTTPException) as exc_info:
        await create_new_post(db, post_in, user)
    assert exc_info.value.status_code == 400
    assert "is not a valid constituency in Kerala" in exc_info.value.detail

@pytest.mark.asyncio
async def test_submit_post_vote_and_milestones(db):
    user1 = db.query(User).filter(User.id == 1).first()
    user2 = db.query(User).filter(User.id == 2).first()
    
    # Create a post
    post_in = PostCreate(
        title="Pothole",
        content="Road is broken.",
        assembly_tag="@Kazhakuttom",
        category="General"
    )
    post_res = await create_new_post(db, post_in, user1)
    post_id = post_res["id"]
    
    # Vote UP by user 2
    vote_in = VoteSubmit(post_id=post_id, vote_type="up")
    res = await submit_post_vote(db, vote_in, user2)
    assert res["status"] == "success"
    assert res["upvotes"] == 1
    
    # Retrieve post to check vote count
    post = db.query(Post).filter(Post.id == post_id).first()
    assert post.upvotes_count == 1
    
    # Retract vote by user 2
    vote_retract = VoteSubmit(post_id=post_id, vote_type="none")
    res_retract = await submit_post_vote(db, vote_retract, user2)
    assert res_retract["upvotes"] == 0

def test_delete_post_success(db):
    # Setup: Create a post
    post = Post(
        id=10,
        user_id=1,
        title="To Be Deleted",
        content="Some content",
        assembly_id=1,
        category="Roads"
    )
    db.add(post)
    assembly = db.query(Assembly).filter(Assembly.id == 1).first()
    assembly.issue_count = 1
    db.commit()
    
    # Delete by owner
    res = delete_user_post(db, post_id=10, user_id=1, user_role="citizen")
    assert res["status"] == "success"
    
    # Verify deleted from DB
    assert db.query(Post).filter(Post.id == 10).first() is None
    # Verify assembly issue count decremented
    assert assembly.issue_count == 0

def test_delete_post_unauthorized(db):
    post = Post(
        id=20,
        user_id=1,
        title="Private Post",
        content="Some content",
        assembly_id=1,
        category="Roads"
    )
    db.add(post)
    db.commit()
    
    # Try to delete by user 2 (non-admin, non-owner)
    with pytest.raises(HTTPException) as exc_info:
        delete_user_post(db, post_id=20, user_id=2, user_role="citizen")
    assert exc_info.value.status_code == 403
