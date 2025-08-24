"""
URL configuration for CrawlerWeb project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from home import views as home_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
	path('', home_views.home, name='home'), # 導向首頁
	path('admin/', admin.site.urls),
	path('accounts/', include('Accounts.urls')), # 添加Accounts應用URL
	path('crawler/', include('Crawler.urls')),
	path('datanalyze/', include('Datanalyze.urls')), # 添加Datanalyze應用URL
]

# 僅在開發模式提供媒體檔案服務
if settings.DEBUG:
	urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
