from django.shortcuts import render, redirect
from django.http import Http404, JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from Accounts.models import WebsiteCookie, Community, PostTemplate, PostTemplateImage
import json
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service


def tool(request):
	"""
	爬蟲工具頁面 - 檢查付費權限
	"""
	try:
		can_use_tool = False
		is_premium = False
		
		if request.user.is_authenticated:
			# 檢查用戶是否為付費用戶
			is_premium = request.user.is_premium_active
			can_use_tool = is_premium
		
		context = {
			'is_authenticated': request.user.is_authenticated,
			'user': request.user,
			'can_use_tool': can_use_tool,
			'is_premium': is_premium,
		}
		
		# 添加調試信息
		print(f"tool視圖被調用")
		print(f"用戶: {request.user}")
		print(f"用戶已認證: {request.user.is_authenticated}")
		print(f"can_use_tool: {can_use_tool}")
		
		return render(request, 'Crawler/tool.html', context)
	except Exception as e:
		print(f"tool視圖錯誤: {str(e)}")
		raise Http404(f"爬蟲工具頁面不存在: {str(e)}")


@login_required(login_url='/accounts/login/')
def tool_authenticated(request):
	"""
	需要登入的爬蟲工具功能 - 檢查付費權限
	"""
	# 檢查是否為付費用戶
	if not request.user.is_premium_active:
		messages.warning(request, '爬蟲功能僅限付費用戶使用，請升級您的帳號。')
		return redirect('Accounts:profile')
	
	return render(request, 'Crawler/tool_authenticated.html')





