from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


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
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用戶', related_name='data_analysis_caches')
    analysis_type = models.CharField(max_length=20, choices=ANALYSIS_TYPE_CHOICES, verbose_name='分析類型')
    data = models.JSONField(verbose_name='分析數據', default=dict, blank=True)
    chart_config = models.JSONField(verbose_name='圖表配置', default=dict, blank=True)
    last_updated = models.DateTimeField(auto_now=True, verbose_name='最後更新時間')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='建立時間')
    
    class Meta:
        verbose_name = '數據分析緩存'
        verbose_name_plural = '數據分析緩存'
        unique_together = ['user', 'analysis_type']
        ordering = ['-last_updated']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_analysis_type_display()}"
    
    def get_data_summary(self):
        """獲取數據摘要"""
        data = self.data if self.data else {}
        chart_config = self.chart_config if self.chart_config else {}
        
        summary = {
            'analysis_type': self.get_analysis_type_display(),
            'data_keys': list(data.keys()) if isinstance(data, dict) else [],
            'chart_type': chart_config.get('type', '未知'),
            'last_updated': self.last_updated.strftime('%Y-%m-%d %H:%M:%S'),
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # 如果有標籤數據，添加標籤數量
        if 'labels' in data and isinstance(data['labels'], list):
            summary['label_count'] = len(data['labels'])
        
        # 如果有數據集，添加數據點數量
        if 'datasets' in data and isinstance(data['datasets'], list):
            for i, dataset in enumerate(data['datasets']):
                if 'data' in dataset and isinstance(dataset['data'], list):
                    summary[f'dataset_{i}_data_count'] = len(dataset['data'])
        
        return summary
    
    def update_data(self, new_data, new_chart_config):
        """更新分析數據"""
        self.data = new_data
        self.chart_config = new_chart_config
        self.save()
        return self
