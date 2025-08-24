from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, WebsiteCookie, Community, PostTemplate, PostTemplateImage

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


@admin.register(PostTemplate)
class PostTemplateAdmin(admin.ModelAdmin):
    """貼文模板管理界面"""
    list_display = ('title', 'user', 'get_image_count', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at', 'updated_at')
    search_fields = ('title', 'content', 'user__username', 'hashtags')
    ordering = ('-updated_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('基本資訊', {'fields': ('user', 'title', 'content', 'hashtags')}),
        ('狀態設定', {'fields': ('is_active',)}),
        ('時間資訊', {'fields': ('created_at', 'updated_at')}),
    )
    
    def get_image_count(self, obj):
        return obj.get_image_count()
    get_image_count.short_description = '圖片數量'


@admin.register(PostTemplateImage)
class PostTemplateImageAdmin(admin.ModelAdmin):
    """貼文模板圖片管理界面"""
    list_display = ('template', 'order', 'image', 'alt_text', 'created_at')
    list_filter = ('template__user', 'order', 'created_at')
    search_fields = ('template__title', 'alt_text')
    ordering = ('template', 'order', 'created_at')
    readonly_fields = ('created_at',)
    
    # 改善批量刪除功能
    list_per_page = 100  # 每頁顯示100條記錄
    list_max_show_all = 1000  # 顯示全部時最多1000條
    actions = ['delete_selected']  # 啟用刪除選中項動作
    
    fieldsets = (
        ('基本資訊', {'fields': ('template', 'image', 'order', 'alt_text')}),
        ('時間資訊', {'fields': ('created_at',)}),
    )
    
    def get_actions(self, request):
        """獲取可用的批量操作"""
        actions = super().get_actions(request)
        if 'delete_selected' not in actions:
            actions['delete_selected'] = self.get_action('delete_selected')
        return actions
    
    def delete_selected_with_files(self, request, queryset):
        """刪除選中的模板圖片（包括文件）"""
        import os
        
        deleted_count = 0
        deleted_files = 0
        
        for image in queryset:
            try:
                # 刪除圖片文件
                if image.image and hasattr(image.image, 'path') and os.path.exists(image.image.path):
                    try:
                        os.remove(image.image.path)
                        deleted_files += 1
                    except Exception as e:
                        self.message_user(request, f"刪除文件失敗 {image.image.path}: {e}", level='WARNING')
                
                # 刪除數據庫記錄
                image.delete()
                deleted_count += 1
                
            except Exception as e:
                self.message_user(request, f"刪除記錄失敗 {image.id}: {e}", level='ERROR')
        
        if deleted_count > 0:
            self.message_user(request, f"成功刪除 {deleted_count} 個模板圖片記錄，{deleted_files} 個圖片文件")
        else:
            self.message_user(request, "沒有刪除任何記錄", level='WARNING')
    
    delete_selected_with_files.short_description = "刪除選中的模板圖片（包括文件）"
    
    actions = ['delete_selected', 'delete_selected_with_files']