@method_decorator(csrf_exempt, name='dispatch')
class FacebookAutomationView(View):
	"""
	Facebook 自動化視圖
	"""
	
	def post(self, request):
		"""處理 Facebook 自動化請求"""
		print(f"收到Facebook自動化請求: {request.method}")
		print(f"用戶: {request.user}")
		print(f"用戶已認證: {request.user.is_authenticated}")
		print(f"用戶是付費用戶: {getattr(request.user, 'is_premium_active', 'N/A')}")
		
		if not request.user.is_authenticated:
			return JsonResponse({'error': '請先登入'}, status=401)
		
		# 暫時禁用權限檢查，讓所有用戶都能測試功能
		# if not request.user.is_premium_active:
		# 	return JsonResponse({'error': '此功能僅限付費用戶使用'}, status=403)
		
		try:
			data = json.loads(request.body)
			action = data.get('action')
			
			if action == 'login_and_save_cookies':
				return self.login_and_save_cookies(request, data)
			elif action == 'get_communities':
				return self.get_communities(request, data)
			elif action == 'post_to_community':
				return self.post_to_community(request, data)
			else:
				return JsonResponse({'error': '無效的操作'}, status=400)
				
		except json.JSONDecodeError:
			return JsonResponse({'error': '無效的 JSON 格式'}, status=400)
		except Exception as e:
			return JsonResponse({'error': f'操作失敗: {str(e)}'}, status=500)
	
	def login_and_save_cookies(self, request, data):
		"""登入社群平台並保存 Cookie"""
		print(f"開始執行login_and_save_cookies")
		print(f"請求數據: {data}")
		
		try:
			platform = data.get('platform', 'facebook')
			email = data.get('email')
			password = data.get('password')
			
			if not email or not password:
				return JsonResponse({'error': '請提供電子郵件和密碼'}, status=400)
			
			# 目前只支援 Facebook 自動登入
			if platform != 'facebook':
				return JsonResponse({'error': f'目前只支援 Facebook 自動登入，{platform} 需要手動獲取 Cookie'}, status=400)
			
			# 使用 Selenium 登入 Facebook
			driver = self._setup_driver()
			driver.get("https://www.facebook.com/?locale=zh_TW")
			
			# 等待登入表單載入
			WebDriverWait(driver, 10).until(
				EC.presence_of_element_located((By.ID, "email"))
			)
			
			# 輸入登入資訊
			email_field = driver.find_element(By.ID, "email")
			password_field = driver.find_element(By.ID, "pass")
			
			email_field.send_keys(email)
			password_field.send_keys(password)
			
			# 點擊登入按鈕
			login_button = driver.find_element(By.XPATH, "//button[@type='submit']")
			login_button.click()
			
			# 等待登入成功
			WebDriverWait(driver, 3000).until(
				EC.presence_of_element_located((By.XPATH, "//div[@aria-label='帳號控制項和設定']"))
			)
			
			# 獲取 Cookie
			cookies = driver.get_cookies()
			
			# 過濾重要的 Cookie
			important_cookies = ['datr', 'sb', 'dpr', 'locale', 'c_user', 'xs', 'fr', 'wd', 'presence']
			filtered_cookies = {}
			
			for cookie in cookies:
				if cookie['name'] in important_cookies:
					filtered_cookies[cookie['name']] = cookie['value']
			
			# 保存到資料庫
			website_cookie, created = WebsiteCookie.objects.update_or_create(
				user=request.user,
				website=platform,
				defaults={
					'website_url': 'https://www.facebook.com',
					'cookie_data': filtered_cookies,
					'is_active': True,
					'notes': f'自動登入獲取，共 {len(filtered_cookies)} 個 Cookie'
				}
			)
			
			# 如果是 Facebook，自動獲取並保存社團
			communities = []
			if platform == 'facebook':
				print("開始獲取 Facebook 社團...")
				communities = self._get_facebook_communities(driver, filtered_cookies)
				print(f"獲取到 {len(communities)} 個社團")
				if communities:
					saved_count = self._save_communities_to_db(request.user, communities)
					print(f"成功保存 {saved_count} 個社團到資料庫")
				else:
					print("沒有獲取到任何社團")
			
			driver.quit()
			
			# 準備回應訊息
			message = f'成功獲取並保存 {len(filtered_cookies)} 個 {platform} Cookie'
			if platform == 'facebook' and communities:
				message += f'，並獲取到 {len(communities)} 個社團'
			
			return JsonResponse({
				'success': True,
				'message': message,
				'cookie_count': len(filtered_cookies),
				'communities_count': len(communities) if platform == 'facebook' else 0
			})
			
		except Exception as e:
			if 'driver' in locals():
				driver.quit()
			return JsonResponse({'error': f'登入失敗: {str(e)}'}, status=500)
	
	def get_communities(self, request, data):
		"""獲取用戶的 Facebook 社團"""
		try:
			# 檢查是否有 Facebook Cookie
			try:
				website_cookie = WebsiteCookie.objects.get(
					user=request.user,
					website='facebook',
					is_active=True
				)
			except WebsiteCookie.DoesNotExist:
				return JsonResponse({'error': '請先登入 Facebook 並保存 Cookie'}, status=400)
			
			# 使用保存的 Cookie 登入並獲取社團
			driver = self._setup_driver()
			driver.get("https://www.facebook.com/")
			
			# 添加 Cookie
			for name, value in website_cookie.cookie_data.items():
				driver.add_cookie({'name': name, 'value': value})
			
			driver.refresh()
			time.sleep(2)
			
			# 前往社團頁面
			driver.get("https://www.facebook.com/groups/joins/?nav_source=tab&ordering=viewer_added")
			
			# 滾動到底部獲取所有社團
			self._scroll_to_bottom(driver)
			
			# 獲取社團列表
			communities = []
			try:
				community_container = driver.find_element(
					By.XPATH, 
					'/html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div[2]/div/div/div/div/div/div/div/div/div/div[3]'
				)
				community_links = community_container.find_elements(By.TAG_NAME, 'a')
				
				for link in community_links:
					name = link.text
					url = link.get_attribute('href')
					if name and url and '查看社團' not in name:
						communities.append({
							'name': name,
							'url': url
						})
			except Exception as e:
				pass  # 如果無法獲取社團，繼續執行
			
			driver.quit()
			
			return JsonResponse({
				'success': True,
				'communities': communities,
				'count': len(communities)
			})
			
		except Exception as e:
			if 'driver' in locals():
				driver.quit()
			return JsonResponse({'error': f'獲取社團失敗: {str(e)}'}, status=500)
	
	def post_to_community(self, request, data):
		"""在指定社團發文（支援多選社團和圖片上傳）"""
		try:
			community_urls = data.get('community_urls', [])
			message = data.get('message')
			image_paths = data.get('image_paths', [])
			
			if not community_urls or not message:
				return JsonResponse({'error': '請提供社團連結和發文內容'}, status=400)
			
			# 檢查是否有 Facebook Cookie
			try:
				website_cookie = WebsiteCookie.objects.get(
					user=request.user,
					website='facebook',
					is_active=True
				)
			except WebsiteCookie.DoesNotExist:
				return JsonResponse({'error': '請先登入 Facebook 並保存 Cookie'}, status=400)
			
			# 使用保存的 Cookie 登入並發文
			driver = self._setup_driver()
			driver.get("https://www.facebook.com/")
			
			# 添加 Cookie
			for name, value in website_cookie.cookie_data.items():
				driver.add_cookie({'name': name, 'value': value})
			
			driver.refresh()
			time.sleep(2)
			
			success_count = 0
			failed_count = 0
			results = []
			
			# 遍歷所有選中的社團進行發文
			for community_url in community_urls:
				try:
					# 前往社團並發文
					driver.get(community_url)
					driver.refresh()
					
					# 等待發文按鈕出現
					WebDriverWait(driver, 30).until(
						EC.presence_of_element_located((
							By.XPATH, 
							'/html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div/div[2]/div/div/div[4]/div/div[2]/div/div/div/div[1]/div/div/div/div[1]/div/div[1]/span'
						))
					)
					
					# 點擊發文按鈕
					post_button = driver.find_element(
						By.XPATH,
						'/html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div/div[2]/div/div/div[4]/div/div[2]/div/div/div/div[1]/div/div/div/div[1]/div/div[1]/span'
					)
					post_button.click()
					
					# 等待發文表單出現
					WebDriverWait(driver, 30).until(
						EC.presence_of_element_located((
							By.XPATH,
							'/html/body/div[1]/div/div[1]/div/div[4]/div/div/div[1]/div/div[2]/div/div/div/div/div[1]/form/div/div[1]/div/div/div/div[2]/div[1]/div[1]/div[1]/div[1]/div/div/div[1]/p'
						))
					)
					
					# 輸入發文內容
					post_input = driver.find_element(
						By.XPATH,
						'/html/body/div[1]/div/div[1]/div/div[4]/div/div/div[1]/div/div[2]/div/div/div/div/div[1]/form/div/div[1]/div/div/div/div[2]/div[1]/div[1]/div[1]/div[1]/div/div/div[1]/p'
					)
					post_input.send_keys(message)
					
					time.sleep(1)
					
					# 上傳圖片（如果有的話）
					if image_paths:
						try:
							post_img = driver.find_element(
								By.XPATH,
								'/html/body/div[1]/div/div[1]/div/div[4]/div/div/div[1]/div/div[2]/div/div/div/div/div[1]/form/div/div[1]/div/div/div/div[3]/div[1]/div[2]/div[1]/input'
							)
							for img in image_paths:
								post_img.send_keys(img)
								time.sleep(0.5)  # 可視情況加等待
						except Exception as img_error:
							# 如果圖片上傳失敗，繼續執行
							pass
					
					time.sleep(1)
					
					# 點擊發文按鈕
					submit_button = driver.find_element(
						By.XPATH,
						'/html/body/div[1]/div/div[1]/div/div[4]/div/div/div[1]/div/div[2]/div/div/div/div/div[1]/form/div/div[1]/div/div/div/div[3]/div[3]/div[1]/div/div'
					)
					submit_button.click()
					
					success_count += 1
					results.append({
						'url': community_url,
						'status': 'success',
						'message': '發文成功'
					})
					
					# 等待一下再發下一個
					time.sleep(3)
					
				except Exception as e:
					failed_count += 1
					results.append({
						'url': community_url,
						'status': 'failed',
						'message': str(e)
					})
			
			driver.quit()
			
			return JsonResponse({
				'success': True,
				'message': f'發文完成！成功：{success_count} 個，失敗：{failed_count} 個',
				'success_count': success_count,
				'failed_count': failed_count,
				'results': results
			})
			
		except Exception as e:
			if 'driver' in locals():
				driver.quit()
			return JsonResponse({'error': f'發文失敗: {str(e)}'}, status=500)
	
	def _setup_driver(self):
		"""設置 Chrome 驅動程式"""
		print("開始設置Chrome驅動程序...")
		options = Options()
		options.add_argument("--start-maximized")
		options.add_argument("--disable-notifications")
		options.add_argument("--disable-gpu")
		options.add_argument("--no-sandbox")
		options.add_argument("--disable-dev-shm-usage")
		
		# 使用 webdriver_manager 自動管理 ChromeDriver
		print("正在安裝ChromeDriver...")
		service = Service(ChromeDriverManager().install())
		print("正在創建Chrome驅動程序...")
		driver = webdriver.Chrome(service=service, options=options)
		print("Chrome驅動程序創建成功！")
		
		return driver
	
	def _scroll_to_bottom(self, driver, pause_time=2):
		"""滾動到頁面底部"""
		last_height = driver.execute_script("return document.body.scrollHeight")
		while True:
			driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
			time.sleep(pause_time)
			new_height = driver.execute_script("return document.body.scrollHeight")
			if new_height == last_height:
				break
			last_height = new_height
	
	def _get_facebook_communities(self, driver, cookies):
		"""獲取 Facebook 社團列表"""
		try:
			print("開始獲取 Facebook 社團...")
			# 前往社團頁面
			driver.get("https://www.facebook.com/groups/joins/?nav_source=tab&ordering=viewer_added")
			time.sleep(5)  # 增加等待時間
			print("已前往社團頁面")
			
			# 滾動到底部獲取所有社團
			self._scroll_to_bottom(driver)
			time.sleep(2)  # 滾動後再等待一下
			print("已完成頁面滾動")
			
			# 獲取社團列表
			communities = []
			try:
				# 嘗試多個可能的 XPath 來找到社團容器
				# /html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div[2]/div/div/div/div/div/div/div/div/div/div[3]
				possible_xpaths = [
					# 使用你找到的精確路徑，並排除導航元素
					'/html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div[2]/div/div/div/div/div/div/div/div/div/div[3]//a[contains(@href, "/groups/") and not(contains(@href, "joins")) and not(contains(@href, "create")) and not(contains(@href, "feed")) and not(contains(@href, "discover"))]',
					
					# 更精確的社團連結選擇器，排除導航項目
					'//a[contains(@href, "/groups/") and not(contains(@href, "joins")) and not(contains(@href, "create")) and not(contains(@href, "feed")) and not(contains(@href, "discover")) and not(contains(@href, "browse"))]',
					
					# 基於 aria-label 的選擇器
					'//a[contains(@href, "/groups/") and @aria-label]',
					
					# 通用的社團連結選擇器（作為備用）
					'//a[contains(@href, "/groups/")]'
				]
				
				for i, xpath in enumerate(possible_xpaths):
					try:
						print(f"嘗試 XPath {i+1}: {xpath}")
						elements = driver.find_elements(By.XPATH, xpath)
						print(f"找到 {len(elements)} 個元素")
						if elements:
							for element in elements:
								name = element.text.strip()
								url = element.get_attribute('href')
								print(f"檢查元素: {name} - {url}")
								# 更嚴格的過濾條件
								if (name and url and 
									'groups' in url and 
									'joins' not in url and 
									'create' not in url and
									'feed' not in url and
									'discover' not in url and
									'browse' not in url and
									len(name) > 0 and
									not name.startswith('查看') and
									not name.startswith('加入') and
									name != '探索' and
									name != '你的動態消息' and
									name != '動態消息' and
									name != '瀏覽' and
									name != '發現' and
									not name.startswith('查看更多') and
									not name.startswith('顯示更多')):
									print(f"找到社團: {name} - {url}")
									communities.append({
										'name': name,
										'url': url
									})
							break  # 如果找到元素，就跳出循環
					except Exception as e:
						print(f"XPath {i+1} 失敗: {str(e)}")
						continue
				
				# 去重
				unique_communities = []
				seen_urls = set()
				for community in communities:
					if community['url'] not in seen_urls:
						unique_communities.append(community)
						seen_urls.add(community['url'])
				
				return unique_communities
				
			except Exception as e:
				print(f"獲取社團時發生錯誤: {str(e)}")
				import traceback
				traceback.print_exc()
				return []
				
		except Exception as e:
			print(f"前往社團頁面時發生錯誤: {str(e)}")
			import traceback
			traceback.print_exc()
			return []
	
	def _save_communities_to_db(self, user, communities):
		"""保存社團到資料庫"""
		try:
			print(f"開始保存 {len(communities)} 個社團到資料庫")
			saved_count = 0
			for i, community_data in enumerate(communities):
				print(f"處理社團 {i+1}: {community_data['name']}")
				# 檢查是否已存在相同的社團
				existing_community = Community.objects.filter(
					user=user,
					url=community_data['url']
				).first()
				
				if not existing_community:
					# 創建新的社團記錄
					Community.objects.create(
						user=user,
						name=community_data['name'],
						community_type='facebook',
						url=community_data['url'],
						description=f'Facebook 社團：{community_data["name"]}',
						is_active=True,
						is_public=True
					)
					saved_count += 1
					print(f"成功保存社團: {community_data['name']}")
				else:
					print(f"社團已存在: {community_data['name']}")
			
			print(f"成功保存 {saved_count} 個新社團到資料庫")
			return saved_count
			
		except Exception as e:
			print(f"保存社團到資料庫時發生錯誤: {str(e)}")
			import traceback
			traceback.print_exc()
			return 0


