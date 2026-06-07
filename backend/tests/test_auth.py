import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from backend.database import Base
from backend.models import User, Assembly
from backend.schemas import UserCreate, UserLogin, UserProfileUpdate
from backend.controllers.auth_controller import (
    register_user,
    authenticate_user,
    update_user_profile
)

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(name="db")
def db_fixture():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed a test assembly for testing constituency relationships
    test_assembly = Assembly(
        id=1,
        assembly_name="Vattiyoorkavu",
        district="Thiruvananthapuram",
        slug="vattiyoorkavu",
        latitude=8.5241,
        longitude=76.9791
    )
    db.add(test_assembly)
    db.commit()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_register_user_success(db):
    user_in = UserCreate(
        username="testcitizen",
        email="testcitizen@example.com",
        password="securepassword123",
        role="citizen",
        constituency_id=1
    )
    user = register_user(db, user_in)
    assert user.username == "testcitizen"
    assert user.email == "testcitizen@example.com"
    assert user.role == "citizen"
    assert user.constituency_id == 1
    assert user.hashed_password is not None
    assert "testcitizen" in user.profile_image

def test_register_duplicate_username(db):
    user_in_1 = UserCreate(
        username="dupuser",
        email="user1@example.com",
        password="password123"
    )
    register_user(db, user_in_1)
    
    user_in_2 = UserCreate(
        username="dupuser",
        email="user2@example.com",
        password="password123"
    )
    with pytest.raises(HTTPException) as exc_info:
        register_user(db, user_in_2)
    assert exc_info.value.status_code == 400
    assert "Username already registered" in exc_info.value.detail

def test_register_duplicate_email(db):
    user_in_1 = UserCreate(
        username="user1",
        email="dup@example.com",
        password="password123"
    )
    register_user(db, user_in_1)
    
    user_in_2 = UserCreate(
        username="user2",
        email="dup@example.com",
        password="password123"
    )
    with pytest.raises(HTTPException) as exc_info:
        register_user(db, user_in_2)
    assert exc_info.value.status_code == 400
    assert "Email already registered" in exc_info.value.detail

def test_register_representative_mla_claim(db):
    user_in = UserCreate(
        username="mla_rajesh",
        email="rajesh@mla.kerala.gov.in",
        password="securepass123",
        role="representative",
        constituency_id=1
    )
    user = register_user(db, user_in)
    assert user.role == "representative"
    
    # Verify the assembly mla fields were claimed and verified
    assembly = db.query(Assembly).filter(Assembly.id == 1).first()
    assert assembly.mla_name == "Mla Rajesh"
    assert assembly.mla_verified is True

def test_authenticate_user_success(db):
    user_in = UserCreate(
        username="authuser",
        email="auth@example.com",
        password="mypassword"
    )
    register_user(db, user_in)
    
    login_data = UserLogin(username="authuser", password="mypassword")
    auth_result = authenticate_user(db, login_data)
    
    assert "access_token" in auth_result
    assert auth_result["token_type"] == "bearer"
    assert auth_result["user"].username == "authuser"

def test_authenticate_user_invalid_password(db):
    user_in = UserCreate(
        username="authuser",
        email="auth@example.com",
        password="mypassword"
    )
    register_user(db, user_in)
    
    login_data = UserLogin(username="authuser", password="wrongpassword")
    with pytest.raises(HTTPException) as exc_info:
        authenticate_user(db, login_data)
    assert exc_info.value.status_code == 401
    assert "Incorrect username or password" in exc_info.value.detail

def test_update_profile_success(db):
    user_in = UserCreate(
        username="profileuser",
        email="profile@example.com",
        password="password"
    )
    user = register_user(db, user_in)
    
    update_data = UserProfileUpdate(
        username="updateduser",
        profile_image="https://example.com/new_avatar.png",
        constituency_id=1
    )
    updated_user = update_user_profile(db, update_data, user)
    
    assert updated_user.username == "updateduser"
    assert updated_user.profile_image == "https://example.com/new_avatar.png"
    assert updated_user.constituency_id == 1

def test_update_profile_username_taken(db):
    user_in_1 = UserCreate(
        username="userone",
        email="one@example.com",
        password="password"
    )
    user_1 = register_user(db, user_in_1)
    
    user_in_2 = UserCreate(
        username="usertwo",
        email="two@example.com",
        password="password"
    )
    user_2 = register_user(db, user_in_2)
    
    # Try to change user_2's username to userone
    update_data = UserProfileUpdate(username="userone")
    with pytest.raises(HTTPException) as exc_info:
        update_user_profile(db, update_data, user_2)
    assert exc_info.value.status_code == 400
    assert "Username already taken" in exc_info.value.detail
