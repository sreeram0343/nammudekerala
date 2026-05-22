from fastapi import APIRouter, UploadFile, File, Request
from backend.services.cloudinary_service import upload_media_file

router = APIRouter(tags=["Uploads"])

@router.post("/api/upload")
def upload_file(request: Request, file: UploadFile = File(...)):
    # Dynamically determine request's base URL (e.g. http://localhost:8000 or https://your-app.onrender.com)
    base_url = str(request.base_url)
    media_url = upload_media_file(file, base_url)
    return {"url": media_url}
