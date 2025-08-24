from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random
from Accounts.models import SocialMediaPost

User = get_user_model()

class Command(BaseCommand):
    help = '生成測試用的社交媒體貼文數據'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=str,
            help='指定用戶名，如果不指定則使用第一個用戶'
        )
        parser.add_argument(
            '--count',
            type=int,
            default=50,
            help='要生成的貼文數量 (預設: 50)'
        )

    def handle(self, *args, **options):
        username = options['user']
        count = options['count']
        
        # 獲取用戶
        if username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'用戶 "{username}" 不存在')
                )
                return
        else:
            user = User.objects.first()
            if not user:
                self.stdout.write(
                    self.style.ERROR('沒有找到任何用戶，請先創建用戶')
                )
                return
        
        self.stdout.write(f'開始為用戶 "{user.username}" 生成 {count} 條測試數據...')
        
        # 平台列表
        platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube']
        
        # 生成測試數據
        posts_created = 0
        for i in range(count):
            # 隨機選擇平台
            platform = random.choice(platforms)
            
            # 生成隨機數據
            reach_count = random.randint(100, 10000)
            like_count = random.randint(10, reach_count // 10)
            share_count = random.randint(0, like_count // 5)
            view_time_seconds = random.randint(5, 300)
            save_count = random.randint(0, like_count // 10)
            comment_count = random.randint(0, like_count // 8)
            
            # 隨機發布時間（過去30天內）
            days_ago = random.randint(0, 30)
            posted_at = timezone.now() - timedelta(days=days_ago)
            
            # 創建貼文
            post = SocialMediaPost.objects.create(
                user=user,
                platform=platform,
                post_id=f'test_post_{i}_{platform}_{random.randint(1000, 9999)}',
                content=f'這是測試貼文 #{i+1}，發布在 {platform} 平台上。',
                post_url=f'https://{platform}.com/test/post/{i}',
                reach_count=reach_count,
                like_count=like_count,
                share_count=share_count,
                view_time_seconds=view_time_seconds,
                save_count=save_count,
                comment_count=comment_count,
                posted_at=posted_at
            )
            
            posts_created += 1
            
            if posts_created % 10 == 0:
                self.stdout.write(f'已創建 {posts_created} 條數據...')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'成功創建 {posts_created} 條測試數據！'
            )
        )
        
        # 顯示統計信息
        total_posts = SocialMediaPost.objects.filter(user=user).count()
        total_reach = sum(post.reach_count for post in SocialMediaPost.objects.filter(user=user))
        total_likes = sum(post.like_count for post in SocialMediaPost.objects.filter(user=user))
        total_shares = sum(post.share_count for post in SocialMediaPost.objects.filter(user=user))
        total_comments = sum(post.comment_count for post in SocialMediaPost.objects.filter(user=user))
        
        self.stdout.write('\n統計摘要:')
        self.stdout.write(f'總貼文數: {total_posts}')
        self.stdout.write(f'總觸及人數: {total_reach:,}')
        self.stdout.write(f'總按讚數: {total_likes:,}')
        self.stdout.write(f'總分享數: {total_shares:,}')
        self.stdout.write(f'總留言數: {total_comments:,}')
        
        if total_reach > 0:
            engagement_rate = ((total_likes + total_shares + total_comments) / total_reach) * 100
            self.stdout.write(f'平均互動率: {engagement_rate:.2f}%')
