from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..config import Settings

router = APIRouter(prefix="/api/images", tags=["images"])


@router.get("/{year}/{month}/{filename}")
async def get_image(
    year: str,
    month: str,
    filename: str,
):
    settings = Settings()
    data_dir = Path(settings.data_dir)
    file_path = data_dir / "images" / year / month / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail={"error": "图片不存在", "detail": str(file_path)})

    return FileResponse(file_path)
