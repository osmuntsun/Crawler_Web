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
    """排程設定"""
    STATUS_CHOICES = [
        ('active', '啟用'),
        ('paused', '暫停'),
        ('completed', '完成'),
        ('cancelled', '取消'),
    ]
    
    FREQUENCY_CHOICES = [
        ('daily', '每日'),
        ('weekly', '每週'),
        ('monthly', '每月'),
        ('custom', '自定義'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='使用者')
    name = models.CharField(max_length=200, verbose_name='排程名稱')
    description = models.TextField(blank=True, verbose_name='排程描述')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='狀態')
    is_active = models.BooleanField(default=True, verbose_name='是否啟用')
    
    # 舊字段（保留用於向後兼容）
    start_time = models.DateTimeField(verbose_name='開始時間', null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True, verbose_name='結束時間')
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily', verbose_name='執行頻率')
    interval_minutes = models.PositiveIntegerField(default=60, verbose_name='執行間隔(分鐘)')
    next_execution = models.DateTimeField(null=True, blank=True, verbose_name='下次執行時間')
    platforms = models.JSONField(default=list, blank=True, verbose_name='目標平台')
    
    # 新字段
    execution_days = models.JSONField(default=list, blank=True, verbose_name='執行日期')
    posting_times = models.JSONField(default=list, blank=True, verbose_name='發文時間')
    
    # 內容設定
    template = models.ForeignKey(PostTemplate, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='文案模板')
    custom_content = models.TextField(blank=True, verbose_name='自定義內容')
    custom_hashtags = models.TextField(blank=True, verbose_name='自定義標籤')
    
    # 圖片設定
    use_template_images = models.BooleanField(default=True, verbose_name='使用模板圖片')
    additional_images = models.JSONField(default=list, blank=True, verbose_name='額外圖片')
    
    # 發布設定
    platform = models.CharField(max_length=20, verbose_name='社群平台', blank=True)
    target_communities = models.JSONField(default=list, blank=True, verbose_name='目標社團/頁面')
    
    # 執行統計
    total_executions = models.PositiveIntegerField(default=0, verbose_name='總執行次數')
    successful_executions = models.PositiveIntegerField(default=0, verbose_name='成功執行次數')
    failed_executions = models.PositiveIntegerField(default=0, verbose_name='失敗執行次數')
    last_execution_time = models.DateTimeField(null=True, blank=True, verbose_name='最後執行時間')
    
    # 時間資訊
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '排程設定'
        verbose_name_plural = '排程設定'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"
    
    def get_next_execution_time(self):
        """計算下次執行時間"""
        if not self.posting_times or not self.execution_days:
            return None
        
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


class ScheduleExecution(models.Model):
    """排程執行記錄"""
    EXECUTION_STATUS_CHOICES = [
        ('pending', '等待中'),
        ('running', '執行中'),
        ('completed', '已完成'),
        ('failed', '失敗'),
        ('cancelled', '已取消'),
    ]
    
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, verbose_name='排程設定')
    status = models.CharField(max_length=20, choices=EXECUTION_STATUS_CHOICES, default='pending', verbose_name='執行狀態')
    
    # 舊字段（保留用於向後兼容）
    scheduled_time = models.DateTimeField(verbose_name='預定執行時間', null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True, verbose_name='開始執行時間')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成時間')
    success_count = models.PositiveIntegerField(default=0, verbose_name='成功發布數')
    failure_count = models.PositiveIntegerField(default=0, verbose_name='失敗發布數')
    total_count = models.PositiveIntegerField(default=0, verbose_name='總發布數')
    execution_log = models.JSONField(default=dict, blank=True, verbose_name='執行日誌')
    error_messages = models.JSONField(default=list, blank=True, verbose_name='錯誤訊息')
    published_posts = models.JSONField(default=list, blank=True, verbose_name='已發布貼文')
    reach_count = models.PositiveIntegerField(default=0, verbose_name='觸及人數')
    like_count = models.PositiveIntegerField(default=0, verbose_name='按讚數')
    share_count = models.PositiveIntegerField(default=0, verbose_name='分享數')
    comment_count = models.PositiveIntegerField(default=0, verbose_name='留言數')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    # 新字段
    execution_time = models.DateTimeField(verbose_name='執行時間', default=timezone.now)
    result_message = models.TextField(blank=True, verbose_name='執行結果訊息')
    error_details = models.TextField(blank=True, verbose_name='錯誤詳情')
    execution_duration = models.PositiveIntegerField(null=True, blank=True, verbose_name='執行時長(秒)')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    
    class Meta:
        verbose_name = '排程執行記錄'
        verbose_name_plural = '排程執行記錄'
        ordering = ['-execution_time']
    
    def __str__(self):
        return f"{self.schedule.name} - {self.execution_time.strftime('%Y-%m-%d %H:%M')}"


class ScheduleTemplate(models.Model):
    """排程模板模型"""
    TEMPLATE_TYPE_CHOICES = [
        ('daily_posting', '每日發文'),
        ('weekly_campaign', '每週活動'),
        ('monthly_report', '每月報告'),
        ('custom', '自定義'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='模板名稱')
    description = models.TextField(blank=True, verbose_name='模板描述')
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPE_CHOICES, default='custom', verbose_name='模板類型')
    
    # 預設設定
    default_frequency = models.CharField(max_length=20, choices=[
        ('once', '單次'),
        ('hourly', '每小時'),
        ('daily', '每天'),
        ('weekly', '每週'),
        ('monthly', '每月'),
        ('custom', '自定義'),
    ], default='daily', verbose_name='預設頻率')
    default_interval_minutes = models.PositiveIntegerField(default=60, verbose_name='預設間隔(分鐘)')
    
    # 預設內容
    default_content_template = models.TextField(blank=True, verbose_name='預設內容模板')
    default_hashtags = models.JSONField(default=list, blank=True, verbose_name='預設標籤')
    
    # 預設平台和社團
    default_platforms = models.JSONField(default=list, blank=True, verbose_name='預設平台')
    default_communities = models.JSONField(default=list, blank=True, verbose_name='預設社團')
    
    # 使用統計
    usage_count = models.PositiveIntegerField(default=0, verbose_name='使用次數')
    
    # 時間戳記
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '排程模板'
        verbose_name_plural = '排程模板'
        ordering = ['-usage_count', '-created_at']
    
    def __str__(self):
        return self.name
    
    def increment_usage(self):
        """增加使用次數"""
        self.usage_count += 1
        self.save()
