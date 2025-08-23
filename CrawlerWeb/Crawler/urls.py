from django.urls import path
from . import views


urlpatterns = [
	path('', views.tool, name='crawler_tool'),
	path('use/', views.tool_authenticated, name='crawler_tool_use'),

	path('api/facebook/', views.FacebookAutomationView.as_view(), name='facebook_automation_api'),
]


