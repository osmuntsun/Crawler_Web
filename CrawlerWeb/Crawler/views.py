from django.shortcuts import render, redirect
from django.http import Http404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from Accounts.models import WebsiteCookie


def tool(request):
	"""
	爬蟲工具頁面 - 檢查付費權限
	"""
	try:
		can_use_tool = False
		is_premium = False
		
		if request.user.is_authenticated:
			# 檢查用戶是否為付費用戶
			is_premium = request.user.is_premium_active
			can_use_tool = is_premium
		
		context = {
			'is_authenticated': request.user.is_authenticated,
			'user': request.user,
			'can_use_tool': can_use_tool,
			'is_premium': is_premium,
		}
		return render(request, 'Crawler/tool.html', context)
	except Exception as e:
		raise Http404(f"爬蟲工具頁面不存在: {str(e)}")


@login_required(login_url='/accounts/login/')
def tool_authenticated(request):
	"""
	需要登入的爬蟲工具功能 - 檢查付費權限
	"""
	# 檢查是否為付費用戶
	if not request.user.is_premium_active:
		messages.warning(request, '爬蟲功能僅限付費用戶使用，請升級您的帳號。')
		return redirect('Accounts:profile')
	
	return render(request, 'Crawler/tool_authenticated.html')
