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
        # 獲取所有有排程的使用者，使用 Python 去重確保唯一性
        users = model_admin.model.objects.values('user__id', 'user__username')
        unique_users = {}
        for user in users:
            user_id = user['user__id']
            username = user['user__username']
            if user_id and username and user_id not in unique_users:
                unique_users[user_id] = username
        
        return [(str(user_id), username) for user_id, username in unique_users.items()]

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


class ScheduleExecutionUserFilter(admin.SimpleListFilter):
    """排程執行記錄使用者篩選器"""
    title = '使用者'
    parameter_name = 'user'

    def lookups(self, request, model_admin):
        # 獲取所有有執行記錄的使用者，使用 Python 去重確保唯一性
        users = model_admin.model.objects.values('schedule__user__id', 'schedule__user__username')
        unique_users = {}
        for user in users:
            user_id = user['schedule__user__id']
            username = user['schedule__user__username']
            if user_id and username and user_id not in unique_users:
                unique_users[user_id] = username
        
        return [(str(user_id), username) for user_id, username in unique_users.items()]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(schedule__user__id=self.value())
        return queryset


class ScheduleExecutionScheduleFilter(admin.SimpleListFilter):
    """排程執行記錄排程篩選器"""
    title = '排程名稱'
    parameter_name = 'schedule'

    def lookups(self, request, model_admin):
        # 獲取所有有執行記錄的排程，使用 Python 去重確保唯一性
        schedules = model_admin.model.objects.values('schedule__id', 'schedule__name')
        unique_schedules = {}
        for schedule in schedules:
            schedule_id = schedule['schedule__id']
            schedule_name = schedule['schedule__name']
            if schedule_id and schedule_name and schedule_id not in unique_schedules:
                unique_schedules[schedule_id] = schedule_name
        
        return [(str(schedule_id), schedule_name) for schedule_id, schedule_name in unique_schedules.items()]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(schedule__id=self.value())
        return queryset


class ScheduleExecutionDateRangeFilter(admin.SimpleListFilter):
    """排程執行記錄日期範圍篩選器"""
    title = '執行日期範圍'
    parameter_name = 'date_range'

    def lookups(self, request, model_admin):
        return (
            ('today', '今天'),
            ('yesterday', '昨天'),
            ('this_week', '本週'),
            ('last_week', '上週'),
            ('this_month', '本月'),
            ('last_month', '上月'),
            ('last_7_days', '最近7天'),
            ('last_30_days', '最近30天'),
            ('last_90_days', '最近90天'),
        )

    def queryset(self, request, queryset):
        from django.utils import timezone
        from datetime import timedelta
        import datetime
        
        now = timezone.now()
        today = now.date()
        
        if self.value() == 'today':
            return queryset.filter(scheduled_time__date=today)
        elif self.value() == 'yesterday':
            yesterday = today - timedelta(days=1)
            return queryset.filter(scheduled_time__date=yesterday)
        elif self.value() == 'this_week':
            # 獲取本週的開始日期（週一）
            start_of_week = today - timedelta(days=today.weekday())
            return queryset.filter(scheduled_time__date__gte=start_of_week)
        elif self.value() == 'last_week':
            # 獲取上週的開始日期（週一）
            start_of_last_week = today - timedelta(days=today.weekday() + 7)
            end_of_last_week = start_of_last_week + timedelta(days=6)
            return queryset.filter(scheduled_time__date__range=[start_of_last_week, end_of_last_week])
        elif self.value() == 'this_month':
            # 獲取本月的開始日期
            start_of_month = today.replace(day=1)
            return queryset.filter(scheduled_time__date__gte=start_of_month)
        elif self.value() == 'last_month':
            # 獲取上月的開始日期
            if today.month == 1:
                start_of_last_month = today.replace(year=today.year-1, month=12, day=1)
            else:
                start_of_last_month = today.replace(month=today.month-1, day=1)
            
            # 獲取上月的結束日期
            if today.month == 1:
                end_of_last_month = today.replace(year=today.year-1, month=12, day=31)
            else:
                if today.month == 2:
                    end_of_last_month = today.replace(month=today.month-1, day=28)
                elif today.month in [4, 6, 9, 11]:
                    end_of_last_month = today.replace(month=today.month-1, day=30)
                else:
                    end_of_last_month = today.replace(month=today.month-1, day=31)
            
            return queryset.filter(scheduled_time__date__range=[start_of_last_month, end_of_last_month])
        elif self.value() == 'last_7_days':
            start_date = today - timedelta(days=7)
            return queryset.filter(scheduled_time__date__gte=start_date)
        elif self.value() == 'last_30_days':
            start_date = today - timedelta(days=30)
            return queryset.filter(scheduled_time__date__gte=start_date)
        elif self.value() == 'last_90_days':
            start_date = today - timedelta(days=90)
            return queryset.filter(scheduled_time__date__gte=start_date)
        
        return queryset


