@echo off
title Crawler 排程執行器
echo ========================================
echo     Crawler 排程執行器啟動腳本
echo ========================================
echo.

:: 檢查虛擬環境是否存在
if not exist "D:\python-virtualenv\loveriv\Scripts\activate.bat" (
    echo 錯誤：找不到虛擬環境 D:\python-virtualenv\loveriv\Scripts\activate.bat
    echo 請檢查虛擬環境路徑是否正確
    pause
    exit /b 1
)

:: 切換到專案目錄
cd /d "C:\Users\User\Desktop\Python\Crawler_Web\CrawlerWeb"
if errorlevel 1 (
    echo 錯誤：無法切換到專案目錄
    pause
    exit /b 1
)

echo 專案目錄：%CD%
echo.

:: 啟動虛擬環境
echo 啟動虛擬環境...
call "D:\python-virtualenv\loveriv\Scripts\activate.bat"
if errorlevel 1 (
    echo 錯誤：無法啟動虛擬環境
    pause
    exit /b 1
)

echo 虛擬環境已啟動
echo.

:: 檢查 Django 專案
echo 檢查 Django 專案...
python manage.py check --deploy
if errorlevel 1 (
    echo 警告：Django 專案檢查發現問題
    echo 但將繼續嘗試啟動排程執行器
    echo.
)

:: 啟動排程執行器
echo 啟動排程執行器...
echo 檢查間隔：60秒
echo 模式：持續運行
echo.
echo 按 Ctrl+C 停止排程執行器
echo ========================================
echo.

python manage.py run_scheduler --continuous --interval 60 --verbosity 2

echo.
echo 排程執行器已停止
pause
