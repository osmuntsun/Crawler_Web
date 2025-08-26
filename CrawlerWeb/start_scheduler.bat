@echo off
echo 啟動 Crawler 排程執行器...
cd /d "C:\Users\User\Desktop\Python\Crawler_Web\CrawlerWeb"
call "D:\python-virtualenv\loveriv\Scripts\activate.bat"
python manage.py run_scheduler --continuous --interval 60
pause
