from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.models import User, Assembly
from backend.schemas import UserCreate, UserLogin, UserGoogleLogin, UserProfileUpdate
from backend.utils.security import get_password_hash, verify_password, create_access_token
from google.oauth2 import id_token
from google.auth.transport import requests
import os

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

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
    if not db_user or not db_user.hashed_password or not verify_password(login_data.password, db_user.hashed_password):
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

def authenticate_google_user(db: Session, google_data: UserGoogleLogin) -> dict:
    try:
        # Verify the Google ID token
        id_info = id_token.verify_oauth2_token(
            google_data.token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        email = id_info.get("email")
        google_id = id_info.get("sub")
        name = id_info.get("name")
        picture = id_info.get("picture")

        if not email:
            raise HTTPException(status_code=400, detail="Google account has no email")

        # 1. Check if user with this google_id exists
        db_user = db.query(User).filter(User.google_id == google_id).first()
        
        # 2. If not, check if user with this email exists (linking)
        if not db_user:
            db_user = db.query(User).filter(User.email == email).first()
            if db_user:
                # Link Google ID to existing email account
                db_user.google_id = google_id
                if picture and not db_user.profile_image:
                    db_user.profile_image = picture
                db.commit()
            else:
                # 3. Create new user
                # Generate unique username from name or email
                base_username = email.split("@")[0].replace(".", "_")
                username = base_username
                counter = 1
                while db.query(User).filter(User.username == username).first():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                db_user = User(
                    username=username,
                    email=email,
                    google_id=google_id,
                    profile_image=picture or f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}",
                    role="citizen"
                )
                db.add(db_user)
                db.commit()
                db.refresh(db_user)

        access_token = create_access_token(data={"sub": db_user.username})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": db_user
        }
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google authentication failed: {str(e)}")

def update_user_profile(db: Session, update_data: UserProfileUpdate, current_user: User) -> User:
    if update_data.username:
        if update_data.username != current_user.username:
            existing_user = db.query(User).filter(User.username == update_data.username).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Username already taken")
            current_user.username = update_data.username
            
    if update_data.profile_image is not None:
        current_user.profile_image = update_data.profile_image
        
    if update_data.constituency_id is not None:
        assembly = db.query(Assembly).filter(Assembly.id == update_data.constituency_id).first()
        if not assembly:
            raise HTTPException(status_code=404, detail="Assembly constituency not found")
        current_user.constituency_id = update_data.constituency_id
        
        # If user is representative, link/claim the MLA profile
        if current_user.role == "representative":
            assembly.mla_name = current_user.username.replace("_", " ").title()
            assembly.mla_verified = True
            
    db.commit()
    db.refresh(current_user)
    return current_user

