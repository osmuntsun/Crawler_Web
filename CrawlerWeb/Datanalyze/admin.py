from django.contrib import admin
from .models import DataAnalysisCache

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
