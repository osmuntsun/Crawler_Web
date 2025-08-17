from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from .forms import UserLoginForm

# Create your views here.

def user_login(request):
    """用戶登入視圖"""
    if request.method == 'POST':
        form = UserLoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'歡迎回來，{user.username}！')
                return redirect('home')
            else:
                messages.error(request, '用戶名或密碼錯誤。')
        else:
            messages.error(request, '登入失敗，請檢查輸入資訊。')
    else:
        form = UserLoginForm()
    
    return render(request, 'Accounts/login.html', {'form': form})

@login_required
def user_logout(request):
    """用戶登出視圖"""
    logout(request)
    messages.success(request, '您已成功登出。')
    return redirect('home')

@login_required
def profile(request):
    """用戶個人資料視圖"""
    return render(request, 'Accounts/profile.html', {'user': request.user})
