@echo off
chcp 65001 >nul
cd /d "%~dp0client"
echo ================================
echo   每日反思 - 前端服务
echo ================================
echo.
echo 正在启动开发服务器...
echo 启动后在手机浏览器打开: http://你的电脑IP:5173
echo.
npm run dev -- --host
pause
