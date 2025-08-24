from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import os
import uuid
from datetime import timedelta


def avatar_upload_to(instance, filename):
    """產生不可預測的檔名以降低被猜測的風險。"""
    _, ext = os.path.splitext(filename)
    safe_ext = (ext or '').lower()
    return f"avatars/{uuid.uuid4().hex}{safe_ext}"


def template_image_upload_to(instance, filename):
    """貼文模板圖片上傳路徑"""
    _, ext = os.path.splitext(filename)
    safe_ext = (ext or '').lower()
    return f"templates/{instance.template.user.id}/{uuid.uuid4().hex}{safe_ext}"


class User(AbstractUser):
    """自定義用戶模型"""
    email = models.EmailField(unique=True, verbose_name='電子郵件')
    phone = models.CharField(max_length=15, blank=True, null=True, verbose_name='手機號碼')
    avatar = models.ImageField(upload_to=avatar_upload_to, blank=True, null=True, verbose_name='頭像')
    bio = models.TextField(max_length=500, blank=True, null=True, verbose_name='個人簡介')
    is_premium = models.BooleanField(default=False, verbose_name='付費用戶')
    premium_expires_at = models.DateTimeField(blank=True, null=True, verbose_name='付費到期時間')
    date_joined = models.DateTimeField(default=timezone.now, verbose_name='註冊時間')
    last_login = models.DateTimeField(auto_now=True, verbose_name='最後登入')
    
    class Meta:
        verbose_name = '用戶'
        verbose_name_plural = '用戶'
    
    def __str__(self):
        return self.username
    
    @property
    def is_premium_active(self):
        """檢查付費狀態是否有效（包含到期時間檢查）"""
        if not self.is_premium:
            return False
        if self.premium_expires_at and self.premium_expires_at < timezone.now():
            return False
        return True


