from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    """自定義用戶模型"""
    email = models.EmailField(unique=True, verbose_name='電子郵件')
    phone = models.CharField(max_length=15, blank=True, null=True, verbose_name='手機號碼')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='頭像')
    bio = models.TextField(max_length=500, blank=True, verbose_name='個人簡介')
    date_joined = models.DateTimeField(default=timezone.now, verbose_name='註冊時間')
    last_login = models.DateTimeField(auto_now=True, verbose_name='最後登入')
    
    class Meta:
        verbose_name = '用戶'
        verbose_name_plural = '用戶'
    
    def __str__(self):
        return self.username