class ScheduleExecutionStatusFilter(admin.SimpleListFilter):
    """排程執行記錄狀態篩選器"""
    title = '執行狀態'
    parameter_name = 'execution_status'

    def lookups(self, request, model_admin):
        return (
            ('completed', '已完成'),
            ('failed', '失敗'),
            ('running', '執行中'),
            ('pending', '等待中'),
            ('cancelled', '已取消'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'completed':
            return queryset.filter(status='completed')
        elif self.value() == 'failed':
            return queryset.filter(status='failed')
        elif self.value() == 'running':
            return queryset.filter(status='running')
        elif self.value() == 'pending':
            return queryset.filter(status='pending')
        elif self.value() == 'cancelled':
            return queryset.filter(status='cancelled')
        
        return queryset

@admin.register(ScheduleExecution)
class ScheduleExecutionAdmin(admin.ModelAdmin):
    """排程執行記錄管理"""
    list_display = ('schedule', 'user_display', 'status_display', 'scheduled_time', 'posts_published', 'posts_failed', 'execution_duration', 'created_at')
    list_filter = (
        ScheduleExecutionUserFilter, 
        ScheduleExecutionScheduleFilter,
        ScheduleExecutionStatusFilter,
        ScheduleExecutionDateRangeFilter,
        'scheduled_time', 
        'created_at'
    )
    search_fields = ('schedule__name', 'schedule__user__username')
    readonly_fields = ('schedule', 'scheduled_time', 'created_at', 'updated_at')
    list_per_page = 50
    ordering = ('-scheduled_time',)
    actions = ['retry_failed_executions', 'cancel_pending_executions']
    
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
    
    def user_display(self, obj):
        """顯示使用者名稱"""
        if obj.schedule and obj.schedule.user:
            return obj.schedule.user.username
        return '-'
    user_display.short_description = '使用者'
    user_display.admin_order_field = 'schedule__user__username'
    
    def status_display(self, obj):
        """顯示狀態（帶顏色和樣式）"""
        from django.utils.html import mark_safe
        
        status_config = {
            'pending': {
                'color': '#ff8c00',
                'bg_color': '#fff3e0',
                'border_color': '#ffb74d',
                'icon': '⏳'
            },
            'running': {
                'color': '#1976d2',
                'bg_color': '#e3f2fd',
                'border_color': '#64b5f6',
                'icon': '🔄'
            },
            'completed': {
                'color': '#388e3c',
                'bg_color': '#e8f5e8',
                'border_color': '#81c784',
                'icon': '✅'
            },
            'failed': {
                'color': '#d32f2f',
                'bg_color': '#ffebee',
                'border_color': '#e57373',
                'icon': '❌'
            },
            'cancelled': {
                'color': '#757575',
                'bg_color': '#f5f5f5',
                'border_color': '#bdbdbd',
                'icon': '🚫'
            }
        }
        
        config = status_config.get(obj.status, {
            'color': '#000000',
            'bg_color': '#ffffff',
            'border_color': '#e0e0e0',
            'icon': '❓'
        })
        
        html = f'''
        <span style="
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            color: {config['color']};
            background-color: {config['bg_color']};
            border: 1px solid {config['border_color']};
            text-align: center;
            min-width: 80px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        ">
            {config['icon']} {obj.get_status_display()}
        </span>
        '''
        return mark_safe(html)
    status_display.short_description = '狀態'
    status_display.admin_order_field = 'status'
    
    def retry_failed_executions(self, request, queryset):
        """重試失敗的執行記錄"""
        failed_executions = queryset.filter(status='failed')
        count = failed_executions.count()
        
        if count == 0:
            self.message_user(request, "沒有找到失敗的執行記錄", level='WARNING')
            return
        
        # 這裡可以實現重試邏輯
        for execution in failed_executions:
            execution.status = 'pending'
            execution.save()
        
        self.message_user(request, f"成功重試 {count} 個失敗的執行記錄")
    retry_failed_executions.short_description = "重試失敗的執行記錄"
    
    def cancel_pending_executions(self, request, queryset):
        """取消等待中的執行記錄"""
        pending_executions = queryset.filter(status='pending')
        count = pending_executions.count()
        
        if count == 0:
            self.message_user(request, "沒有找到等待中的執行記錄", level='WARNING')
            return
        
        for execution in pending_executions:
            execution.status = 'cancelled'
            execution.save()
        
        self.message_user(request, f"成功取消 {count} 個等待中的執行記錄")
    cancel_pending_executions.short_description = "取消等待中的執行記錄"