class WebsiteCookie(models.Model):
    """網站Cookie資料庫"""
    WEBSITE_CHOICES = [
        ('facebook', 'Facebook'),
        ('instagram', 'Instagram'),
        ('twitter', 'Twitter'),
        ('linkedin', 'LinkedIn'),
        ('youtube', 'YouTube'),
        ('discord', 'Discord'),
        ('telegram', 'Telegram'),
        ('line', 'Line'),
        ('wechat', 'WeChat'),
        ('other', '其他'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用戶', related_name='cookies')
    website = models.CharField(max_length=20, choices=WEBSITE_CHOICES, verbose_name='網站名稱')
    website_url = models.URLField(verbose_name='網站網址')
    cookie_data = models.JSONField(verbose_name='Cookie資料', default=dict, blank=True)  # 儲存 JSON 數據
    is_active = models.BooleanField(default=True, verbose_name='是否啟用')
    last_updated = models.DateTimeField(auto_now=True, verbose_name='最後更新時間')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='建立時間')
    notes = models.TextField(blank=True, verbose_name='備註')
    
    class Meta:
        verbose_name = '網站Cookie'
        verbose_name_plural = '網站Cookie'
        unique_together = ['user', 'website']  # 每個用戶每個網站只能有一個Cookie記錄
        ordering = ['-last_updated']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_website_display()}"
    
    def get_cookie_count(self):
        """取得Cookie數量"""
        if self.cookie_data and isinstance(self.cookie_data, dict):
            return len(self.cookie_data)
        return 0


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
        ('other', '其他'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用戶', related_name='communities')
    name = models.CharField(max_length=200, verbose_name='社團名稱')
    community_type = models.CharField(max_length=20, choices=COMMUNITY_TYPE_CHOICES, verbose_name='社團類型')
    url = models.URLField(verbose_name='社團連結')
    description = models.TextField(blank=True, verbose_name='社團描述')
    member_count = models.PositiveIntegerField(blank=True, null=True, verbose_name='成員數量')
    is_active = models.BooleanField(default=True, verbose_name='是否啟用')
    is_public = models.BooleanField(default=True, verbose_name='是否公開')
    last_activity = models.DateTimeField(blank=True, null=True, verbose_name='最後活動時間')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='建立時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    tags = models.JSONField(default=list, blank=True, verbose_name='標籤')  # 儲存 JSON 數據
    
    class Meta:
        verbose_name = '社團'
        verbose_name_plural = '社團'
        ordering = ['-last_activity', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['community_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_community_type_display()})"
    
    def get_tags_display(self):
        """取得標籤顯示"""
        if self.tags and isinstance(self.tags, list):
            return ', '.join(self.tags)
        return ''
    
    def update_last_activity(self):
        """更新最後活動時間"""
        from django.utils import timezone
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])


class PostTemplate(models.Model):
    """貼文模板資料庫"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用戶', related_name='post_templates')
    title = models.CharField(max_length=200, verbose_name='模板標題')
    content = models.TextField(verbose_name='文案內容')
    hashtags = models.JSONField(default=list, blank=True, verbose_name='標籤')
    is_active = models.BooleanField(default=True, verbose_name='是否啟用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='建立時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '貼文模板'
        verbose_name_plural = '貼文模板'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    def get_image_count(self):
        """取得圖片數量"""
        return self.images.count()


class PostTemplateImage(models.Model):
	"""貼文模板圖片"""
	template = models.ForeignKey(PostTemplate, on_delete=models.CASCADE, verbose_name='模板', related_name='images')
	image = models.ImageField(upload_to=template_image_upload_to, verbose_name='圖片', blank=True, null=True)
	order = models.PositiveIntegerField(default=0, verbose_name='排序')
	alt_text = models.CharField(max_length=200, blank=True, verbose_name='替代文字')
	created_at = models.DateTimeField(auto_now_add=True, verbose_name='建立時間')
	
	class Meta:
		verbose_name = '模板圖片'
		verbose_name_plural = '模板圖片'
		ordering = ['order', 'created_at']
		indexes = [
			models.Index(fields=['template', 'order']),
		]
	
	def __str__(self):
		return f"{self.template.title} - 圖片 {self.order + 1}"


class SocialMediaPost(models.Model):
    """社交媒體貼文數據模型"""
    PLATFORM_CHOICES = [
        ('facebook', 'Facebook'),
        ('instagram', 'Instagram'),
        ('twitter', 'Twitter'),
        ('linkedin', 'LinkedIn'),
        ('youtube', 'YouTube'),
        ('discord', 'Discord'),
        ('telegram', 'Telegram'),
        ('line', 'Line'),
        ('wechat', 'WeChat'),
        ('other', '其他'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用戶', related_name='social_media_posts')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, verbose_name='平台')
    post_id = models.CharField(max_length=255, verbose_name='貼文ID')
    content = models.TextField(blank=True, verbose_name='貼文內容')
    post_url = models.URLField(blank=True, verbose_name='貼文連結')
    
    # 數據分析字段
    reach_count = models.PositiveIntegerField(default=0, verbose_name='觸及人數')
    like_count = models.PositiveIntegerField(default=0, verbose_name='按讚次數')
    share_count = models.PositiveIntegerField(default=0, verbose_name='分享次數')
    view_time_seconds = models.PositiveIntegerField(default=0, verbose_name='停留時間(秒)')
    save_count = models.PositiveIntegerField(default=0, verbose_name='收藏次數')
    comment_count = models.PositiveIntegerField(default=0, verbose_name='留言數量')
    
    # 計算字段
    engagement_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, verbose_name='互動率(%)')
    
    # 時間字段
    posted_at = models.DateTimeField(blank=True, null=True, verbose_name='發布時間')
    data_collected_at = models.DateTimeField(auto_now=True, verbose_name='數據收集時間')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='建立時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '社交媒體貼文'
        verbose_name_plural = '社交媒體貼文'
        ordering = ['-data_collected_at', '-posted_at']
        indexes = [
            models.Index(fields=['user', 'platform']),
            models.Index(fields=['platform', 'data_collected_at']),
            models.Index(fields=['posted_at']),
        ]
        unique_together = ['user', 'platform', 'post_id']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_platform_display()} - {self.post_id}"
    
    def calculate_engagement_rate(self):
        """計算互動率 (按讚+分享+留言+收藏) / 觸及人數 * 100"""
        if self.reach_count > 0:
            total_engagement = self.like_count + self.share_count + self.comment_count + self.save_count
            self.engagement_rate = (total_engagement / self.reach_count) * 100
        else:
            self.engagement_rate = 0.00
        return self.engagement_rate
    
    def save(self, *args, **kwargs):
        """保存時自動計算互動率"""
        self.calculate_engagement_rate()
        super().save(*args, **kwargs)
    
    def get_engagement_summary(self):
        """取得互動摘要"""
        return {
            'reach': self.reach_count,
            'likes': self.like_count,
            'shares': self.share_count,
            'comments': self.comment_count,
            'saves': self.save_count,
            'view_time': self.view_time_seconds,
            'engagement_rate': self.engagement_rate
        }



class DataAnalysisCache(models.Model):
    """數據分析結果緩存模型"""
    ANALYSIS_TYPE_CHOICES = [
        ('reach_analysis', '觸及率分析'),
        ('like_analysis', '按讚次數分析'),
        ('share_analysis', '分享次數分析'),
        ('view_time_analysis', '停留時間分析'),
        ('save_analysis', '收藏次數分析'),
        ('comment_analysis', '留言數量分析'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用戶', related_name='data_analysis_caches')
    analysis_type = models.CharField(max_length=20, choices=ANALYSIS_TYPE_CHOICES, verbose_name='分析類型')
    data = models.JSONField(verbose_name='分析數據', default=dict, blank=True)  # 儲存 JSON 數據
    chart_config = models.JSONField(verbose_name='圖表配置', default=dict, blank=True)  # 儲存 JSON 數據
    last_updated = models.DateTimeField(auto_now=True, verbose_name='最後更新時間')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='建立時間')
    
    class Meta:
        verbose_name = '數據分析緩存'
        verbose_name_plural = '數據分析緩存'
        unique_together = ['user', 'analysis_type']
        ordering = ['-last_updated']
        indexes = [
            models.Index(fields=['user', 'analysis_type']),
            models.Index(fields=['analysis_type', 'last_updated']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_analysis_type_display()}"
    
    def get_data_summary(self):
        """取得數據摘要"""
        data = self.data if self.data else {}
        chart_config = self.chart_config if self.chart_config else {}
            
        return {
            'type': self.analysis_type,
            'data': data,
            'chart_config': chart_config,
            'last_updated': self.last_updated.isoformat(),
            'created_at': self.created_at.isoformat()
        }
    
    def update_data(self, new_data, new_chart_config):
        """更新分析數據和圖表配置"""
        self.data = new_data
        self.chart_config = new_chart_config
        self.save()
        return self


class Schedule(models.Model):
    """排程設定模型"""
    SCHEDULE_STATUS_CHOICES = [
        ('active', '啟用'),
        ('paused', '暫停'),
        ('disabled', '停用'),
        ('completed', '已完成'),
        ('expired', '已過期'),
    ]
    
    FREQUENCY_CHOICES = [
        ('once', '單次'),
        ('hourly', '每小時'),
        ('daily', '每天'),
        ('weekly', '每週'),
        ('monthly', '每月'),
        ('custom', '自定義'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用戶', related_name='schedules')
    name = models.CharField(max_length=200, verbose_name='排程名稱')
    description = models.TextField(blank=True, verbose_name='排程描述')
    
    # 排程狀態
    status = models.CharField(max_length=20, choices=SCHEDULE_STATUS_CHOICES, default='active', verbose_name='排程狀態')
    is_active = models.BooleanField(default=True, verbose_name='是否啟用')
    
    # 時間設定
    start_time = models.DateTimeField(verbose_name='開始時間')
    end_time = models.DateTimeField(null=True, blank=True, verbose_name='結束時間')
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily', verbose_name='執行頻率')
    interval_minutes = models.PositiveIntegerField(default=60, verbose_name='執行間隔(分鐘)')
    next_execution = models.DateTimeField(verbose_name='下次執行時間')
    
    # 內容設定
    template = models.ForeignKey(PostTemplate, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='文案模板')
    custom_content = models.TextField(blank=True, verbose_name='自定義內容')
    custom_hashtags = models.JSONField(default=list, blank=True, verbose_name='自定義標籤')
    
    # 圖片設定
    use_template_images = models.BooleanField(default=True, verbose_name='使用模板圖片')
    additional_images = models.JSONField(default=list, blank=True, verbose_name='額外圖片路徑')
    
    # 發布設定
    platforms = models.JSONField(default=list, verbose_name='目標平台')  # ['facebook', 'instagram']
    target_communities = models.JSONField(default=list, verbose_name='目標社團/頁面')  # [{'platform': 'facebook', 'url': '...', 'name': '...'}]
    
    # 執行統計
    total_executions = models.PositiveIntegerField(default=0, verbose_name='總執行次數')
    successful_executions = models.PositiveIntegerField(default=0, verbose_name='成功執行次數')
    failed_executions = models.PositiveIntegerField(default=0, verbose_name='失敗執行次數')
    last_execution_time = models.DateTimeField(null=True, blank=True, verbose_name='最後執行時間')
    
    # 時間戳記
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '排程設定'
        verbose_name_plural = '排程設定'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['next_execution']),
            models.Index(fields=['status', 'next_execution']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"
    
    def get_execution_status(self):
        """獲取執行狀態"""
        if self.status == 'completed':
            return '已完成'
        elif self.status == 'expired':
            return '已過期'
        elif self.status == 'paused':
            return '已暫停'
        elif self.status == 'disabled':
            return '已停用'
        elif self.next_execution <= timezone.now():
            return '待執行'
        else:
            return '等待中'
    
    def calculate_next_execution(self):
        """計算下次執行時間"""
        if self.frequency == 'once':
            return None
        elif self.frequency == 'hourly':
            return timezone.now() + timedelta(minutes=self.interval_minutes)
        elif self.frequency == 'daily':
            return timezone.now() + timedelta(days=1)
        elif self.frequency == 'weekly':
            return timezone.now() + timedelta(weeks=1)
        elif self.frequency == 'monthly':
            return timezone.now() + timedelta(days=30)
        else:
            return timezone.now() + timedelta(minutes=self.interval_minutes)
    
    def should_execute(self):
        """檢查是否應該執行"""
        if not self.is_active or self.status != 'active':
            return False
        if self.end_time and timezone.now() > self.end_time:
            return False
        return timezone.now() >= self.next_execution


class ScheduleExecution(models.Model):
    """排程執行記錄模型"""
    EXECUTION_STATUS_CHOICES = [
        ('pending', '等待中'),
        ('running', '執行中'),
        ('completed', '已完成'),
        ('failed', '失敗'),
        ('cancelled', '已取消'),
    ]
    
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, verbose_name='排程', related_name='executions')
    
    # 執行狀態
    status = models.CharField(max_length=20, choices=EXECUTION_STATUS_CHOICES, default='pending', verbose_name='執行狀態')
    
    # 執行時間
    scheduled_time = models.DateTimeField(verbose_name='預定執行時間')
    started_at = models.DateTimeField(null=True, blank=True, verbose_name='開始執行時間')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成時間')
    
    # 執行結果
    success_count = models.PositiveIntegerField(default=0, verbose_name='成功發布數')
    failure_count = models.PositiveIntegerField(default=0, verbose_name='失敗發布數')
    total_count = models.PositiveIntegerField(default=0, verbose_name='總發布數')
    
    # 執行詳情
    execution_log = models.JSONField(default=dict, blank=True, verbose_name='執行日誌')
    error_messages = models.JSONField(default=list, blank=True, verbose_name='錯誤訊息')
    
    # 發布詳情
    published_posts = models.JSONField(default=list, blank=True, verbose_name='已發布貼文')  # [{'platform': 'facebook', 'community': '...', 'post_id': '...', 'url': '...'}]
    
    # 統計數據
    reach_count = models.PositiveIntegerField(default=0, verbose_name='觸及人數')
    like_count = models.PositiveIntegerField(default=0, verbose_name='按讚數')
    share_count = models.PositiveIntegerField(default=0, verbose_name='分享數')
    comment_count = models.PositiveIntegerField(default=0, verbose_name='留言數')
    
    # 時間戳記
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='創建時間')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新時間')
    
    class Meta:
        verbose_name = '排程執行記錄'
        verbose_name_plural = '排程執行記錄'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['schedule', 'status']),
            models.Index(fields=['scheduled_time']),
            models.Index(fields=['status', 'scheduled_time']),
        ]
    
    def __str__(self):
        return f"{self.schedule.name} - {self.scheduled_time.strftime('%Y-%m-%d %H:%M')}"
    
    def get_execution_duration(self):
        """獲取執行持續時間"""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        elif self.started_at:
            return timezone.now() - self.started_at
        return None
    
    def get_success_rate(self):
        """獲取成功率"""
        if self.total_count > 0:
            return (self.success_count / self.total_count) * 100
        return 0
    
    def add_log_entry(self, message, level='info'):
        """添加日誌條目"""
        if not self.execution_log:
            self.execution_log = {'entries': []}
        
        self.execution_log['entries'].append({
            'timestamp': timezone.now().isoformat(),
            'level': level,
            'message': message
        })
        self.save()
    
    def add_error_message(self, error):
        """添加錯誤訊息"""
        if not self.error_messages:
            self.error_messages = []
        
        self.error_messages.append({
            'timestamp': timezone.now().isoformat(),
            'error': str(error)
        })
        self.save()


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
    default_platforms = models.JSONField(default=list, verbose_name='預設平台')
    default_communities = models.JSONField(default=list, verbose_name='預設社團')
    
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
