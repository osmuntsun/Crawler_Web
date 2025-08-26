#!/usr/bin/env python
"""
測試排程執行記錄篩選器的腳本
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

from Crawler.admin import ScheduleExecutionUserFilter
from Crawler.models import ScheduleExecution
from django.contrib.admin import ModelAdmin

def test_schedule_execution_user_filter():
    """測試排程執行記錄使用者篩選器"""
    print("=" * 60)
    print("測試排程執行記錄使用者篩選器")
    print("=" * 60)
    
    # 創建模擬的 ModelAdmin 實例
    class MockModelAdmin:
        def __init__(self):
            self.model = ScheduleExecution
    
    model_admin = MockModelAdmin()
    
    # 創建篩選器實例
    filter_instance = ScheduleExecutionUserFilter(None, {}, ScheduleExecution, model_admin)
    
    # 測試 lookups 方法
    lookups = filter_instance.lookups(None, model_admin)
    print("使用者選項:")
    for user_id, username in lookups:
        print(f"  {user_id}: {username}")
    
    # 測試查詢
    print("\n測試查詢:")
    queryset = ScheduleExecution.objects.all()
    print(f"總執行記錄數量: {queryset.count()}")
    
    if lookups:
        # 測試第一個使用者的篩選
        first_user_id = lookups[0][0]
        first_username = lookups[0][1]
        user_filter = ScheduleExecutionUserFilter(None, {'user': first_user_id}, ScheduleExecution, model_admin)
        user_queryset = user_filter.queryset(None, queryset)
        print(f"使用者 '{first_username}' 的執行記錄數量: {user_queryset.count()}")
    
    # 檢查是否有重複的使用者
    user_ids = [lookup[0] for lookup in lookups]
    unique_user_ids = set(user_ids)
    
    if len(user_ids) == len(unique_user_ids):
        print("\n✅ 使用者篩選器沒有重複用戶")
    else:
        print(f"\n❌ 使用者篩選器有重複用戶: 總數 {len(user_ids)}, 唯一數 {len(unique_user_ids)}")

def test_schedule_execution_data():
    """測試排程執行記錄數據"""
    print("\n" + "=" * 60)
    print("測試排程執行記錄數據")
    print("=" * 60)
    
    executions = ScheduleExecution.objects.all()
    print(f"總執行記錄數量: {executions.count()}")
    
    # 按使用者分組統計
    user_stats = {}
    for execution in executions:
        if hasattr(execution, 'schedule') and execution.schedule and execution.schedule.user:
            username = execution.schedule.user.username
            if username not in user_stats:
                user_stats[username] = 0
            user_stats[username] += 1
    
    print("\n各使用者的執行記錄數量:")
    for username, count in user_stats.items():
        print(f"  {username}: {count} 條記錄")
    
    # 顯示詳細記錄
    print("\n詳細執行記錄:")
    for execution in executions[:5]:  # 只顯示前5條
        print(f"\n執行記錄 ID: {execution.id}")
        if hasattr(execution, 'schedule') and execution.schedule:
            print(f"排程名稱: {execution.schedule.name}")
            if execution.schedule.user:
                print(f"使用者: {execution.schedule.user.username}")
        print(f"狀態: {execution.status}")
        print(f"執行時間: {execution.scheduled_time}")
        print(f"成功發布: {execution.posts_published}")
        print(f"失敗數量: {execution.posts_failed}")

if __name__ == '__main__':
    try:
        test_schedule_execution_user_filter()
        test_schedule_execution_data()
        print("\n[SUCCESS] 所有測試完成！")
    except Exception as e:
        print(f"\n[ERROR] 測試失敗: {str(e)}")
        import traceback
        traceback.print_exc()
