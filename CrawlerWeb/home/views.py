from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.

def home(request):
    """
   首頁視圖函數
    """
    context = {
        'title': '爬蟲網站首頁',
        'welcome_message': '歡迎來到爬蟲網站！',
        'description': '這是一個功能強大的網路爬蟲平台'
    }
    return render(request, 'home/home.html', context)
