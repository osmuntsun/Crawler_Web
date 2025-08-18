from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from .models import User

@receiver(pre_save, sender=User)
def delete_old_avatar_on_change(sender, instance: User, **kwargs):
	"""當使用者更新頭貼時，刪除舊的頭貼檔案。"""
	if not instance.pk:
		# 新增使用者時沒有舊檔可刪
		return
	try:
		old_user = User.objects.get(pk=instance.pk)
	except User.DoesNotExist:
		return

	old_file = getattr(old_user, 'avatar', None)
	new_file = getattr(instance, 'avatar', None)

	# 僅在檔案有變更時刪除舊檔
	if old_file and old_file != new_file:
		try:
			storage = old_file.storage
			if storage.exists(old_file.name):
				old_file.delete(save=False)
		except Exception:
			# 刪除失敗時略過，避免中斷保存流程
			pass

@receiver(post_delete, sender=User)
def delete_avatar_on_user_delete(sender, instance: User, **kwargs):
	"""當使用者被刪除時，同步刪除頭貼檔案。"""
	avatar_file = getattr(instance, 'avatar', None)
	if avatar_file:
		try:
			storage = avatar_file.storage
			if storage.exists(avatar_file.name):
				avatar_file.delete(save=False)
		except Exception:
			pass
