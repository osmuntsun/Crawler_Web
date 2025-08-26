#!/usr/bin/env python
"""
排程執行器啟動腳本
這個腳本可以作為 Windows 服務或後台進程運行
"""

import os
import sys
import django
import time
import logging
from pathlib import Path

# 設置 Django 環境
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CrawlerWeb.settings')

# 初始化 Django
django.setup()

# 設置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scheduler.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def run_scheduler():
    """運行排程執行器"""
    from django.core.management import call_command
    
    logger.info('啟動排程執行器...')
    
    try:
        # 運行持續模式的排程執行器
        call_command('run_scheduler', continuous=True, interval=60)
    except KeyboardInterrupt:
        logger.info('排程執行器已停止')
    except Exception as e:
        logger.error(f'排程執行器錯誤: {str(e)}')
        # 如果發生錯誤，等待一段時間後重試
        time.sleep(300)  # 5分鐘後重試
        run_scheduler()

if __name__ == '__main__':
    run_scheduler()
