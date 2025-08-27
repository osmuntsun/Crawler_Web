#!/usr/bin/env python
"""
測試模板刪除時排程也會被刪除的功能
"""

import os
import sys
import django

# 設置 Django 環境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CrawlerWeb.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import PostTemplate, Schedule, Community

User = get_user_model()

def test_template_deletion_with_schedules():
    """測試模板刪除時排程也會被刪除"""
    print("🧪 開始測試模板刪除功能...")
    
    try:
        # 創建測試用戶
        test_user, created = User.objects.get_or_create(
            username='test_user_template',
            defaults={
                'email': 'test@example.com',
                'is_active': True
            }
        )
        print(f"✅ 測試用戶: {test_user.username}")
        
        # 創建測試模板
        test_template = PostTemplate.objects.create(
            user=test_user,
            title='測試模板 - 自動刪除排程',
            content='這是一個測試模板，用於測試刪除功能。當此模板被刪除時，相關的排程也會被自動刪除。',
            hashtags=['測試', '自動刪除', '排程管理']
        )
        print(f"✅ 創建測試模板: {test_template.title}")
        
        # 創建測試社團
        test_community = Community.objects.create(
            user=test_user,
            name='測試社團',
            community_type='facebook',
            url='https://facebook.com/groups/test',
            description='測試用社團'
        )
        print(f"✅ 創建測試社團: {test_community.name}")
        
        # 創建使用此模板的排程
        test_schedule = Schedule.objects.create(
            user=test_user,
            name='測試排程 - 使用測試模板',
            description='這個排程使用了測試模板，當模板被刪除時應該也會被刪除',
            status='active',
            is_active=True,
            execution_days=['monday', 'wednesday', 'friday'],
            posting_times=['09:00', '14:00'],
            platform='facebook',
            message_content=test_template.content,  # 使用模板內容
            template_images=[],  # 空圖片列表
            target_communities=[test_community.url]
        )
        print(f"✅ 創建測試排程: {test_schedule.name}")
        
        # 創建排程執行記錄
        from .models import ScheduleExecution
        test_execution = ScheduleExecution.objects.create(
            schedule=test_schedule,
            status='pending',
            scheduled_time=timezone.now()
        )
        print(f"✅ 創建測試執行記錄: {test_execution.id}")
        
        # 檢查相關排程數量
        related_schedules = test_template.get_related_schedules()
        print(f"📊 模板相關排程數量: {len(related_schedules)}")
        for schedule in related_schedules:
            print(f"   - {schedule.name} (ID: {schedule.id})")
        
        # 檢查排程和執行記錄是否存在
        schedule_exists = Schedule.objects.filter(id=test_schedule.id).exists()
        execution_exists = ScheduleExecution.objects.filter(id=test_execution.id).exists()
        print(f"📊 刪除前檢查:")
        print(f"   - 排程存在: {schedule_exists}")
        print(f"   - 執行記錄存在: {execution_exists}")
        
        # 刪除模板
        print(f"🗑️ 開始刪除模板: {test_template.title}")
        test_template.delete()
        print("✅ 模板已刪除")
        
        # 檢查排程和執行記錄是否也被刪除
        schedule_exists_after = Schedule.objects.filter(id=test_schedule.id).exists()
        execution_exists_after = ScheduleExecution.objects.filter(id=test_execution.id).exists()
        print(f"📊 刪除後檢查:")
        print(f"   - 排程存在: {schedule_exists_after}")
        print(f"   - 執行記錄存在: {execution_exists_after}")
        
        # 驗證結果
        if not schedule_exists_after and not execution_exists_after:
            print("🎉 測試成功！模板刪除時，相關的排程和執行記錄也被自動刪除了。")
        else:
            print("❌ 測試失敗！相關的排程或執行記錄沒有被刪除。")
            if schedule_exists_after:
                print(f"   - 排程 {test_schedule.name} 仍然存在")
            if execution_exists_after:
                print(f"   - 執行記錄 {test_execution.id} 仍然存在")
        
        # 清理測試數據
        print("🧹 清理測試數據...")
        if Schedule.objects.filter(user=test_user).exists():
            Schedule.objects.filter(user=test_user).delete()
        if Community.objects.filter(user=test_user).exists():
            Community.objects.filter(user=test_user).delete()
        if User.objects.filter(username='test_user_template').exists():
            User.objects.filter(username='test_user_template').delete()
        print("✅ 測試數據已清理")
        
    except Exception as e:
        print(f"❌ 測試過程中發生錯誤: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_template_deletion_with_schedules()
