# Generated manually to add new fields without removing old ones

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('Crawler', '0002_schedule_platform'),
    ]

    operations = [
        # Add new fields to Schedule
        migrations.AddField(
            model_name='schedule',
            name='execution_days',
            field=models.JSONField(blank=True, default=list, verbose_name='執行日期'),
        ),
        migrations.AddField(
            model_name='schedule',
            name='posting_times',
            field=models.JSONField(blank=True, default=list, verbose_name='發文時間'),
        ),
        
        # Add new fields to ScheduleExecution
        migrations.AddField(
            model_name='scheduleexecution',
            name='execution_time',
            field=models.DateTimeField(default=django.utils.timezone.now, verbose_name='執行時間'),
        ),
        migrations.AddField(
            model_name='scheduleexecution',
            name='result_message',
            field=models.TextField(blank=True, verbose_name='執行結果訊息'),
        ),
        migrations.AddField(
            model_name='scheduleexecution',
            name='error_details',
            field=models.TextField(blank=True, verbose_name='錯誤詳情'),
        ),
        migrations.AddField(
            model_name='scheduleexecution',
            name='execution_duration',
            field=models.PositiveIntegerField(blank=True, null=True, verbose_name='執行時長(秒)'),
        ),
    ]
