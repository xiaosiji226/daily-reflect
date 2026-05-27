@echo off
:: Daily Reflect - PM2 auto-start
:: This script runs on user login to restore PM2 processes
cd /d "D:\claude vibe coding project\daily-reflect"
pm2 resurrect
