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
		return render(request, 'Crawler/tool.html', context)
	except Exception as e:
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
		if not request.user.is_authenticated:
			return JsonResponse({'error': '請先登入'}, status=401)
		
		if not request.user.is_premium_active:
			return JsonResponse({'error': '此功能僅限付費用戶使用'}, status=403)
		
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
		"""登入 Facebook 並保存 Cookie"""
		try:
			email = data.get('email')
			password = data.get('password')
			
			if not email or not password:
				return JsonResponse({'error': '請提供電子郵件和密碼'}, status=400)
			
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
				website='facebook',
				defaults={
					'website_url': 'https://www.facebook.com',
					'cookie_data': filtered_cookies,
					'is_active': True,
					'notes': f'自動登入獲取，共 {len(filtered_cookies)} 個 Cookie'
				}
			)
			
			driver.quit()
			
			return JsonResponse({
				'success': True,
				'message': f'成功獲取並保存 {len(filtered_cookies)} 個 Facebook Cookie',
				'cookie_count': len(filtered_cookies)
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
		options = Options()
		options.add_argument("--start-maximized")
		options.add_argument("--disable-notifications")
		options.add_argument("--disable-gpu")
		options.add_argument("--no-sandbox")
		options.add_argument("--disable-dev-shm-usage")
		
		# 使用 webdriver_manager 自動管理 ChromeDriver
		service = Service(ChromeDriverManager().install())
		driver = webdriver.Chrome(service=service, options=options)
		
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




