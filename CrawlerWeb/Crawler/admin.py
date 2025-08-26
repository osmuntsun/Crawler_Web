from django.contrib import admin
from .models import (
    Community, PostTemplate, PostTemplateImage, SocialMediaPost,
    Schedule, ScheduleExecution
)


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


class ExecutionDaysFilter(admin.SimpleListFilter):
    """執行日期篩選器"""
    title = '執行日期'
    parameter_name = 'execution_days'

    def lookups(self, request, model_admin):
        return (
            ('monday', '週一'),
            ('tuesday', '週二'),
            ('wednesday', '週三'),
            ('thursday', '週四'),
            ('friday', '週五'),
            ('saturday', '週六'),
            ('sunday', '週日'),
        )

    def queryset(self, request, queryset):
        if self.value():
            # 使用字符串查詢，兼容所有數據庫
            from django.db.models import Q
            return queryset.filter(execution_days__icontains=self.value())
        return queryset

class UserFilter(admin.SimpleListFilter):
    """使用者篩選器"""
    title = '使用者'
    parameter_name = 'user'

    def lookups(self, request, model_admin):
        # 獲取所有有排程的使用者
        users = model_admin.model.objects.values_list('user__id', 'user__username').distinct()
        return [(str(user_id), username) for user_id, username in users if user_id and username]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(user__id=self.value())
        return queryset

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    """排程發文設定管理"""
    list_display = ('name', 'user', 'platform', 'status', 'is_active', 'execution_days_display', 'posting_times_display', 'total_executions', 'created_at')
    list_filter = (UserFilter, ExecutionDaysFilter, 'status', 'is_active', 'platform', 'created_at')
    search_fields = ('name', 'user__username', 'platform')
    readonly_fields = ('total_executions', 'successful_executions', 'failed_executions', 'last_execution_time', 'created_at', 'updated_at')
    
    fieldsets = (
        ('基本資訊', {
            'fields': ('user', 'name', 'description', 'status', 'is_active')
        }),
        ('排程設定', {
            'fields': ('execution_days', 'posting_times')
        }),
        ('發文內容', {
            'fields': ('platform', 'message_content', 'template_images', 'target_communities')
        }),
        ('執行統計', {
            'fields': ('total_executions', 'successful_executions', 'failed_executions', 'last_execution_time'),
            'classes': ('collapse',)
        }),
        ('時間資訊', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def execution_days_display(self, obj):
        """顯示執行日期"""
        if obj.execution_days:
            day_names = {
                'monday': '週一', 'tuesday': '週二', 'wednesday': '週三',
                'thursday': '週四', 'friday': '週五', 'saturday': '週六', 'sunday': '週日'
            }
            return ', '.join([day_names.get(day, day) for day in obj.execution_days])
        return '未設定'
    execution_days_display.short_description = '執行日期'
    
    def posting_times_display(self, obj):
        """顯示發文時間"""
        if obj.posting_times:
            return ', '.join(obj.posting_times)
        return '未設定'
    posting_times_display.short_description = '發文時間'


@admin.register(ScheduleExecution)
class ScheduleExecutionAdmin(admin.ModelAdmin):
    """排程執行記錄管理"""
    list_display = ('schedule', 'status', 'scheduled_time', 'posts_published', 'posts_failed', 'execution_duration', 'created_at')
    list_filter = ('status', 'scheduled_time', 'created_at')
    search_fields = ('schedule__name', 'schedule__user__username')
    readonly_fields = ('schedule', 'scheduled_time', 'created_at', 'updated_at')
    
    fieldsets = (
        ('基本資訊', {
            'fields': ('schedule', 'status')
        }),
        ('執行時間', {
            'fields': ('scheduled_time', 'started_at', 'completed_at')
        }),
        ('執行結果', {
            'fields': ('result_message', 'error_details', 'execution_duration')
        }),
        ('發布統計', {
            'fields': ('posts_published', 'posts_failed')
        }),
        ('時間資訊', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        """優化查詢"""
        return super().get_queryset(request).select_related('schedule', 'schedule__user')
