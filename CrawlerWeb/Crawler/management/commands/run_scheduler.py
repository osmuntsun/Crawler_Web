from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from Crawler.models import Schedule, ScheduleExecution
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class Command(BaseCommand):
    help = '執行排程發文檢查和執行'

    def add_arguments(self, parser):
        parser.add_argument(
            '--continuous',
            action='store_true',
            help='持續運行模式（每分鐘檢查一次）',
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=60,
            help='檢查間隔（秒），預設60秒',
        )

    def handle(self, *args, **options):
        if options['continuous']:
            self.stdout.write('開始持續運行排程執行器...')
            self.run_continuous_scheduler(options['interval'])
        else:
            self.stdout.write('執行單次排程檢查...')
            self.run_single_check()

    def run_continuous_scheduler(self, interval):
        """持續運行排程執行器"""
        import time
        
        while True:
            try:
                self.run_single_check()
                self.stdout.write(f'等待 {interval} 秒後進行下次檢查...')
                time.sleep(interval)
            except KeyboardInterrupt:
                self.stdout.write('排程執行器已停止')
                break
            except Exception as e:
                logger.error(f'排程執行器錯誤: {str(e)}')
                self.stdout.write(f'錯誤: {str(e)}')
                time.sleep(interval)

    def run_single_check(self):
        """執行單次排程檢查"""
        # 使用本地時間而不是 UTC 時間
        now = timezone.now()
        local_now = now.astimezone()  # 轉換為本地時間
        self.stdout.write(f'本地時間: {local_now}')
        
        # 獲取所有活躍的排程
        active_schedules = Schedule.objects.filter(
            is_active=True,
            status='active'
        )
        
        executed_count = 0
        for schedule in active_schedules:
            try:
                if self.should_execute_schedule(schedule, local_now):
                    self.execute_schedule(schedule, now)  # 執行記錄仍使用 UTC 時間
                    executed_count += 1
            except Exception as e:
                logger.error(f'執行排程 {schedule.id} 時發生錯誤: {str(e)}')
                self.stdout.write(f'排程 {schedule.id} 執行失敗: {str(e)}')
        
        self.stdout.write(f'本次檢查完成，執行了 {executed_count} 個排程')

    def should_execute_schedule(self, schedule, now):
        """檢查排程是否應該執行"""
        # 檢查是否為執行日期
        current_weekday = now.strftime('%A').lower()
        if current_weekday not in schedule.execution_days:
            return False
        
        # 檢查當前時間點是否已經執行過這個排程
        from datetime import timedelta
        
        # 檢查是否為執行時間
        current_time = now.time()
        time_matched = False
        matched_time_str = None
        
        for time_str in schedule.posting_times:
            try:
                schedule_time = datetime.strptime(time_str, '%H:%M').time()
                # 如果當前時間在排程時間的5分鐘內，則執行
                time_diff = abs((current_time.hour * 60 + current_time.minute) - 
                               (schedule_time.hour * 60 + schedule_time.minute))
                if time_diff <= 5:  # 5分鐘的容錯時間
                    time_matched = True
                    matched_time_str = time_str
                    break
            except ValueError:
                continue
        
        if not time_matched:
            return False
        
        # 檢查這個特定時間點是否已經執行過
        # 計算當前時間點的前後5分鐘範圍
        current_minutes = current_time.hour * 60 + current_time.minute
        
        for time_str in schedule.posting_times:
            try:
                schedule_time = datetime.strptime(time_str, '%H:%M').time()
                schedule_minutes = schedule_time.hour * 60 + schedule_time.minute
                
                # 如果時間差在5分鐘內，檢查是否已執行
                if abs(current_minutes - schedule_minutes) <= 5:
                    # 檢查這個時間範圍是否已經執行過
                    time_start = now.replace(hour=schedule_time.hour, minute=schedule_time.minute, second=0, microsecond=0)
                    time_end = time_start + timedelta(minutes=10)  # 10分鐘的執行窗口
                    
                    from Crawler.models import ScheduleExecution
                    existing_execution = ScheduleExecution.objects.filter(
                        schedule=schedule,
                        scheduled_time__gte=time_start,
                        scheduled_time__lt=time_end,
                        status__in=['started', 'completed', 'failed']
                    ).first()
                    
                    if existing_execution:
                        self.stdout.write(f'排程 {schedule.id} 在時間 {time_str} 已經執行過，跳過')
                        return False
                    
            except ValueError:
                continue
        
        return True

    def execute_schedule(self, schedule, now):
        """執行排程"""
        self.stdout.write(f'執行排程: {schedule.name}')
        
        # 創建執行記錄
        execution = ScheduleExecution.objects.create(
            schedule=schedule,
            scheduled_time=now,
            status='started'
        )
        
        try:
            # 標記為開始執行
            execution.mark_as_started()
            
            # 執行發文邏輯
            success_count = self.post_to_communities(schedule)
            
            # 更新執行記錄
            if success_count > 0:
                execution.mark_as_completed()
                execution.posts_published = success_count
                self.stdout.write(f'排程執行成功，發布了 {success_count} 個貼文')
            else:
                execution.mark_as_failed()
                execution.posts_failed = len(schedule.target_communities)
                self.stdout.write('排程執行失敗，沒有成功發布任何貼文')
            
            # 更新排程統計
            schedule.total_executions += 1
            if execution.status == 'completed':
                schedule.successful_executions += 1
            else:
                schedule.failed_executions += 1
            schedule.last_execution_time = now
            schedule.save()
            
        except Exception as e:
            execution.mark_as_failed()
            execution.posts_failed = len(schedule.target_communities)
            logger.error(f'排程執行異常: {str(e)}')
            self.stdout.write(f'排程執行異常: {str(e)}')

    def post_to_communities(self, schedule):
        """向社群發布貼文 - 使用與立即發文相同的邏輯"""
        from Crawler.views import FacebookAutomationView
        
        success_count = 0
        
        try:
            # 創建 Facebook 自動化視圖實例
            facebook_view = FacebookAutomationView()
            
            # 獲取用戶的 Cookie
            from Accounts.models import WebsiteCookie
            try:
                website_cookie = WebsiteCookie.objects.get(
                    user=schedule.user,
                    website=schedule.platform,
                    is_active=True
                )
            except WebsiteCookie.DoesNotExist:
                self.stdout.write(f'用戶 {schedule.user.username} 沒有 {schedule.platform} 的 Cookie')
                return 0
            
            # 設置驅動程式
            driver = facebook_view._setup_driver(headless=True)  # 排程發文使用 headless 模式，背景執行
            
            try:
                # 登入 Facebook
                driver.get("https://www.facebook.com/")
                
                # 添加 Cookie
                for name, value in website_cookie.cookie_data.items():
                    driver.add_cookie({'name': name, 'value': value})
                
                driver.refresh()
                import time
                time.sleep(2)
                
                # 向每個目標社群發布貼文
                for community_data in schedule.target_communities:
                    try:
                        community_url = community_data.get('url')
                        if not community_url:
                            continue
                        
                        # 前往社群並發布貼文
                        success = self.post_single_community_improved(
                            driver, 
                            community_data, 
                            schedule.message_content,
                            schedule.template_images,
                            facebook_view
                        )
                        
                        if success:
                            success_count += 1
                        
                        # 人類化延遲
                        facebook_view.human_delay(2, 3.0)
                        
                    except Exception as e:
                        logger.error(f'向社群 {community_data.get("name", "未知")} 發布失敗: {str(e)}')
                        continue
                
            finally:
                driver.quit()
                
        except Exception as e:
            logger.error(f'發布貼文時發生錯誤: {str(e)}')
        
        return success_count

    # 舊的發文方法已移除，現在使用 post_single_community_improved

    def post_single_community_improved(self, driver, community_data, message, template_images, facebook_view):
        """向單個社群發布貼文 - 使用與立即發文相同的人類化邏輯"""
        try:
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            
            community_url = community_data.get('url')
            driver.get(community_url)
            driver.refresh()
            
            # 等待發文按鈕出現
            WebDriverWait(driver, 3000).until(
                EC.presence_of_element_located((
                    By.XPATH, 
                    '/html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div/div[2]/div/div/div[4]/div/div[2]/div/div/div/div[1]/div/div/div/div[1]/div/div[1]/span'
                ))
            )
            
            # 點擊發文按鈕
            post_button = driver.find_element(
                By.XPATH,
                '/html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div/div[2]/div/div/div[4]/div/div[2]/div/div/div/div[1]/div/div/div/div[1]/div/div[1]/span'
            )
            
            # 人類化的鼠標移動
            facebook_view.human_move_mouse(driver, post_button)
            post_button.click()
            
            # 等待發文表單出現
            WebDriverWait(driver, 3000).until(
                EC.presence_of_element_located((
                    By.XPATH,
                    '/html/body/div[1]/div/div[1]/div/div[4]/div/div/div[1]/div/div[2]/div/div/div/div/div[1]/form/div/div[1]/div/div/div/div[2]/div[1]/div[1]/div[1]/div[1]/div/div/div[1]/p'
                ))
            )
            
            # 輸入發文內容
            post_input = driver.find_element(
                By.XPATH,
                '/html/body/div[1]/div/div[1]/div/div[4]/div/div/div[1]/div/div[2]/div/div/div/div/div[1]/form/div/div[1]/div/div/div/div[2]/div[1]/div[1]/div[1]/div[1]/div/div/div[1]/p'
            )
            
            # 人類化的鼠標移動和文字輸入
            facebook_view.human_move_mouse(driver, post_input)
            facebook_view.human_type(post_input, message)
            
            # 隨機人類行為
            facebook_view.random_human_behavior(driver)
            
            # 上傳圖片（如果有的話）
            if template_images:
                self.upload_images_improved(driver, template_images, facebook_view)
            
            # 點擊發文按鈕
            submit_button = driver.find_element(
                By.XPATH,
                '/html/body/div[1]/div/div[1]/div/div[4]/div/div/div[1]/div/div[2]/div/div/div/div/div[1]/form/div/div[1]/div/div/div/div[3]/div[3]/div[1]/div/div'
            )
            submit_button.click()
            
            # 等待發文完成
            facebook_view.human_delay(2.0, 3.0)
            
            return True
            
        except Exception as e:
            logger.error(f'向社群發布貼文失敗: {str(e)}')
            return False

    def upload_images_improved(self, driver, template_images, facebook_view):
        """上傳圖片 - 使用與立即發文相同的邏輯"""
        try:
            from selenium.webdriver.common.by import By
            import os
            from django.conf import settings
            
            # 查找圖片上傳按鈕
            post_img = driver.find_element(
                By.XPATH,
                '/html/body/div[1]/div/div[1]/div/div[4]/div/div/div[1]/div/div[2]/div/div/div/div/div[1]/form/div/div[1]/div/div/div/div[3]/div[1]/div[2]/div[1]/input'
            )
            
            # 處理每張圖片
            for img_data in template_images:
                try:
                    if isinstance(img_data, dict) and 'url' in img_data:
                        img_path = img_data['url']
                    else:
                        img_path = str(img_data)
                    
                    # 轉換圖片路徑為絕對路徑
                    if img_path.startswith('/media/'):
                        relative_path = img_path.replace('/media/', '')
                        relative_path = relative_path.replace('/', os.sep)
                        absolute_path = os.path.join(settings.BASE_DIR, 'media', relative_path)
                        
                        if os.path.exists(absolute_path):
                            post_img.send_keys(absolute_path)
                            facebook_view.human_delay(2.0, 4.0)
                except Exception as e:
                    logger.error(f'上傳圖片失敗: {str(e)}')
                    continue
                    
        except Exception as e:
            logger.error(f'圖片上傳過程失敗: {str(e)}')
