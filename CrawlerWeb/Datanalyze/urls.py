from django.urls import path
from . import views

app_name = 'datanalyze'

urlpatterns = [
    path('', views.data_analysis_dashboard, name='dashboard'),
    path('analysis/', views.data_analysis_page, name='data_analysis'),
    path('reports/', views.reports_page, name='reports'),
    path('api/data/<str:analysis_type>/', views.get_analysis_data, name='get_analysis_data'),
    path('api/refresh/<str:analysis_type>/', views.refresh_analysis_data, name='refresh_analysis_data'),
]
