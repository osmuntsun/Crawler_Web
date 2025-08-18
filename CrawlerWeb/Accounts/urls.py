from django.urls import path
from . import views

app_name = 'Accounts'

urlpatterns = [
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('avatar/<int:user_id>/<path:token>/', views.serve_avatar, name='avatar'),
]
