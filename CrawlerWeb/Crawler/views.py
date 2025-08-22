from django.shortcuts import render, redirect
from django.http import Http404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from Accounts.models import WebsiteCookie


def tool(request):
	"""
	爬蟲工具頁面 - 訪客可以參觀，但需要登入才能使用
	"""
	try:
		can_use_tool = False
		if request.user.is_authenticated:
			# 檢查用戶帳號是否有效（is_active=True）
			can_use_tool = request.user.is_active
		context = {
			'is_authenticated': request.user.is_authenticated,
			'user': request.user,
			'can_use_tool': can_use_tool,
		}
		return render(request, 'Crawler/tool.html', context)
	except Exception as e:
		raise Http404(f"爬蟲工具頁面不存在: {str(e)}")


@login_required(login_url='/accounts/login/')
def tool_authenticated(request):
	"""
	需要登入的爬蟲工具功能
	"""
	return render(request, 'Crawler/tool_authenticated.html')
