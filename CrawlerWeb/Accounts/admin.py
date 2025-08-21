from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, WebsiteCookie, Community

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """自定義用戶管理界面"""
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'is_premium', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'is_superuser', 'is_premium', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('個人資訊', {'fields': ('first_name', 'last_name', 'email', 'phone', 'avatar', 'bio')}),
        ('付費狀態', {'fields': ('is_premium', 'premium_expires_at')}),
        ('權限', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('重要日期', {'fields': ('date_joined',)}),  # 移除 last_login
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('date_joined',)  # 將註冊時間設為唯讀


@admin.register(WebsiteCookie)
class WebsiteCookieAdmin(admin.ModelAdmin):
    """網站Cookie管理界面"""
    list_display = ('user', 'website', 'website_url', 'is_active', 'last_updated', 'created_at')
    list_filter = ('website', 'is_active', 'created_at', 'last_updated')
    search_fields = ('user__username', 'user__email', 'website_url', 'notes')
    ordering = ('-last_updated',)
    readonly_fields = ('created_at', 'last_updated')
    
    fieldsets = (
        ('基本資訊', {'fields': ('user', 'website', 'website_url')}),
        ('Cookie資料', {'fields': ('cookie_data', 'notes')}),
        ('狀態設定', {'fields': ('is_active',)}),
        ('時間資訊', {'fields': ('created_at', 'last_updated')}),
    )
    
    def get_cookie_count(self, obj):
        return obj.get_cookie_count()
    get_cookie_count.short_description = 'Cookie數量'


@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    """社團管理界面"""
    list_display = ('name', 'user', 'community_type', 'member_count', 'is_active', 'is_public', 'last_activity')
    list_filter = ('community_type', 'is_active', 'is_public', 'created_at', 'updated_at')
    search_fields = ('name', 'user__username', 'description', 'url')
    ordering = ('-last_activity', '-created_at')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('基本資訊', {'fields': ('user', 'name', 'community_type', 'url')}),
        ('詳細資訊', {'fields': ('description', 'member_count', 'tags')}),
        ('狀態設定', {'fields': ('is_active', 'is_public')}),
        ('時間資訊', {'fields': ('created_at', 'updated_at', 'last_activity')}),
    )
    
    def get_tags_display(self, obj):
        return obj.get_tags_display()
    get_tags_display.short_description = '標籤'
