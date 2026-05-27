@echo off
chcp 65001 >nul
cd /d "%~dp0server"
echo ================================
echo   每日反思 - 后端服务
echo ================================
echo.
echo 正在启动服务...
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
