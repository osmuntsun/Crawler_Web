from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from .forms import UserLoginForm
from .models import User
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.http import FileResponse, HttpResponseForbidden, Http404
import mimetypes

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
    signer = TimestampSigner()
    avatar_url = None
    if request.user.avatar:
        token = signer.sign(f"{request.user.id}:{request.user.avatar.name}")
        avatar_url = reverse('Accounts:avatar', args=[request.user.id, token])
    return render(request, 'Accounts/profile.html', {
        'user': request.user,
        'avatar_url': avatar_url,
    })


@login_required
def serve_avatar(request, user_id: int, token: str):
    """受保護的頭貼存取：驗證簽名與權限後串流回應影像。"""
    user = get_object_or_404(User, pk=user_id)
    if not user.avatar:
        raise Http404('No avatar')

    signer = TimestampSigner()
    try:
        original = signer.unsign(token, max_age=300)  # 連結有效 5 分鐘
    except SignatureExpired:
        return HttpResponseForbidden('Link expired')
    except BadSignature:
        return HttpResponseForbidden('Invalid token')

    expected = f"{user_id}:{user.avatar.name}"
    if original != expected:
        return HttpResponseForbidden('Invalid token')

    # 僅允許本人或管理員讀取
    if (request.user.id != user_id) and (not request.user.is_staff):
        return HttpResponseForbidden('Not allowed')

    content_type, _ = mimetypes.guess_type(user.avatar.name)
    return FileResponse(user.avatar.open('rb'), content_type=content_type or 'application/octet-stream')
