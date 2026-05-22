from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import ReportResponse, ReportCreate
from backend.models import User
from backend.utils.security import get_required_current_user
from backend.controllers.report_controller import create_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.post("", response_model=ReportResponse)
def file_report(
    report_in: ReportCreate,
    current_user: User = Depends(get_required_current_user),
    db: Session = Depends(get_db)
):
    return create_report(db, report_in.post_id, report_in.reason, report_in.details, current_user.id)
