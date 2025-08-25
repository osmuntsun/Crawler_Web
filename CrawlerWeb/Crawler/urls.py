from django.urls import path
from . import views


urlpatterns = [
	path('', views.tool, name='crawler_tool'),
	path('use/', views.tool_authenticated, name='crawler_tool_use'),

	path('api/facebook/', views.FacebookAutomationView.as_view(), name='facebook_automation_api'),
	path('api/accounts/status/', views.AccountsStatusView.as_view(), name='accounts_status'),
	path('api/accounts/delete/', views.AccountDeleteView.as_view(), name='account_delete'),
	path('api/user/permissions/', views.UserPermissionsView.as_view(), name='user_permissions'),
	path('api/communities/', views.CommunitiesView.as_view(), name='communities_api'),
	path('api/posting/', views.PostingView.as_view(), name='posting'),
	path('api/templates/', views.PostTemplateView.as_view(), name='post_templates'),
	path('api/templates/<int:template_id>/', views.PostTemplateDetailView.as_view(), name='post_template_detail'),
	path('api/templates/<int:template_id>/update/', views.PostTemplateUpdateView.as_view(), name='post_template_update'),
	path('api/templates/<int:template_id>/delete/', views.PostTemplateDeleteView.as_view(), name='post_template_delete'),
	
	# 排程相關 API
	path('api/schedule/', views.ScheduleView.as_view(), name='schedule_api'),
	path('api/schedule/<int:schedule_id>/', views.ScheduleDetailView.as_view(), name='schedule_detail'),
	path('api/schedule/<int:schedule_id>/toggle/', views.ScheduleToggleView.as_view(), name='schedule_toggle'),
]


