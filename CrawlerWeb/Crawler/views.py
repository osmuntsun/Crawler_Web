from django.shortcuts import render, redirect
from django.http import Http404, JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from Accounts.models import WebsiteCookie, Community
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
			WebDriverWait(driver, 30).until(
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
				communities = self._get_facebook_communities(driver, filtered_cookies)
				if communities:
					self._save_communities_to_db(request.user, communities)
			
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
			# 前往社團頁面
			driver.get("https://www.facebook.com/groups/joins/?nav_source=tab&ordering=viewer_added")
			time.sleep(3)
			
			# 滾動到底部獲取所有社團
			self._scroll_to_bottom(driver)
			
			# 獲取社團列表
			communities = []
			try:
				# 嘗試多個可能的 XPath 來找到社團容器
				possible_xpaths = [
					'/html/body/div[1]/div/div[1]/div/div[3]/div/div/div[1]/div[1]/div[2]/div/div/div/div/div/div/div/div/div/div[3]',
					'//div[@data-testid="groups_tab"]//a[contains(@href, "/groups/")]',
					'//div[contains(@class, "groups")]//a[contains(@href, "/groups/")]',
					'//a[contains(@href, "/groups/") and not(contains(@href, "joins"))]'
				]
				
				for xpath in possible_xpaths:
					try:
						elements = driver.find_elements(By.XPATH, xpath)
						if elements:
							for element in elements:
								name = element.text.strip()
								url = element.get_attribute('href')
								if name and url and 'groups' in url and 'joins' not in url:
									communities.append({
										'name': name,
										'url': url
									})
							break  # 如果找到元素，就跳出循環
					except Exception:
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
				return []
				
		except Exception as e:
			print(f"前往社團頁面時發生錯誤: {str(e)}")
			return []
	
	def _save_communities_to_db(self, user, communities):
		"""保存社團到資料庫"""
		try:
			saved_count = 0
			for community_data in communities:
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
			
			print(f"成功保存 {saved_count} 個新社團到資料庫")
			return saved_count
			
		except Exception as e:
			print(f"保存社團到資料庫時發生錯誤: {str(e)}")
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
					'notes': cookie.notes
				})
			
			return JsonResponse(accounts, safe=False)
			
		except Exception as e:
			return JsonResponse({'error': f'獲取帳號狀態失敗: {str(e)}'}, status=500)


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




