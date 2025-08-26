#!/usr/bin/env python
"""
測試 Django 管理頁面篩選器的腳本
"""

import os
import sys
import django
from pathlib import Path

# 設置 Django 環境
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CrawlerWeb.settings')

# 初始化 Django
django.setup()

from Crawler.admin import ExecutionDaysFilter, UserFilter
from Crawler.models import Schedule
from django.contrib.admin import ModelAdmin
from django.test import RequestFactory

def test_execution_days_filter():
    """測試執行日期篩選器"""
    print("=" * 50)
    print("測試執行日期篩選器")
    print("=" * 50)
    
    # 創建模擬的 ModelAdmin 實例
    class MockModelAdmin:
        def __init__(self):
            self.model = Schedule
    
    model_admin = MockModelAdmin()
    
    # 創建篩選器實例
    filter_instance = ExecutionDaysFilter(None, {}, Schedule, model_admin)
    
    # 測試 lookups 方法
    lookups = filter_instance.lookups(None, model_admin)
    print("執行日期選項:")
    for value, label in lookups:
        print(f"  {value}: {label}")
    
    # 測試查詢
    print("\n測試查詢:")
    queryset = Schedule.objects.all()
    print(f"總排程數量: {queryset.count()}")
    
    # 測試週一的篩選
    monday_filter = ExecutionDaysFilter(None, {'execution_days': 'monday'}, Schedule, model_admin)
    monday_queryset = monday_filter.queryset(None, queryset)
    print(f"週一排程數量: {monday_queryset.count()}")
    
    # 測試週二的篩選
    tuesday_filter = ExecutionDaysFilter(None, {'execution_days': 'tuesday'}, Schedule, model_admin)
    tuesday_queryset = tuesday_filter.queryset(None, queryset)
    print(f"週二排程數量: {tuesday_queryset.count()}")

def test_user_filter():
    """測試使用者篩選器"""
    print("\n" + "=" * 50)
    print("測試使用者篩選器")
    print("=" * 50)
    
    # 創建模擬的 ModelAdmin 實例
    class MockModelAdmin:
        def __init__(self):
            self.model = Schedule
    
    model_admin = MockModelAdmin()
    
    # 創建篩選器實例
    filter_instance = UserFilter(None, {}, Schedule, model_admin)
    
    # 測試 lookups 方法
    lookups = filter_instance.lookups(None, model_admin)
    print("使用者選項:")
    for user_id, username in lookups:
        print(f"  {user_id}: {username}")
    
    # 測試查詢
    print("\n測試查詢:")
    queryset = Schedule.objects.all()
    print(f"總排程數量: {queryset.count()}")
    
    if lookups:
        # 測試第一個使用者的篩選
        first_user_id = lookups[0][0]
        first_username = lookups[0][1]
        user_filter = UserFilter(None, {'user': first_user_id}, Schedule, model_admin)
        user_queryset = user_filter.queryset(None, queryset)
        print(f"使用者 '{first_username}' 的排程數量: {user_queryset.count()}")

def test_schedule_data():
    """測試排程數據"""
    print("\n" + "=" * 50)
    print("測試排程數據")
    print("=" * 50)
    
    schedules = Schedule.objects.all()
    print(f"總排程數量: {schedules.count()}")
    
    for schedule in schedules:
        print(f"\n排程 ID: {schedule.id}")
        print(f"名稱: {schedule.name}")
        print(f"使用者: {schedule.user.username}")
        print(f"執行日期: {schedule.execution_days}")
        print(f"發文時間: {schedule.posting_times}")
        print(f"狀態: {schedule.status}")
        print(f"啟用: {schedule.is_active}")

if __name__ == '__main__':
    try:
        test_execution_days_filter()
        test_user_filter()
        test_schedule_data()
        print("\n[SUCCESS] 所有測試完成！")
    except Exception as e:
        print(f"\n[ERROR] 測試失敗: {str(e)}")
        import traceback
        traceback.print_exc()
