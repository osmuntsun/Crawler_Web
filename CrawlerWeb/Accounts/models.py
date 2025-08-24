from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import os
import uuid


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
