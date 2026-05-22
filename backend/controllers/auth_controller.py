from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.models import User, Assembly
from backend.schemas import UserCreate, UserLogin
from backend.utils.security import get_password_hash, verify_password, create_access_token

def register_user(db: Session, user_in: UserCreate) -> User:
    db_user_username = db.query(User).filter(User.username == user_in.username).first()
    if db_user_username:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user_email = db.query(User).filter(User.email == user_in.email).first()
    if db_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user_in.password)
    
    # Create customized dynamic avatar
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
    
    # If registering as a representative, dynamically claim and verify the MLA profile
    if user_in.role == "representative" and user_in.constituency_id:
        assembly = db.query(Assembly).filter(Assembly.id == user_in.constituency_id).first()
        if assembly:
            assembly.mla_name = user_in.username.replace("_", " ").title()
            assembly.mla_verified = True
            
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, login_data: UserLogin) -> dict:
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
