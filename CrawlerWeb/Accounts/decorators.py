from django.shortcuts import redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from functools import wraps
from django.urls import reverse


def premium_required(view_func):
    """
    檢查用戶是否為付費用戶的裝飾器
    非付費用戶會被重定向到升級頁面
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_premium_active:
            messages.warning(request, '此功能僅限付費用戶使用，請升級您的帳號。')
            return redirect('Accounts:profile')  # 重定向到個人資料頁面
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def premium_required_with_message(custom_message=None):
    """
    可自定義訊息的付費檢查裝飾器
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_premium_active:
                message = custom_message or '此功能僅限付費用戶使用，請升級您的帳號。'
                messages.warning(request, message)
                return redirect('Accounts:profile')
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator


def login_and_premium_required(view_func):
    """
    同時檢查登入和付費狀態的裝飾器
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('Accounts:login')
        if not request.user.is_premium_active:
            messages.warning(request, '此功能僅限付費用戶使用，請升級您的帳號。')
            return redirect('Accounts:profile')
        return view_func(request, *args, **kwargs)
    return _wrapped_view
