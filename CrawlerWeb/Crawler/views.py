from django.shortcuts import render, redirect
from django.http import Http404
from django.contrib.auth.decorators import login_required
from django.contrib import messages


def tool(request):
	"""
	爬蟲工具頁面 - 訪客可以參觀，但需要登入才能使用
	"""
	try:
		context = {
			'is_authenticated': request.user.is_authenticated,
			'user': request.user,
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
