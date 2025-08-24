from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, WebsiteCookie, Community, PostTemplate, PostTemplateImage, SocialMediaPost, DataAnalysisCache, Schedule, ScheduleExecution, ScheduleTemplate

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


@admin.register(SocialMediaPost)
class SocialMediaPostAdmin(admin.ModelAdmin):
    """社交媒體貼文管理界面"""
    list_display = ('user', 'platform', 'post_id', 'reach_count', 'like_count', 'share_count', 'comment_count', 'engagement_rate', 'data_collected_at')
    list_filter = ('platform', 'user', 'posted_at', 'data_collected_at')
    search_fields = ('user__username', 'post_id', 'content', 'post_url')
    ordering = ('-data_collected_at', '-posted_at')
    readonly_fields = ('created_at', 'updated_at', 'data_collected_at', 'engagement_rate')
    
    fieldsets = (
        ('基本資訊', {'fields': ('user', 'platform', 'post_id', 'content', 'post_url')}),
        ('數據分析', {'fields': ('reach_count', 'like_count', 'share_count', 'view_time_seconds', 'save_count', 'comment_count')}),
        ('時間資訊', {'fields': ('posted_at', 'data_collected_at', 'created_at', 'updated_at')}),
    )
    
    def get_engagement_summary(self, obj):
        return obj.get_engagement_summary()
    get_engagement_summary.short_description = '互動摘要'


@admin.register(DataAnalysisCache)
class DataAnalysisCacheAdmin(admin.ModelAdmin):
    """數據分析緩存管理界面"""
    list_display = ('user', 'analysis_type', 'last_updated', 'created_at')
    list_filter = ('analysis_type', 'last_updated', 'created_at')
    search_fields = ('user__username', 'user__email')
    ordering = ('-last_updated',)
    readonly_fields = ('created_at', 'last_updated')
    
    fieldsets = (
        ('基本資訊', {'fields': ('user', 'analysis_type')}),
        ('分析數據', {'fields': ('data', 'chart_config')}),
        ('時間資訊', {'fields': ('created_at', 'last_updated')}),
    )
    
    def get_data_summary(self, obj):
        return obj.get_data_summary()
    get_data_summary.short_description = '數據摘要'


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    """排程設定管理界面"""
    list_display = ('name', 'user', 'status', 'frequency', 'next_execution', 'total_executions', 'created_at')
    list_filter = ('status', 'frequency', 'is_active', 'created_at', 'next_execution')
    search_fields = ('name', 'user__username', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('total_executions', 'successful_executions', 'failed_executions', 'last_execution_time', 'created_at', 'updated_at')
    
    fieldsets = (
        ('基本資訊', {'fields': ('user', 'name', 'description')}),
        ('排程狀態', {'fields': ('status', 'is_active')}),
        ('時間設定', {'fields': ('start_time', 'end_time', 'frequency', 'interval_minutes', 'next_execution')}),
        ('內容設定', {'fields': ('template', 'custom_content', 'custom_hashtags')}),
        ('圖片設定', {'fields': ('use_template_images', 'additional_images')}),
        ('發布設定', {'fields': ('platforms', 'target_communities')}),
        ('執行統計', {'fields': ('total_executions', 'successful_executions', 'failed_executions', 'last_execution_time')}),
        ('時間資訊', {'fields': ('created_at', 'updated_at')}),
    )
    
    def get_execution_status(self, obj):
        return obj.get_execution_status()
    get_execution_status.short_description = '執行狀態'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'template')


@admin.register(ScheduleExecution)
class ScheduleExecutionAdmin(admin.ModelAdmin):
    """排程執行記錄管理界面"""
    list_display = ('schedule', 'status', 'scheduled_time', 'started_at', 'completed_at', 'success_count', 'failure_count', 'total_count')
    list_filter = ('status', 'scheduled_time', 'started_at', 'completed_at')
    search_fields = ('schedule__name', 'schedule__user__username')
    ordering = ('-created_at',)
    readonly_fields = ('schedule', 'scheduled_time', 'started_at', 'completed_at', 'success_count', 'failure_count', 'total_count', 'created_at', 'updated_at')
    
    fieldsets = (
        ('基本資訊', {'fields': ('schedule', 'status')}),
        ('執行時間', {'fields': ('scheduled_time', 'started_at', 'completed_at')}),
        ('執行結果', {'fields': ('success_count', 'failure_count', 'total_count')}),
        ('執行詳情', {'fields': ('execution_log', 'error_messages')}),
        ('發布詳情', {'fields': ('published_posts',)}),
        ('統計數據', {'fields': ('reach_count', 'like_count', 'share_count', 'comment_count')}),
        ('時間資訊', {'fields': ('created_at', 'updated_at')}),
    )
    
    def get_execution_duration(self, obj):
        duration = obj.get_execution_duration()
        if duration:
            return str(duration).split('.')[0]  # 移除微秒
        return '-'
    get_execution_duration.short_description = '執行持續時間'
    
    def get_success_rate(self, obj):
        return f"{obj.get_success_rate():.1f}%"
    get_success_rate.short_description = '成功率'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('schedule', 'schedule__user')


@admin.register(ScheduleTemplate)
class ScheduleTemplateAdmin(admin.ModelAdmin):
    """排程模板管理界面"""
    list_display = ('name', 'template_type', 'default_frequency', 'default_interval_minutes', 'usage_count', 'created_at')
    list_filter = ('template_type', 'default_frequency', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-usage_count', '-created_at')
    readonly_fields = ('usage_count', 'created_at', 'updated_at')
    
    fieldsets = (
        ('基本資訊', {'fields': ('name', 'description', 'template_type')}),
        ('預設設定', {'fields': ('default_frequency', 'default_interval_minutes')}),
        ('預設內容', {'fields': ('default_content_template', 'default_hashtags')}),
        ('預設平台和社團', {'fields': ('default_platforms', 'default_communities')}),
        ('使用統計', {'fields': ('usage_count',)}),
        ('時間資訊', {'fields': ('created_at', 'updated_at')}),
    )
