from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import UserCreate, UserResponse, UserLogin, Token, UserGoogleLogin
from backend.utils.security import get_required_current_user
from backend.models import User
from backend.controllers.auth_controller import register_user, authenticate_user, authenticate_google_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserResponse)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, user_in)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    return authenticate_user(db, login_data)

@router.post("/google-login", response_model=Token)
def google_login(google_data: UserGoogleLogin, db: Session = Depends(get_db)):
    return authenticate_google_user(db, google_data)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_required_current_user)):
    return current_user
