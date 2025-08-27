#!/usr/bin/env python
"""
測試排程發文設定和貼文模板之間的關聯功能
"""

import os
import sys
import django

# 設置 Django 環境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CrawlerWeb.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import PostTemplate, Schedule, Community, PostTemplateImage

User = get_user_model()

def test_template_schedule_relation():
    """測試模板和排程的關聯功能"""
    print("🧪 開始測試模板和排程關聯功能...")
    
    try:
        # 創建測試用戶
        test_user, created = User.objects.get_or_create(
            username='test_user_relation',
            defaults={
                'email': 'test_relation@example.com',
                'is_active': True
            }
        )
        print(f"✅ 測試用戶: {test_user.username}")
        
        # 創建測試模板
        test_template = PostTemplate.objects.create(
            user=test_user,
            title='測試模板 - 關聯功能',
            content='這是一個測試模板，用於測試與排程的關聯功能。',
            hashtags=['測試', '關聯', '排程管理']
        )
        print(f"✅ 創建測試模板: {test_template.title}")
        
        # 創建測試圖片
        test_image = PostTemplateImage.objects.create(
            template=test_template,
            order=0,
            alt_text='/media/templates/test_image.jpg'
        )
        print(f"✅ 創建測試圖片記錄")
        
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
            description='這個排程使用了測試模板，測試關聯功能',
            status='active',
            is_active=True,
            execution_days=['monday', 'wednesday', 'friday'],
            posting_times=['09:00', '14:00'],
            platform='facebook',
            message_content='初始內容',
            template_images=[],
            target_communities=[test_community.url],
            template=test_template  # 關聯到模板
        )
        print(f"✅ 創建測試排程: {test_schedule.name}")
        
        # 測試模板關聯
        print(f"📊 測試模板關聯:")
        print(f"   - 排程使用的模板: {test_schedule.template.title if test_schedule.template else '無'}")
        print(f"   - 模板關聯的排程數量: {test_template.schedules.count()}")
        
        # 測試從模板更新排程內容
        print(f"🔄 測試從模板更新排程內容:")
        print(f"   - 更新前內容: {test_schedule.message_content}")
        print(f"   - 更新前圖片: {test_schedule.template_images}")
        
        success = test_schedule.update_from_template()
        print(f"   - 更新結果: {'成功' if success else '失敗'}")
        
        print(f"   - 更新後內容: {test_schedule.message_content}")
        print(f"   - 更新後圖片: {test_schedule.template_images}")
        
        # 測試獲取模板信息
        template_info = test_schedule.get_template_info()
        print(f"📋 排程的模板信息:")
        if template_info:
            print(f"   - 模板ID: {template_info['id']}")
            print(f"   - 模板標題: {template_info['title']}")
            print(f"   - 模板內容: {template_info['content'][:50]}...")
            print(f"   - 圖片數量: {template_info['image_count']}")
            print(f"   - 是否啟用: {template_info['is_active']}")
        else:
            print("   - 無模板信息")
        
        # 測試模板刪除時的級聯效果
        print(f"🗑️ 測試模板刪除時的級聯效果:")
        related_schedules = test_template.get_related_schedules()
        print(f"   - 關聯的排程數量: {len(related_schedules)}")
        for schedule in related_schedules:
            print(f"     - {schedule.name} (ID: {schedule.id})")
        
        # 刪除模板
        print(f"🗑️ 開始刪除模板: {test_template.title}")
        test_template.delete()
        print("✅ 模板已刪除")
        
        # 檢查排程是否還存在（應該被自動刪除）
        schedule_exists = Schedule.objects.filter(id=test_schedule.id).exists()
        print(f"📊 刪除後檢查:")
        print(f"   - 排程存在: {schedule_exists}")
        
        if not schedule_exists:
            print("🎉 測試成功！模板刪除時，關聯的排程也被自動刪除了。")
        else:
            print("❌ 測試失敗！關聯的排程沒有被刪除。")
        
        # 清理測試數據
        print("🧹 清理測試數據...")
        if Schedule.objects.filter(user=test_user).exists():
            Schedule.objects.filter(user=test_user).delete()
        if Community.objects.filter(user=test_user).exists():
            Community.objects.filter(user=test_user).delete()
        if User.objects.filter(username='test_user_relation').exists():
            User.objects.filter(username='test_user_relation').delete()
        print("✅ 測試數據已清理")
        
    except Exception as e:
        print(f"❌ 測試過程中發生錯誤: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_template_schedule_relation()
