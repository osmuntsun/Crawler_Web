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


class User(AbstractUser):
    """自定義用戶模型"""
    email = models.EmailField(unique=True, verbose_name='電子郵件')
    phone = models.CharField(max_length=15, blank=True, null=True, verbose_name='手機號碼')
    avatar = models.ImageField(upload_to=avatar_upload_to, blank=True, null=True, verbose_name='頭像')
    bio = models.TextField(max_length=500, blank=True, verbose_name='個人簡介')
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
    cookie_data = models.JSONField(verbose_name='Cookie資料')
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
        if isinstance(self.cookie_data, dict):
            return len(self.cookie_data)
        return 0


class Community(models.Model):
    """社團資料庫"""
    COMMUNITY_TYPE_CHOICES = [
        ('facebook_group', 'Facebook社團'),
        ('facebook_page', 'Facebook粉絲頁'),
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
    tags = models.JSONField(default=list, blank=True, verbose_name='標籤')
    
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
        if isinstance(self.tags, list):
            return ', '.join(self.tags)
        return ''
    
    def update_last_activity(self):
        """更新最後活動時間"""
        from django.utils import timezone
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])
