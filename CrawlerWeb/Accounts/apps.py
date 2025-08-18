from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Accounts'

    def ready(self):
        # 載入訊號處理，確保更換/刪除頭貼時會同步處理檔案
        from . import signals  # noqa: F401