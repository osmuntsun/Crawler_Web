from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import os
import uuid
from datetime import datetime

User = get_user_model()

def template_image_upload_to(instance, filename):
    """貼文模板圖片上傳路徑"""
    _, ext = os.path.splitext(filename)
    safe_ext = (ext or '').lower()
    return f"templates/{instance.template.user.id}/{uuid.uuid4().hex}{safe_ext}"


class Community(models.Model):
    """社團資料庫"""
    COMMUNITY_TYPE_CHOICES = [
        ('facebook', 'Facebook'),
        ('instagram_account', 'Instagram帳號'),
        ('discord_server', 'Discord伺服器'),
        ('telegram_channel', 'Telegram頻道'),
        ('line_group', 'Line群組'),
        ('wechat_group', '微信群組'),
        ('forum', '論壇'),
        ('blog', '部落格'),
        ('youtube_channel', 'YouTube頻道'),
        ('tiktok_account', 'TikTok帳號'),
        ('twitter_account', 'Twitter帳號'),
        ('linkedin_page', 'LinkedIn頁面'),
        ('other', '其他'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用戶', related_name='communities')
    name = models.CharField(max_length=200, verbose_name='社團名稱')
    community_type = models.CharField(max_length=20, choices=COMMUNITY_TYPE_CHOICES, default='facebook', verbose_name='社團類型')
    url = models.URLField(verbose_name='社團網址')
    description = models.TextField(blank=True, verbose_name='社團描述')
    member_count = models.PositiveIntegerField(default=0, verbose_name='成員數量')
    tags = models.JSONField(default=list, blank=True, verbose_name='標籤')
    is_active = models.BooleanField(default=True, verbose_name='是否啟用')
    is_public = models.BooleanField(default=True, verbose_name='是否公開')
    last_activity = models.DateTimeField(auto_now=True, verbose_name='最後活動時間')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='建立時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '社團'
        verbose_name_plural = '社團'
        unique_together = ['user', 'url']
        ordering = ['-last_activity', '-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"
    
    def get_tags_display(self):
        """獲取標籤顯示"""
        if self.tags and isinstance(self.tags, list):
            return ', '.join(self.tags)
        return ''


class PostTemplate(models.Model):
    """貼文模板資料庫"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用戶', related_name='post_templates')
    title = models.CharField(max_length=200, verbose_name='模板標題')
    content = models.TextField(verbose_name='模板內容')
    hashtags = models.JSONField(default=list, blank=True, verbose_name='標籤')
    is_active = models.BooleanField(default=True, verbose_name='是否啟用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='建立時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '貼文模板'
        verbose_name_plural = '貼文模板'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def get_image_count(self):
        """獲取圖片數量"""
        return self.images.count()
    
    def get_related_schedules(self):
        """獲取使用此模板的排程"""
        # 現在使用直接的外鍵關聯
        return self.schedules.all()


class PostTemplateImage(models.Model):
    """貼文模板圖片資料庫"""
    template = models.ForeignKey(PostTemplate, on_delete=models.CASCADE, verbose_name='模板', related_name='images')
    image = models.ImageField(upload_to=template_image_upload_to, verbose_name='圖片')
    order = models.PositiveIntegerField(default=0, verbose_name='排序')
    alt_text = models.CharField(max_length=200, blank=True, verbose_name='替代文字')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='建立時間')
    
    class Meta:
        verbose_name = '貼文模板圖片'
        verbose_name_plural = '貼文模板圖片'
        ordering = ['template', 'order']
        unique_together = ['template', 'order']
    
    def __str__(self):
        return f"{self.template.title} - 圖片 {self.order}"


class SocialMediaPost(models.Model):
    """社交媒體貼文資料庫"""
    PLATFORM_CHOICES = [
        ('facebook', 'Facebook'),
        ('instagram', 'Instagram'),
        ('twitter', 'Twitter'),
        ('linkedin', 'LinkedIn'),
        ('youtube', 'YouTube'),
        ('tiktok', 'TikTok'),
        ('discord', 'Discord'),
        ('telegram', 'Telegram'),
        ('line', 'Line'),
        ('wechat', 'WeChat'),
        ('other', '其他'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用戶', related_name='social_media_posts')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, verbose_name='平台')
    post_id = models.CharField(max_length=100, verbose_name='貼文ID')
    content = models.TextField(verbose_name='貼文內容')
    post_url = models.URLField(verbose_name='貼文網址')
    
    # 數據分析
    reach_count = models.PositiveIntegerField(default=0, verbose_name='觸及人數')
    like_count = models.PositiveIntegerField(default=0, verbose_name='按讚次數')
    share_count = models.PositiveIntegerField(default=0, verbose_name='分享次數')
    view_time_seconds = models.PositiveIntegerField(default=0, verbose_name='停留時間(秒)')
    save_count = models.PositiveIntegerField(default=0, verbose_name='收藏次數')
    comment_count = models.PositiveIntegerField(default=0, verbose_name='留言數量')
    
    # 時間資訊
    posted_at = models.DateTimeField(verbose_name='發布時間')
    data_collected_at = models.DateTimeField(auto_now_add=True, verbose_name='數據收集時間')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='建立時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '社交媒體貼文'
        verbose_name_plural = '社交媒體貼文'
        unique_together = ['user', 'platform', 'post_id']
        ordering = ['-data_collected_at', '-posted_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.platform} - {self.post_id}"
    
    @property
    def engagement_rate(self):
        """計算互動率"""
        if self.reach_count > 0:
            total_engagement = self.like_count + self.share_count + self.comment_count + self.save_count
            return (total_engagement / self.reach_count) * 100
        return 0
    
    def get_engagement_summary(self):
        """獲取互動摘要"""
        return {
            'reach': self.reach_count,
            'likes': self.like_count,
            'shares': self.share_count,
            'comments': self.comment_count,
            'saves': self.save_count,
            'engagement_rate': f"{self.engagement_rate:.2f}%"
        }


class Schedule(models.Model):
    """排程發文設定"""
    STATUS_CHOICES = [
        ('active', '啟用'),
        ('paused', '暫停'),
        ('cancelled', '取消'),
    ]
    
    # 基本資訊
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='使用者')
    name = models.CharField(max_length=200, verbose_name='排程名稱')
    description = models.TextField(blank=True, verbose_name='排程描述')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='狀態')
    is_active = models.BooleanField(default=True, verbose_name='是否啟用')
    
    # 排程設定
    execution_days = models.JSONField(default=list, verbose_name='執行日期', help_text='例如：["monday", "tuesday", "wednesday"]')
    posting_times = models.JSONField(default=list, verbose_name='發文時間', help_text='例如：["09:00", "14:00", "18:00"]')
    
    # 發文內容
    platform = models.CharField(max_length=20, verbose_name='社群平台')
    message_content = models.TextField(verbose_name='發文內容')
    template_images = models.JSONField(default=list, verbose_name='模板圖片', help_text='圖片URL和排序信息')
    target_communities = models.JSONField(default=list, verbose_name='目標社團', help_text='社團信息列表')
    
    # 模板關聯
    template = models.ForeignKey(
        PostTemplate, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        verbose_name='使用的模板',
        related_name='schedules',
        help_text='選擇要使用的貼文模板'
    )
    
    # 執行統計
    total_executions = models.PositiveIntegerField(default=0, verbose_name='總執行次數')
    successful_executions = models.PositiveIntegerField(default=0, verbose_name='成功執行次數')
    failed_executions = models.PositiveIntegerField(default=0, verbose_name='失敗執行次數')
    
    # 時間資訊
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    last_execution_time = models.DateTimeField(null=True, blank=True, verbose_name='最後執行時間')
    
    class Meta:
        verbose_name = '排程發文設定'
        verbose_name_plural = '排程發文設定'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"
    
    def get_next_execution_time(self):
        """計算下次執行時間"""
        if not self.posting_times or not self.execution_days:
            return None
        
        from datetime import datetime, timedelta
        now = timezone.now()
        current_time = now.time()
        current_weekday = now.strftime('%A').lower()
        
        # 檢查今天是否在執行日期中
        if current_weekday in self.execution_days:
            # 找到今天下一個要執行的時間
            for time_str in sorted(self.posting_times):
                time_obj = datetime.strptime(time_str, '%H:%M').time()
                if time_obj > current_time:
                    # 今天還有時間要執行
                    next_execution = datetime.combine(now.date(), time_obj)
                    return timezone.make_aware(next_execution)
        
        # 找到下一個執行日期和時間
        for i in range(1, 8):  # 最多檢查7天
            next_date = now.date() + timedelta(days=i)
            next_weekday = next_date.strftime('%A').lower()
            
            if next_weekday in self.execution_days:
                # 找到下一個執行日期，使用第一個時間
                first_time = sorted(self.posting_times)[0]
                time_obj = datetime.strptime(first_time, '%H:%M').time()
                next_execution = datetime.combine(next_date, time_obj)
                return timezone.make_aware(next_execution)
        
        return None
    
    def get_execution_summary(self):
        """獲取執行摘要"""
        return {
            'total': self.total_executions,
            'successful': self.successful_executions,
            'failed': self.failed_executions,
            'success_rate': (self.successful_executions / self.total_executions * 100) if self.total_executions > 0 else 0
        }
    
    def get_template_info(self):
        """獲取模板信息"""
        if self.template:
            return {
                'id': self.template.id,
                'title': self.template.title,
                'content': self.template.content,
                'hashtags': self.template.hashtags,
                'image_count': self.template.get_image_count(),
                'is_active': self.template.is_active
            }
        return None
    
    def update_from_template(self):
        """從模板更新排程內容"""
        if self.template and self.template.is_active:
            # 更新發文內容
            self.message_content = self.template.content
            
            # 更新模板圖片
            template_images = []
            for image in self.template.images.all().order_by('order'):
                if image.image and hasattr(image.image, 'url'):
                    template_images.append({
                        'url': image.image.url,
                        'order': image.order,
                        'alt_text': image.alt_text or ''
                    })
                elif image.alt_text and image.alt_text.startswith('/media/'):
                    template_images.append({
                        'url': image.alt_text,
                        'order': image.order,
                        'alt_text': image.alt_text or ''
                    })
            
            self.template_images = template_images
            self.save()
            return True
        return False


class ScheduleExecution(models.Model):
    """排程執行記錄"""
    EXECUTION_STATUS_CHOICES = [
        ('pending', '等待中'),
        ('running', '執行中'),
        ('completed', '已完成'),
        ('failed', '失敗'),
        ('cancelled', '已取消'),
    ]
    
    # 基本資訊
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, verbose_name='排程設定', related_name='executions')
    status = models.CharField(max_length=20, choices=EXECUTION_STATUS_CHOICES, default='pending', verbose_name='執行狀態')
    
    # 執行時間
    scheduled_time = models.DateTimeField(verbose_name='預定執行時間')
    started_at = models.DateTimeField(null=True, blank=True, verbose_name='開始執行時間')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成時間')
    
    # 執行結果
    result_message = models.TextField(blank=True, verbose_name='執行結果訊息')
    error_details = models.TextField(blank=True, verbose_name='錯誤詳情')
    execution_duration = models.PositiveIntegerField(null=True, blank=True, verbose_name='執行時長(秒)')
    
    # 發布統計
    posts_published = models.PositiveIntegerField(default=0, verbose_name='成功發布貼文數')
    posts_failed = models.PositiveIntegerField(default=0, verbose_name='失敗發布貼文數')
    
    # 時間戳記
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '排程執行記錄'
        verbose_name_plural = '排程執行記錄'
        ordering = ['-scheduled_time']
    
    def __str__(self):
        return f"{self.schedule.name} - {self.scheduled_time.strftime('%Y-%m-%d %H:%M')} - {self.status}"
    
    def mark_as_started(self):
        """標記為開始執行"""
        self.status = 'running'
        self.started_at = timezone.now()
        self.save()
    
    def mark_as_completed(self, success_count=0, failure_count=0, message=""):
        """標記為完成"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.posts_published = success_count
        self.posts_failed = failure_count
        self.result_message = message
        
        if self.started_at:
            duration = (self.completed_at - self.started_at).total_seconds()
            self.execution_duration = int(duration)
        
        self.save()
    
    def mark_as_failed(self, error_message=""):
        """標記為失敗"""
        self.status = 'failed'
        self.completed_at = timezone.now()
        self.error_details = error_message
        
        if self.started_at:
            duration = (self.completed_at - self.started_at).total_seconds()
            self.execution_duration = int(duration)
        
        self.save()


# Django 信號處理器
from django.db.models.signals import pre_delete
from django.dispatch import receiver


@receiver(pre_delete, sender=PostTemplate)
def delete_related_schedules(sender, instance, **kwargs):
    """
    當模板被刪除時，自動刪除相關的排程
    """
    try:
        # 獲取使用此模板的排程
        related_schedules = instance.get_related_schedules()
        
        if related_schedules:
            # 記錄要刪除的排程數量
            schedule_count = len(related_schedules)
            
            # 刪除相關的排程（這會自動刪除相關的執行記錄）
            for schedule in related_schedules:
                schedule.delete()
            
            # 記錄日誌
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"模板 '{instance.title}' (ID: {instance.id}) 被刪除，同時刪除了 {schedule_count} 個相關排程")
            
    except Exception as e:
        # 如果刪除排程時出錯，記錄錯誤但不阻止模板刪除
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"刪除模板 '{instance.title}' 的相關排程時出錯: {str(e)}")
