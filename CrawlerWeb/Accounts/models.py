from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    """��芸��蝢拍�冽�嗆芋���"""
    email = models.EmailField(unique=True, verbose_name='��餃����萎辣')
    phone = models.CharField(max_length=15, blank=True, null=True, verbose_name='���璈����蝣�')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='��剖��')
    bio = models.TextField(max_length=500, blank=True, verbose_name='���鈭箇陛隞�')
    date_joined = models.DateTimeField(default=timezone.now, verbose_name='閮餃��������')
    last_login = models.DateTimeField(auto_now=True, verbose_name='���敺���餃��')
    
    class Meta:
        verbose_name = '��冽��'
        verbose_name_plural = '��冽��'
    
    def __str__(self):
        return self.username
