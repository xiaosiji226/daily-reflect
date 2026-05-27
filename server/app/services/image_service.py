import os
import uuid
from pathlib import Path
from fastapi import UploadFile
from PIL import Image
import io

from ..config import Settings


class ImageValidationError(Exception):
    pass


class ImageService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.data_dir = Path(settings.data_dir)
        self.images_dir = self.data_dir / "images"
        self.max_bytes = settings.max_image_size_mb * 1024 * 1024

    def validate(self, file: UploadFile) -> None:
        if file.content_type not in self.settings.allowed_image_types:
            raise ImageValidationError(f"不支持的图片格式: {file.content_type}")
        if file.size and file.size > self.max_bytes:
            raise ImageValidationError(f"图片大小不能超过 {self.settings.max_image_size_mb}MB")

    async def save(self, file: UploadFile, date_str: str, note_id: str, seq: int) -> str:
        """Save an uploaded image, return relative path like '2026/05/n2-001.jpg'."""
        self.validate(file)

        contents = await file.read()

        # Open and process with Pillow
        img = Image.open(io.BytesIO(contents))

        # Convert HEIC/HEIF to JPEG
        if img.format in ('HEIC', 'HEIF'):
            img = img.convert('RGB')
            ext = 'jpg'
        else:
            ext = file.filename.split('.')[-1].lower() if file.filename else 'jpg'
            if ext not in ('jpg', 'jpeg', 'png', 'webp'):
                ext = 'jpg'

        # Strip EXIF
        data = list(img.getdata())
        img_no_exif = Image.new(img.mode, img.size)
        img_no_exif.putdata(data)

        # Resize if too large (max 2048px on longest side)
        max_dim = 2048
        if img_no_exif.width > max_dim or img_no_exif.height > max_dim:
            img_no_exif.thumbnail((max_dim, max_dim), Image.LANCZOS)

        # Build path
        year, month, day = date_str.split("-")
        filename = f"{note_id}-{seq:03d}.{ext}"
        rel_dir = Path(year) / month
        abs_dir = self.images_dir / rel_dir
        abs_dir.mkdir(parents=True, exist_ok=True)

        save_path = abs_dir / filename
        img_no_exif.save(save_path, quality=85, optimize=True)

        return str(rel_dir / filename).replace("\\", "/")

    def get_abs_path(self, rel_path: str) -> Path:
        return self.images_dir / rel_path
