from django.urls import path
from . import views


urlpatterns = [
	path('', views.tool, name='crawler_tool'),
]


