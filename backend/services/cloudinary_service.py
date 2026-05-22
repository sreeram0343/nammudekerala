import os
import uuid
import shutil
from fastapi import UploadFile
import cloudinary
import cloudinary.uploader

# Check for Cloudinary credentials
CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
API_KEY = os.getenv("CLOUDINARY_API_KEY")
API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

is_cloudinary_configured = bool(CLOUD_NAME and API_KEY and API_SECRET)

if is_cloudinary_configured:
    cloudinary.config(
        cloud_name=CLOUD_NAME,
        api_key=API_KEY,
        api_secret=API_SECRET,
        secure=True
    )

def upload_media_file(file: UploadFile, base_url: str) -> str:
    """
    Uploads a file to Cloudinary if configured. 
    Otherwise, saves it locally under the uploads directory.
    """
    if is_cloudinary_configured:
        try:
            # resource_type="auto" automatically handles images, videos, audio, etc.
            upload_result = cloudinary.uploader.upload(
                file.file,
                resource_type="auto",
                folder="nammude_kerala"
            )
            return upload_result.get("secure_url")
        except Exception as e:
            # Gracefully log or print error and fall back to local storage if Cloudinary fails
            print(f"Cloudinary upload failed: {e}. Falling back to local storage.")
    
    # Local Storage Fallback
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, filename)
    
    # Reset file pointer to beginning before reading
    file.file.seek(0)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Standardize url paths to prevent double slashes
    clean_base = base_url.rstrip("/")
    return f"{clean_base}/uploads/{filename}"
