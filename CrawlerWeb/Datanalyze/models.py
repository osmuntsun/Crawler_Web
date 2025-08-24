from django.db import models
from django.conf import settings
from django.utils import timezone
import json

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
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name='用戶', related_name='data_analysis_caches')
    analysis_type = models.CharField(max_length=20, choices=ANALYSIS_TYPE_CHOICES, verbose_name='分析類型')
    data = models.TextField(verbose_name='分析數據')  # 儲存 JSON 字符串
    chart_config = models.TextField(verbose_name='圖表配置')  # 儲存 JSON 字符串
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
        import json
        try:
            data = json.loads(self.data) if self.data else {}
            chart_config = json.loads(self.chart_config) if self.chart_config else {}
        except json.JSONDecodeError:
            data = {}
            chart_config = {}
            
        return {
            'type': self.analysis_type,
            'data': data,
            'chart_config': chart_config,
            'last_updated': self.last_updated.isoformat(),
            'created_at': self.created_at.isoformat()
        }
    
    def update_data(self, new_data, new_chart_config):
        """更新分析數據和圖表配置"""
        import json
        self.data = json.dumps(new_data, ensure_ascii=False)
        self.chart_config = json.dumps(new_chart_config, ensure_ascii=False)
        self.save()
        return self
