#!/usr/bin/env python
"""
測試排程邏輯的腳本
"""

import os
import sys
import django
from pathlib import Path
from datetime import datetime

# 設置 Django 環境
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CrawlerWeb.settings')

# 初始化 Django
django.setup()

from Crawler.models import Schedule
from django.utils import timezone

def test_schedule_logic():
    """測試排程邏輯"""
    now = timezone.now()
    print(f"當前時間: {now}")
    print(f"當前星期: {now.strftime('%A').lower()}")
    print(f"當前時間: {now.time()}")
    print("-" * 50)
    
    # 獲取所有活躍的排程
    active_schedules = Schedule.objects.filter(
        is_active=True,
        status='active'
    )
    
    print(f"找到 {active_schedules.count()} 個活躍排程")
    print("-" * 50)
    
    for schedule in active_schedules:
        print(f"排程 ID: {schedule.id}")
        print(f"名稱: {schedule.name}")
        print(f"執行日期: {schedule.execution_days}")
        print(f"發文時間: {schedule.posting_times}")
        
        # 檢查是否為執行日期
        current_weekday = now.strftime('%A').lower()
        date_match = current_weekday in schedule.execution_days
        print(f"日期匹配: {date_match} (當前: {current_weekday})")
        
        # 檢查是否為執行時間
        current_time = now.time()
        time_match = False
        matched_time = None
        
        for time_str in schedule.posting_times:
            try:
                schedule_time = datetime.strptime(time_str, '%H:%M').time()
                # 如果當前時間在排程時間的5分鐘內，則執行
                time_diff = abs((current_time.hour * 60 + current_time.minute) - 
                               (schedule_time.hour * 60 + schedule_time.minute))
                if time_diff <= 5:  # 5分鐘的容錯時間
                    time_match = True
                    matched_time = time_str
                    break
            except ValueError as e:
                print(f"時間格式錯誤: {time_str}, 錯誤: {e}")
                continue
        
        print(f"時間匹配: {time_match}")
        if matched_time:
            print(f"匹配的時間: {matched_time}")
        
        should_execute = date_match and time_match
        print(f"應該執行: {should_execute}")
        print("-" * 50)

if __name__ == '__main__':
    test_schedule_logic()
