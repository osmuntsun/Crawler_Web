from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db.models import Avg, Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from Crawler.models import SocialMediaPost
from .models import DataAnalysisCache
import json

# Create your views here.

@login_required
def data_analysis_dashboard(request):
    """數據分析儀表板"""
    context = {
        'user': request.user,
        'analysis_types': [
            {'key': 'reach_analysis', 'name': '觸及率分析', 'icon': '📊'},
            {'key': 'like_analysis', 'name': '按讚次數分析', 'icon': '👍'},
            {'key': 'share_analysis', 'name': '分享次數分析', 'icon': '🔄'},
            {'key': 'view_time_analysis', 'name': '停留時間分析', 'icon': '⏱️'},
            {'key': 'save_analysis', 'name': '收藏次數分析', 'icon': '⭐'},
            {'key': 'comment_analysis', 'name': '留言數量分析', 'icon': '💬'},
        ]
    }
    return render(request, 'Datanalyze/dashboard.html', context)

@login_required
def get_analysis_data(request, analysis_type):
    """獲取分析數據"""
    try:
        # 檢查是否有緩存數據
        cache, created = DataAnalysisCache.objects.get_or_create(
            user=request.user,
            analysis_type=analysis_type,
            defaults={'data': {}, 'chart_config': {}}
        )
        
        # 如果沒有數據或數據過期，重新分析
        if created or cache.data == {} or is_cache_expired(cache.last_updated):
            data, chart_config = perform_analysis(request.user, analysis_type)
            cache.update_data(data, chart_config)
        else:
            data = cache.data
            chart_config = cache.chart_config
        
        return JsonResponse({
            'success': True,
            'data': data,
            'chart_config': chart_config,
            'last_updated': cache.last_updated.isoformat()
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@login_required
def refresh_analysis_data(request, analysis_type):
    """刷新分析數據"""
    try:
        # 執行新的分析
        data, chart_config = perform_analysis(request.user, analysis_type)
        
        # 更新或創建緩存
        cache, created = DataAnalysisCache.objects.get_or_create(
            user=request.user,
            analysis_type=analysis_type,
            defaults={'data': {}, 'chart_config': {}}
        )
        cache.update_data(data, chart_config)
        
        return JsonResponse({
            'success': True,
            'data': data,
            'chart_config': chart_config,
            'last_updated': cache.last_updated.isoformat(),
            'message': '數據已成功更新'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

def perform_analysis(user, analysis_type):
    """執行數據分析"""
    # 獲取用戶的社交媒體貼文數據
    posts = SocialMediaPost.objects.filter(user=user)
    
    if not posts.exists():
        # 如果沒有數據，返回空數據結構
        return get_empty_analysis_data(analysis_type)
    
    # 根據分析類型執行不同的分析
    if analysis_type == 'reach_analysis':
        return analyze_reach_data(posts)
    elif analysis_type == 'like_analysis':
        return analyze_like_data(posts)
    elif analysis_type == 'share_analysis':
        return analyze_share_data(posts)
    elif analysis_type == 'view_time_analysis':
        return analyze_view_time_data(posts)
    elif analysis_type == 'save_analysis':
        return analyze_save_data(posts)
    elif analysis_type == 'comment_analysis':
        return analyze_comment_data(posts)
    else:
        raise ValueError(f"不支援的分析類型: {analysis_type}")

def get_empty_analysis_data(analysis_type):
    """獲取空的分析數據結構"""
    empty_data = {
        'labels': [],
        'datasets': [{
            'label': '數據',
            'data': [],
            'backgroundColor': 'rgba(54, 162, 235, 0.2)',
            'borderColor': 'rgba(54, 162, 235, 1)',
            'borderWidth': 1
        }]
    }
    
    empty_config = {
        'type': 'line',
        'options': {
            'responsive': True,
            'plugins': {
                'title': {
                    'display': True,
                    'text': f'{get_analysis_type_name(analysis_type)} - 暫無數據'
                }
            }
        }
    }
    
    return empty_data, empty_config

def analyze_reach_data(posts):
    """分析觸及率數據"""
    # 按平台分組統計觸及率
    platform_data = posts.values('platform').annotate(
        avg_reach=Avg('reach_count'),
        total_reach=Sum('reach_count'),
        post_count=Count('id')
    ).order_by('-avg_reach')
    
    labels = [item['platform'] for item in platform_data]
    data = [float(item['avg_reach']) for item in platform_data]
    
    chart_data = {
        'labels': labels,
        'datasets': [{
            'label': '平均觸及人數',
            'data': data,
            'backgroundColor': 'rgba(255, 99, 132, 0.2)',
            'borderColor': 'rgba(255, 99, 132, 1)',
            'borderWidth': 2
        }]
    }
    
    chart_config = {
        'type': 'bar',
        'options': {
            'responsive': True,
            'plugins': {
                'title': {
                    'display': True,
                    'text': '各平台觸及率分析'
                },
                'legend': {
                    'display': True
                }
            },
            'scales': {
                'y': {
                    'beginAtZero': True,
                    'title': {
                        'display': True,
                        'text': '觸及人數'
                    }
                }
            }
        }
    }
    
    return chart_data, chart_config

def analyze_like_data(posts):
    """分析按讚次數數據"""
    # 按時間分組統計按讚數
    time_data = posts.extra(
        select={'date': 'DATE(data_collected_at)'}
    ).values('date').annotate(
        total_likes=Sum('like_count'),
        avg_likes=Avg('like_count')
    ).order_by('date')[:30]  # 最近30天
    
    labels = [item['date'] for item in time_data]
    data = [float(item['total_likes']) for item in time_data]
    
    chart_data = {
        'labels': labels,
        'datasets': [{
            'label': '總按讚數',
            'data': data,
            'backgroundColor': 'rgba(54, 162, 235, 0.2)',
            'borderColor': 'rgba(54, 162, 235, 1)',
            'borderWidth': 2,
            'fill': False
        }]
    }
    
    chart_config = {
        'type': 'line',
        'options': {
            'responsive': True,
            'plugins': {
                'title': {
                    'display': True,
                    'text': '按讚次數趨勢分析'
                }
            },
            'scales': {
                'y': {
                    'beginAtZero': True,
                    'title': {
                        'display': True,
                        'text': '按讚數'
                    }
                }
            }
        }
    }
    
    return chart_data, chart_config

def analyze_share_data(posts):
    """分析分享次數數據"""
    # 按平台分組統計分享數
    platform_data = posts.values('platform').annotate(
        total_shares=Sum('share_count'),
        avg_shares=Avg('share_count')
    ).order_by('-total_shares')
    
    labels = [item['platform'] for item in platform_data]
    data = [float(item['total_shares']) for item in platform_data]
    
    chart_data = {
        'labels': labels,
        'datasets': [{
            'label': '總分享數',
            'data': data,
            'backgroundColor': 'rgba(75, 192, 192, 0.2)',
            'borderColor': 'rgba(75, 192, 192, 1)',
            'borderWidth': 2
        }]
    }
    
    chart_config = {
        'type': 'doughnut',
        'options': {
            'responsive': True,
            'plugins': {
                'title': {
                    'display': True,
                    'text': '各平台分享次數分析'
                }
            }
        }
    }
    
    return chart_data, chart_config

def analyze_view_time_data(posts):
    """分析停留時間數據"""
    # 按時間分組統計停留時間
    time_data = posts.extra(
        select={'date': 'DATE(data_collected_at)'}
    ).values('date').annotate(
        avg_view_time=Avg('view_time_seconds')
    ).order_by('date')[:30]  # 最近30天
    
    labels = [item['date'] for item in time_data]
    data = [float(item['avg_view_time']) for item in time_data]
    
    chart_data = {
        'labels': labels,
        'datasets': [{
            'label': '平均停留時間(秒)',
            'data': data,
            'backgroundColor': 'rgba(255, 205, 86, 0.2)',
            'borderColor': 'rgba(255, 205, 86, 1)',
            'borderWidth': 2,
            'fill': True
        }]
    }
    
    chart_config = {
        'type': 'area',
        'options': {
            'responsive': True,
            'plugins': {
                'title': {
                    'display': True,
                    'text': '停留時間趨勢分析'
                }
            },
            'scales': {
                'y': {
                    'beginAtZero': True,
                    'title': {
                        'display': True,
                        'text': '停留時間(秒)'
                    }
                }
            }
        }
    }
    
    return chart_data, chart_config

def analyze_save_data(posts):
    """分析收藏次數數據"""
    # 按平台分組統計收藏數
    platform_data = posts.values('platform').annotate(
        total_saves=Sum('save_count'),
        avg_saves=Avg('save_count')
    ).order_by('-total_saves')
    
    labels = [item['platform'] for item in platform_data]
    data = [float(item['total_saves']) for item in platform_data]
    
    chart_data = {
        'labels': labels,
        'datasets': [{
            'label': '總收藏數',
            'data': data,
            'backgroundColor': 'rgba(153, 102, 255, 0.2)',
            'borderColor': 'rgba(153, 102, 255, 1)',
            'borderWidth': 2
        }]
    }
    
    chart_config = {
        'type': 'polarArea',
        'options': {
            'responsive': True,
            'plugins': {
                'title': {
                    'display': True,
                    'text': '各平台收藏次數分析'
                }
            }
        }
    }
    
    return chart_data, chart_config

def analyze_comment_data(posts):
    """分析留言數量數據"""
    # 按時間分組統計留言數
    time_data = posts.extra(
        select={'date': 'DATE(data_collected_at)'}
    ).values('date').annotate(
        total_comments=Sum('comment_count'),
        avg_comments=Avg('comment_count')
    ).order_by('date')[:30]  # 最近30天
    
    labels = [item['date'] for item in time_data]
    data = [float(item['total_comments']) for item in time_data]
    
    chart_data = {
        'labels': labels,
        'datasets': [{
            'label': '總留言數',
            'data': data,
            'backgroundColor': 'rgba(255, 159, 64, 0.2)',
            'borderColor': 'rgba(255, 159, 64, 1)',
            'borderWidth': 2,
            'tension': 0.4
        }]
    }
    
    chart_config = {
        'type': 'line',
        'options': {
            'responsive': True,
            'plugins': {
                'title': {
                    'display': True,
                    'text': '留言數量趨勢分析'
                }
            },
            'scales': {
                'y': {
                    'beginAtZero': True,
                    'title': {
                        'display': True,
                        'text': '留言數'
                    }
                }
            }
        }
    }
    
    return chart_data, chart_config

def get_analysis_type_name(analysis_type):
    """獲取分析類型的中文名稱"""
    type_names = {
        'reach_analysis': '觸及率分析',
        'like_analysis': '按讚次數分析',
        'share_analysis': '分享次數分析',
        'view_time_analysis': '停留時間分析',
        'save_analysis': '收藏次數分析',
        'comment_analysis': '留言數量分析',
    }
    return type_names.get(analysis_type, analysis_type)

def is_cache_expired(last_updated, hours=24):
    """檢查緩存是否過期"""
    return timezone.now() - last_updated > timedelta(hours=hours)

@login_required
def data_analysis_page(request):
    """數據分析頁面"""
    context = {
        'user': request.user,
        'page_title': '數據分析儀表板',
        'analysis_types': [
            {'key': 'reach_analysis', 'name': '觸及率分析', 'icon': '📊'},
            {'key': 'like_analysis', 'name': '按讚次數分析', 'icon': '👍'},
            {'key': 'share_analysis', 'name': '分享次數分析', 'icon': '🔄'},
            {'key': 'view_time_analysis', 'name': '停留時間分析', 'icon': '⏱️'},
            {'key': 'save_analysis', 'name': '收藏次數分析', 'icon': '⭐'},
            {'key': 'comment_analysis', 'name': '留言數量分析', 'icon': '💬'},
        ]
    }
    return render(request, 'Datanalyze/data_analysis.html', context)

@login_required
def reports_page(request):
    """報表生成頁面"""
    context = {
        'user': request.user,
        'page_title': '報表生成器',
        'report_types': [
            {'key': 'user', 'name': '用戶報表', 'icon': '👥', 'description': '用戶註冊、活躍度、行為分析'},
            {'key': 'transaction', 'name': '交易報表', 'icon': '💰', 'description': '收入、支出、轉換率分析'},
            {'key': 'performance', 'name': '性能報表', 'icon': '📊', 'description': '系統性能、響應時間、錯誤率'},
            {'key': 'custom', 'name': '自定義報表', 'icon': '⚙️', 'description': '根據需求創建個性化報表'},
        ]
    }
    return render(request, 'Datanalyze/reports.html', context)
