from typing import List
from backend.database import get_db
from backend.models import User
from backend.schemas import AssemblyResponse
from backend.utils.security import get_required_current_user
from backend.controllers.follow_controller import (
    toggle_follow_assembly,
    check_follow_status,
    get_followed_assemblies
)

router = APIRouter(prefix="/api/follows", tags=["Follows"])

@router.post("/assembly/{assembly_id}")
def follow_assembly(
    assembly_id: int,
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return toggle_follow_assembly(db, assembly_id, current_user.id)

@router.get("/assembly/{assembly_id}")
def get_assembly_follow_status(
    assembly_id: int,
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return check_follow_status(db, assembly_id, current_user.id)

@router.get("/me", response_model=List[AssemblyResponse])
def get_my_followed_assemblies(
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return get_followed_assemblies(db, current_user.id)

