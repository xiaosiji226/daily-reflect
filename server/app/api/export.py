import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query

from ..config import Settings
from ..services.obsidian_service import ObsidianService, ObsidianExportError

router = APIRouter(prefix="/api/export", tags=["export"])

_obsidian_service: ObsidianService | None = None


def get_settings() -> Settings:
    return Settings()


def get_obsidian_service() -> ObsidianService:
    global _obsidian_service
    if _obsidian_service is None:
        _obsidian_service = ObsidianService(get_settings())
    return _obsidian_service


@router.get("/config")
async def get_export_config():
    settings = get_settings()
    return {"obsidian_vault_path": settings.obsidian_vault_path or None}


@router.post("/browse-folder")
async def browse_folder():
    try:
        import tkinter as tk
        from tkinter import filedialog
    except ImportError:
        raise HTTPException(status_code=500, detail={"error": "系统不支持文件夹选择，请手动输入路径", "detail": "tkinter not available"})

    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    folder_path = filedialog.askdirectory(title="选择导出目标文件夹")
    root.destroy()

    if not folder_path:
        raise HTTPException(status_code=400, detail={"error": "未选择文件夹", "detail": ""})

    return {"path": folder_path}


@router.post("")
async def export_entries(
    body: dict,
    service: ObsidianService = Depends(get_obsidian_service),
):
    dates = body.get("dates", [])
    if not dates:
        raise HTTPException(status_code=400, detail={"error": "请提供要导出的日期列表", "detail": ""})

    target_path = body.get("target_path", None)

    try:
        result = service.export(dates, target_path)
    except ObsidianExportError as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "detail": ""})

    return result
