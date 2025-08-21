from django.shortcuts import render
from django.http import Http404


def tool(request):
	try:
		return render(request, 'Crawler/tool.html')
	except Exception as e:
		# 如果模板不存在，返回404
		raise Http404(f"爬蟲工具頁面不存在: {str(e)}")