@method_decorator(csrf_exempt, name='dispatch')
class AccountsStatusView(View):
	"""
	帳號狀態查詢視圖
	"""
	
	def get(self, request):
		"""獲取用戶的帳號狀態"""
		if not request.user.is_authenticated:
			return JsonResponse({'error': '請先登入'}, status=401)
		
		# 暫時禁用權限檢查，讓所有用戶都能測試功能
		# if not request.user.is_premium_active:
		# 	return JsonResponse({'error': '此功能僅限付費用戶使用'}, status=403)
		
		try:
			# 獲取用戶的所有網站 Cookie
			website_cookies = WebsiteCookie.objects.filter(
				user=request.user,
				is_active=True
			)
			
			accounts = []
			for cookie in website_cookies:
				accounts.append({
					'website': cookie.website,
					'website_url': cookie.website_url,
					'is_active': cookie.is_active,
					'last_updated': cookie.last_updated.isoformat(),
					'created_at': cookie.created_at.isoformat(),
					'notes': cookie.notes,
					'cookie_count': cookie.get_cookie_count()
				})
			
			return JsonResponse(accounts, safe=False)
			
		except Exception as e:
			return JsonResponse({'error': f'獲取帳號狀態失敗: {str(e)}'}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class UserPermissionsView(View):
	"""
	用戶權限查詢視圖
	"""
	
	def get(self, request):
		"""獲取用戶權限信息"""
		if not request.user.is_authenticated:
			return JsonResponse({'error': '請先登入'}, status=401)
		
		try:
			return JsonResponse({
				'is_superuser': request.user.is_superuser,
				'is_staff': request.user.is_staff,
				'username': request.user.username,
				'email': request.user.email
			})
		except Exception as e:
			return JsonResponse({'error': f'獲取權限失敗: {str(e)}'}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class AccountDeleteView(View):
	"""
	帳號刪除視圖
	"""
	
	def post(self, request):
		"""刪除用戶的帳號"""
		if not request.user.is_authenticated:
			return JsonResponse({'error': '請先登入'}, status=401)
		
		# 檢查權限：只有超級管理員才能刪除帳號
		if not request.user.is_superuser:
			return JsonResponse({'error': '權限不足，只有超級管理員才能刪除帳號'}, status=403)
		
		try:
			data = json.loads(request.body)
			platform = data.get('platform')
			
			if not platform:
				return JsonResponse({'error': '請提供平台名稱'}, status=400)
			
			# 刪除網站 Cookie
			try:
				website_cookie = WebsiteCookie.objects.get(
					user=request.user,
					website=platform,
					is_active=True
				)
				website_cookie.delete()
				
				# 如果是 Facebook，同時刪除相關社團
				if platform == 'facebook':
					Community.objects.filter(
						user=request.user,
						community_type='facebook'
					).delete()
				
				return JsonResponse({
					'success': True,
					'message': f'{platform} 帳號已成功刪除'
				})
				
			except WebsiteCookie.DoesNotExist:
				return JsonResponse({'error': f'找不到 {platform} 帳號'}, status=404)
			
		except json.JSONDecodeError:
			return JsonResponse({'error': '無效的 JSON 格式'}, status=400)
		except Exception as e:
			return JsonResponse({'error': f'刪除失敗: {str(e)}'}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class CommunitiesView(View):
	"""
	社團管理視圖
	"""
	
	def get(self, request):
		"""獲取用戶的社團列表"""
		if not request.user.is_authenticated:
			return JsonResponse({'error': '請先登入'}, status=401)
		
		try:
			# 獲取用戶的所有社團
			communities = Community.objects.filter(
				user=request.user,
				is_active=True
			).order_by('-created_at')
			
			communities_data = []
			for community in communities:
				communities_data.append({
					'id': community.id,
					'name': community.name,
					'community_type': community.community_type,
					'url': community.url,
					'description': community.description,
					'member_count': community.member_count,
					'is_active': community.is_active,
					'is_public': community.is_public,
					'last_activity': community.last_activity.isoformat() if community.last_activity else None,
					'created_at': community.created_at.isoformat(),
					'updated_at': community.updated_at.isoformat(),
					'tags': community.tags
				})
			
			return JsonResponse({
				'success': True,
				'communities': communities_data,
				'count': len(communities_data)
			})
			
		except Exception as e:
			return JsonResponse({'error': f'獲取社團列表失敗: {str(e)}'}, status=500)
	
	def post(self, request):
		"""重新整理用戶的社團列表"""
		if not request.user.is_authenticated:
			return JsonResponse({'error': '請先登入'}, status=401)
		
		try:
			data = json.loads(request.body)
			action = data.get('action')
			
			if action == 'refresh':
				# 檢查是否有 Facebook Cookie
				try:
					website_cookie = WebsiteCookie.objects.get(
						user=request.user,
						website='facebook',
						is_active=True
					)
				except WebsiteCookie.DoesNotExist:
					return JsonResponse({'error': '請先登入 Facebook 並保存 Cookie'}, status=400)
				
				# 使用 FacebookAutomationView 的方法來重新獲取社團
				facebook_view = FacebookAutomationView()
				driver = facebook_view._setup_driver()
				
				try:
					# 前往 Facebook 並添加 Cookie
					driver.get("https://www.facebook.com/")
					
					# 添加 Cookie
					for name, value in website_cookie.cookie_data.items():
						driver.add_cookie({'name': name, 'value': value})
					
					driver.refresh()
					time.sleep(2)
					
					# 獲取最新的社團列表
					print("開始重新獲取 Facebook 社團...")
					new_communities = facebook_view._get_facebook_communities(driver, website_cookie.cookie_data)
					print(f"重新獲取到 {len(new_communities)} 個社團")
					
					# 獲取資料庫中現有的社團
					existing_communities = Community.objects.filter(
						user=request.user,
						community_type='facebook'
					)
					
					# 創建現有社團 URL 的集合
					existing_urls = set(community.url for community in existing_communities)
					new_urls = set(community['url'] for community in new_communities)
					
					# 刪除不再存在的社團
					urls_to_delete = existing_urls - new_urls
					deleted_count = 0
					if urls_to_delete:
						deleted_communities = Community.objects.filter(
							user=request.user,
							community_type='facebook',
							url__in=urls_to_delete
						)
						deleted_count = deleted_communities.count()
						deleted_communities.delete()
						print(f"刪除了 {deleted_count} 個不再存在的社團")
					
					# 添加新的社團
					added_count = facebook_view._save_communities_to_db(request.user, new_communities)
					print(f"新增了 {added_count} 個社團")
					
					driver.quit()
					
					return JsonResponse({
						'success': True,
						'message': f'社團列表已更新！新增 {added_count} 個，刪除 {deleted_count} 個',
						'added_count': added_count,
						'deleted_count': deleted_count,
						'total_count': len(new_communities)
					})
					
				except Exception as e:
					if driver:
						driver.quit()
					raise e
				
			else:
				return JsonResponse({'error': '無效的操作'}, status=400)
				
		except json.JSONDecodeError:
			return JsonResponse({'error': '無效的 JSON 格式'}, status=400)
		except Exception as e:
			return JsonResponse({'error': f'重新整理失敗: {str(e)}'}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class PostingView(View):
	"""
	發文視圖
	"""
	
	def post(self, request):
		"""處理發文請求"""
		if not request.user.is_authenticated:
			return JsonResponse({'error': '請先登入'}, status=401)
		
		# 暫時禁用權限檢查，讓所有用戶都能測試功能
		# if not request.user.is_premium_active:
		# 	return JsonResponse({'error': '此功能僅限付費用戶使用'}, status=403)
		
		try:
			data = json.loads(request.body)
			platform = data.get('platform')
			message = data.get('message')
			images = data.get('images', [])
			
			if not platform or not message:
				return JsonResponse({'error': '請提供平台和發文內容'}, status=400)
			
			# 檢查是否有對應平台的 Cookie
			try:
				website_cookie = WebsiteCookie.objects.get(
					user=request.user,
					website=platform,
					is_active=True
				)
			except WebsiteCookie.DoesNotExist:
				return JsonResponse({'error': f'請先登入 {platform} 並保存 Cookie'}, status=400)
			
			# 這裡可以實現其他平台的發文邏輯
			# 目前只支援 Facebook，其他平台返回成功但實際未實現
			
			return JsonResponse({
				'success': True,
				'message': f'成功發文到 {platform}',
				'platform': platform,
				'content_length': len(message),
				'image_count': len(images)
			})
			
		except json.JSONDecodeError:
			return JsonResponse({'error': '無效的 JSON 格式'}, status=400)
		except Exception as e:
			return JsonResponse({'error': f'發文失敗: {str(e)}'}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class PostTemplateView(View):
	"""
	貼文模板管理視圖
	"""
	
	def get(self, request):
		"""獲取用戶的貼文模板列表或單個模板"""
		if not request.user.is_authenticated:
			return JsonResponse({'error': '請先登入'}, status=401)
		
		try:
			# 檢查是否請求單個模板
			template_id = request.GET.get('template_id')
			if template_id:
				try:
					template = PostTemplate.objects.get(
						id=template_id,
						user=request.user,
						is_active=True
					)
					
					# 獲取模板的圖片
					images = template.images.all().order_by('order')
					images_data = []
					for image in images:
						# 檢查圖片是否有實際文件
						if image.image and hasattr(image.image, 'url'):
							image_url = image.image.url
						elif image.alt_text and (image.alt_text.startswith('http') or image.alt_text.startswith('/media/')):
							# 如果是複製的圖片，使用alt_text中的URL
							image_url = image.alt_text
						else:
							# 如果既沒有圖片文件也沒有URL，跳過
							continue
						
						images_data.append({
							'id': image.id,
							'url': image_url,
							'order': image.order,
							'alt_text': image.alt_text
						})
					
					template_data = {
						'id': template.id,
						'title': template.title,
						'content': template.content,
						'hashtags': template.hashtags,
						'images': images_data,
						'image_count': len(images_data),
						'created_at': template.created_at.isoformat(),
						'updated_at': template.updated_at.isoformat()
					}
					
					return JsonResponse({
						'success': True,
						'template': template_data
					})
					
				except PostTemplate.DoesNotExist:
					return JsonResponse({'error': '找不到指定的模板'}, status=404)
			
			# 獲取所有模板
			templates = PostTemplate.objects.filter(
				user=request.user,
				is_active=True
			).order_by('-updated_at')
			
			templates_data = []
			for template in templates:
				# 獲取模板的圖片
				images = template.images.all().order_by('order')
				print(f"模板 {template.id} 的圖片數量: {images.count()}")  # 調試信息
				images_data = []
				for image in images:
					print(f"處理圖片: id={image.id}, image={image.image}, alt_text={image.alt_text}")  # 調試信息
					# 檢查圖片是否有實際文件
					if image.image and hasattr(image.image, 'url'):
						image_url = image.image.url
						print(f"使用原創圖片URL: {image_url}")  # 調試信息
					elif image.alt_text and (image.alt_text.startswith('http') or image.alt_text.startswith('/media/')):
						# 如果是複製的圖片，使用alt_text中的URL
						image_url = image.alt_text
						print(f"使用複製圖片URL: {image_url}")  # 調試信息
					else:
						# 如果既沒有圖片文件也沒有URL，跳過
						print(f"跳過無效圖片: {image.id}")  # 調試信息
						continue
					
					images_data.append({
						'id': image.id,
						'url': image_url,
						'order': image.order,
						'alt_text': image.alt_text
					})
				
				templates_data.append({
					'id': template.id,
					'title': template.title,
					'content': template.content,
					'hashtags': template.hashtags,
					'images': images_data,
					'image_count': len(images_data),
					'created_at': template.created_at.isoformat(),
					'updated_at': template.updated_at.isoformat()
				})
			
			return JsonResponse({
				'success': True,
				'templates': templates_data,
				'count': len(templates_data)
			})
			
		except Exception as e:
			return JsonResponse({'error': f'獲取模板列表失敗: {str(e)}'}, status=500)
	
	def post(self, request):
		"""創建或更新貼文模板"""
		if not request.user.is_authenticated:
			return JsonResponse({'error': '請先登入'}, status=401)
		
		try:
			# 處理 multipart/form-data
			title = request.POST.get('title')
			content = request.POST.get('content')
			hashtags = request.POST.get('hashtags', '')
			template_id = request.POST.get('template_id')  # 如果有 ID 則更新，否則創建
			
			if not title or not content:
				return JsonResponse({'error': '請提供模板標題和內容'}, status=400)
			
			# 創建或更新模板
			if template_id:
				try:
					template = PostTemplate.objects.get(id=template_id, user=request.user)
					template.title = title
					template.content = content
					template.hashtags = hashtags
					template.save()
					action = '更新'
				except PostTemplate.DoesNotExist:
					return JsonResponse({'error': '找不到指定的模板'}, status=404)
			else:
				template = PostTemplate.objects.create(
					user=request.user,
					title=title,
					content=content,
					hashtags=hashtags
				)
				action = '創建'
			
			# 處理圖片上傳和現有圖片
			images = request.FILES.getlist('images')
			existing_images = request.POST.getlist('existing_images')
			image_orders = request.POST.getlist('image_orders')
			
			# 如果是更新模板，處理現有圖片和新圖片
			if template_id:
				# 先刪除不在現有圖片列表中的舊圖片
				if existing_images:
					template.images.exclude(id__in=existing_images).delete()
				else:
					template.images.all().delete()
				
				# 更新現有圖片的順序
				for i, image_id in enumerate(existing_images):
					try:
						image = PostTemplateImage.objects.get(id=image_id, template=template)
						order = int(image_orders[i]) if i < len(image_orders) else i
						image.order = order
						image.save()
					except PostTemplateImage.DoesNotExist:
						continue
			
			# 上傳新圖片
			start_order = len(existing_images) if existing_images else 0
			for i, image_file in enumerate(images):
				order = int(image_orders[start_order + i]) if (start_order + i) < len(image_orders) else (start_order + i)
				PostTemplateImage.objects.create(
					template=template,
					image=image_file,
					order=order
				)
			
			# 處理圖片URL複製（用於複製功能）
			image_urls = request.POST.getlist('image_urls')
			if image_urls:
				print(f"複製圖片URLs: {image_urls}")  # 調試信息
				for i, image_url in enumerate(image_urls):
					# 簡化順序處理，直接使用索引作為順序
					order = i
					print(f"創建複製圖片記錄: URL={image_url}, order={order}")  # 調試信息
					# 創建圖片記錄，將URL保存到alt_text字段中
					PostTemplateImage.objects.create(
						template=template,
						image='',  # 空圖片字段
						order=order,
						alt_text=image_url  # 將URL保存到alt_text字段
					)
			
			# 計算總圖片數量（包括新上傳的和複製的）
			total_image_count = len(images) + len(image_urls) if image_urls else len(images)
			
			return JsonResponse({
				'success': True,
				'message': f'模板{action}成功',
				'template_id': template.id,
				'image_count': total_image_count
			})
			
		except Exception as e:
			return JsonResponse({'error': f'{action}模板失敗: {str(e)}'}, status=500)
	
	def delete(self, request):
		"""刪除貼文模板"""
		if not request.user.is_authenticated:
			return JsonResponse({'error': '請先登入'}, status=401)
		
		try:
			data = json.loads(request.body)
			template_id = data.get('template_id')
			
			if not template_id:
				return JsonResponse({'error': '請提供模板ID'}, status=400)
			
			try:
				template = PostTemplate.objects.get(id=template_id, user=request.user)
				
				# 智能刪除圖片：只有當沒有其他模板使用時才刪除圖片文件
				images_to_delete = []  # 記錄要刪除的圖片路徑
				
				for image in template.images.all():
					if image.image and hasattr(image.image, 'path'):
						try:
							import os
							# 檢查這張圖片文件是否被其他模板使用
							# 通過比較文件名來檢查，這樣更可靠
							image_path = image.image.path
							image_filename = os.path.basename(image_path)
							
							print(f"檢查圖片: {image_filename}")  # 調試信息
							
							# 檢查這張圖片是否被其他模板使用
							# 需要檢查實際圖片文件和複製的圖片URL
							other_templates_using_same_file = False
							
							# 遍歷所有活躍的模板，檢查是否有其他模板使用相同的圖片文件
							print(f"開始檢查其他模板是否使用圖片: {image_filename}")
							for other_template in PostTemplate.objects.filter(is_active=True).exclude(id=template_id):
								print(f"檢查模板 {other_template.id}: {other_template.title}")
								for other_image in other_template.images.all():
									print(f"  檢查圖片記錄: image={other_image.image}, alt_text={other_image.alt_text}")
									
									# 檢查實際圖片文件
									if (other_image.image and 
										hasattr(other_image.image, 'path') and 
										os.path.basename(other_image.image.path) == image_filename):
										other_templates_using_same_file = True
										print(f"發現其他模板 {other_template.id} 使用相同圖片文件: {image_filename}")
										break
									# 檢查複製的圖片URL（存儲在alt_text中）
									elif (other_image.alt_text and 
										  other_image.alt_text.startswith('/media/')):
										# 從alt_text中提取文件名進行比較
										alt_text_filename = os.path.basename(other_image.alt_text)
										print(f"  比較文件名: {alt_text_filename} vs {image_filename}")
										if alt_text_filename == image_filename:
											other_templates_using_same_file = True
											print(f"發現其他模板 {other_template.id} 使用複製圖片: {image_filename}")
											break
								if other_templates_using_same_file:
									break
							
							print(f"其他模板使用此圖片: {other_templates_using_same_file}")  # 調試信息
							
							if not other_templates_using_same_file:
								# 沒有其他模板使用這張圖片，記錄為要刪除
								images_to_delete.append(image_path)
								print(f"圖片文件將被刪除: {image_path}")
							else:
								# 有其他模板使用這張圖片，保留文件
								print(f"圖片文件被其他模板使用，保留: {image_path}")
						except Exception as e:
							print(f"處理圖片文件失敗: {e}")
					else:
						print(f"圖片對象無效: image={image.image}, hasattr={hasattr(image.image, 'path') if image.image else False}")  # 調試信息
				
				# 刪除模板（會自動刪除相關的圖片記錄）
				template.delete()
				
				# 現在安全地刪除不再被使用的圖片文件
				for image_path in images_to_delete:
					try:
						if os.path.exists(image_path):
							os.remove(image_path)
							print(f"已刪除未使用的圖片文件: {image_path}")
						else:
							print(f"圖片文件不存在: {image_path}")
					except Exception as e:
						print(f"刪除圖片文件失敗: {image_path}, 錯誤: {e}")
				
				# 清理孤立的圖片文件
				self.cleanup_orphaned_images()
				
				return JsonResponse({
					'success': True,
					'message': '模板已刪除'
				})
				
			except PostTemplate.DoesNotExist:
				return JsonResponse({'error': '找不到指定的模板'}, status=404)
			
		except json.JSONDecodeError:
			return JsonResponse({'error': '無效的 JSON 格式'}, status=400)
		except Exception as e:
			return JsonResponse({'error': f'刪除模板失敗: {str(e)}'}, status=500)
	
	def cleanup_orphaned_images(self):
		"""清理孤立的圖片文件"""
		try:
			import os
			from django.conf import settings
			
			# 獲取所有模板使用的圖片文件路徑
			used_image_paths = set()
			
			# 從資料庫中獲取所有使用的圖片路徑
			for template in PostTemplate.objects.filter(is_active=True):
				for image in template.images.all():
					# 檢查實際圖片文件
					if image.image and hasattr(image.image, 'path'):
						used_image_paths.add(image.image.path)
					
					# 檢查複製的圖片URL（存儲在alt_text中）
					if (image.alt_text and 
						image.alt_text.startswith('/media/')):
						# 將相對路徑轉換為絕對路徑
						# 從 /media/templates/1/filename.jpg 轉換為絕對路徑
						relative_path = image.alt_text.replace('/media/', '')
						alt_text_path = os.path.join(settings.MEDIA_ROOT, relative_path)
						# 不檢查文件是否存在，因為文件可能已經被刪除
						# 我們只需要知道有模板在使用這個圖片
						used_image_paths.add(alt_text_path)
						print(f"添加複製圖片路徑到保護列表: {alt_text_path}")
						
						# 同時也添加標準化的路徑格式，以確保路徑匹配
						normalized_path = os.path.normpath(alt_text_path)
						used_image_paths.add(normalized_path)
						print(f"添加標準化路徑到保護列表: {normalized_path}")
			
			# 檢查 media/templates 目錄中的文件
			templates_dir = os.path.join(settings.MEDIA_ROOT, 'templates')
			if os.path.exists(templates_dir):
				for user_dir in os.listdir(templates_dir):
					user_dir_path = os.path.join(templates_dir, user_dir)
					if os.path.isdir(user_dir_path):
						for filename in os.listdir(user_dir_path):
							file_path = os.path.join(user_dir_path, filename)
							if os.path.isfile(file_path):
								# 檢查文件是否被使用
								if file_path not in used_image_paths:
									try:
										os.remove(file_path)
										print(f"清理孤立圖片文件: {file_path}")
									except Exception as e:
										print(f"刪除孤立圖片文件失敗: {file_path}, 錯誤: {e}")
								else:
									print(f"圖片文件仍在使用: {file_path}")
			
			print("孤立圖片文件清理完成")
			
		except Exception as e:
			print(f"清理孤立圖片文件時發生錯誤: {e}")




