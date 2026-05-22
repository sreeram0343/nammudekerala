from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.schemas import AssemblyResponse, AssemblyStats
from backend.controllers.assembly_controller import get_all_assemblies, get_global_stats, get_assembly_stats

router = APIRouter(tags=["Assemblies"])

@router.get("/api/assemblies", response_model=List[AssemblyResponse])
def get_assemblies(db: Session = Depends(get_db)):
    return get_all_assemblies(db)

@router.get("/api/stats")
def get_global_analytics(db: Session = Depends(get_db)):
    return get_global_stats(db)

@router.get("/api/assembly/{name}", response_model=AssemblyStats)
def get_constituency_stats(name: str, db: Session = Depends(get_db)):
    return get_assembly_stats(db, name)
