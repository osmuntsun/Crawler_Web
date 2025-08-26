#!/usr/bin/env python
"""
排程執行器監控腳本
用於檢查排程執行器的狀態和執行記錄
"""

import os
import sys
import django
from pathlib import Path
from datetime import datetime, timedelta

# 設置 Django 環境
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CrawlerWeb.settings')

# 初始化 Django
django.setup()

from Crawler.models import Schedule, ScheduleExecution
from django.utils import timezone

def monitor_scheduler():
    """監控排程執行器狀態"""
    print("=" * 60)
    print("          排程執行器監控報告")
    print("=" * 60)
    
    now = timezone.now()
    print(f"檢查時間: {now}")
    print(f"當前星期: {now.strftime('%A').lower()}")
    print(f"當前時間: {now.time()}")
    print()
    
    # 檢查活躍排程
    active_schedules = Schedule.objects.filter(
        is_active=True,
        status='active'
    )
    
    print(f"活躍排程數量: {active_schedules.count()}")
    print("-" * 60)
    
    for schedule in active_schedules:
        print(f"排程 ID: {schedule.id}")
        print(f"名稱: {schedule.name}")
        print(f"執行日期: {schedule.execution_days}")
        print(f"發文時間: {schedule.posting_times}")
        print(f"總執行次數: {schedule.total_executions}")
        print(f"成功次數: {schedule.successful_executions}")
        print(f"失敗次數: {schedule.failed_executions}")
        print(f"最後執行時間: {schedule.last_execution_time}")
        
        # 檢查是否應該執行
        should_execute = check_schedule_execution(schedule, now)
        print(f"現在應該執行: {'是' if should_execute else '否'}")
        print("-" * 60)
    
    # 檢查最近的執行記錄
    print("\n最近執行記錄:")
    print("-" * 60)
    
    recent_executions = ScheduleExecution.objects.all().order_by('-scheduled_time')[:10]
    
    if recent_executions:
        for execution in recent_executions:
            print(f"排程ID: {execution.schedule_id}")
            print(f"狀態: {execution.status}")
            print(f"執行時間: {execution.scheduled_time}")
            print(f"成功發布: {execution.posts_published}")
            print(f"失敗數量: {execution.posts_failed}")
            print(f"錯誤信息: {execution.error_message if hasattr(execution, 'error_message') else '無'}")
            print("-" * 30)
    else:
        print("沒有找到執行記錄")
    
    # 檢查下一個要執行的排程
    print("\n下一個要執行的排程:")
    print("-" * 60)
    
    next_schedule = find_next_schedule(now)
    if next_schedule:
        print(f"排程ID: {next_schedule['id']}")
        print(f"名稱: {next_schedule['name']}")
        print(f"下次執行時間: {next_schedule['next_time']}")
        print(f"距離現在: {next_schedule['time_until']}")
    else:
        print("今天沒有更多要執行的排程")

def check_schedule_execution(schedule, now):
    """檢查排程是否應該執行"""
    # 檢查日期
    current_weekday = now.strftime('%A').lower()
    if current_weekday not in schedule.execution_days:
        return False
    
    # 檢查時間
    current_time = now.time()
    for time_str in schedule.posting_times:
        try:
            schedule_time = datetime.strptime(time_str, '%H:%M').time()
            time_diff = abs((current_time.hour * 60 + current_time.minute) - 
                           (schedule_time.hour * 60 + schedule_time.minute))
            if time_diff <= 5:  # 5分鐘容錯
                return True
        except ValueError:
            continue
    
    return False

def find_next_schedule(now):
    """找到下一個要執行的排程"""
    active_schedules = Schedule.objects.filter(
        is_active=True,
        status='active'
    )
    
    next_schedule = None
    min_time_diff = float('inf')
    
    for schedule in active_schedules:
        current_weekday = now.strftime('%A').lower()
        if current_weekday not in schedule.execution_days:
            continue
        
        for time_str in schedule.posting_times:
            try:
                schedule_time = datetime.strptime(time_str, '%H:%M').time()
                schedule_datetime = datetime.combine(now.date(), schedule_time)
                
                # 如果時間已經過了，跳到下一天
                if schedule_datetime <= now:
                    schedule_datetime += timedelta(days=1)
                
                time_diff = (schedule_datetime - now).total_seconds()
                
                if time_diff < min_time_diff:
                    min_time_diff = time_diff
                    next_schedule = {
                        'id': schedule.id,
                        'name': schedule.name,
                        'next_time': schedule_datetime,
                        'time_until': str(timedelta(seconds=int(time_diff)))
                    }
            except ValueError:
                continue
    
    return next_schedule

if __name__ == '__main__':
    monitor_scheduler()
