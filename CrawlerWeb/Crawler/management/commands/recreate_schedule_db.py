from django.core.management.base import BaseCommand
from django.db import connection
from django.apps import apps


class Command(BaseCommand):
    help = '重新創建排程資料庫，刪除舊表並創建新表'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='強制執行，不需要確認',
        )

    def handle(self, *args, **options):
        if not options['force']:
            confirm = input('這將刪除所有排程相關的數據，確定要繼續嗎？(yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.WARNING('操作已取消'))
                return

        self.stdout.write('開始重新創建排程資料庫...')

        try:
            with connection.cursor() as cursor:
                # 刪除舊的排程相關表
                self.stdout.write('刪除舊的排程相關表...')
                
                # 檢查表是否存在
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name IN (
                        'Crawler_schedule', 
                        'Crawler_scheduleexecution', 
                        'Crawler_scheduletemplate'
                    )
                """)
                existing_tables = [row[0] for row in cursor.fetchall()]
                
                for table in existing_tables:
                    cursor.execute(f'DROP TABLE IF EXISTS {table}')
                    self.stdout.write(f'已刪除表: {table}')

                # 創建新的 Schedule 表
                self.stdout.write('創建新的 Schedule 表...')
                cursor.execute('''
                    CREATE TABLE "Crawler_schedule" (
                        "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                        "name" varchar(200) NOT NULL,
                        "description" text NOT NULL,
                        "status" varchar(20) NOT NULL,
                        "is_active" bool NOT NULL,
                        "execution_days" text NOT NULL,
                        "posting_times" text NOT NULL,
                        "platform" varchar(20) NOT NULL,
                        "message_content" text NOT NULL,
                        "template_images" text NOT NULL,
                        "target_communities" text NOT NULL,
                        "total_executions" integer NOT NULL,
                        "successful_executions" integer NOT NULL,
                        "failed_executions" integer NOT NULL,
                        "created_at" datetime(6) NOT NULL,
                        "updated_at" datetime(6) NOT NULL,
                        "last_execution_time" datetime(6) NULL,
                        "user_id" bigint NOT NULL REFERENCES "Accounts_user" ("id") DEFERRABLE INITIALLY DEFERRED
                    )
                ''')

                # 創建新的 ScheduleExecution 表
                self.stdout.write('創建新的 ScheduleExecution 表...')
                cursor.execute('''
                    CREATE TABLE "Crawler_scheduleexecution" (
                        "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                        "status" varchar(20) NOT NULL,
                        "scheduled_time" datetime(6) NOT NULL,
                        "started_at" datetime(6) NULL,
                        "completed_at" datetime(6) NULL,
                        "result_message" text NOT NULL,
                        "error_details" text NOT NULL,
                        "execution_duration" integer NULL,
                        "posts_published" integer NOT NULL,
                        "posts_failed" integer NOT NULL,
                        "created_at" datetime(6) NOT NULL,
                        "updated_at" datetime(6) NOT NULL,
                        "schedule_id" bigint NOT NULL REFERENCES "Crawler_schedule" ("id") DEFERRABLE INITIALLY DEFERRED
                    )
                ''')

                # 創建索引
                self.stdout.write('創建索引...')
                cursor.execute('''
                    CREATE INDEX "Crawler_schedule_user_id_12345678" ON "Crawler_schedule" ("user_id")
                ''')
                cursor.execute('''
                    CREATE INDEX "Crawler_scheduleexecution_schedule_id_87654321" ON "Crawler_scheduleexecution" ("schedule_id")
                ''')
                cursor.execute('''
                    CREATE INDEX "Crawler_scheduleexecution_scheduled_time_abcdef12" ON "Crawler_scheduleexecution" ("scheduled_time")
                ''')

            self.stdout.write(self.style.SUCCESS('排程資料庫重新創建成功！'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'重新創建排程資料庫失敗: {str(e)}'))
            raise
