// Facebook 自動化工具 JavaScript

document.addEventListener('DOMContentLoaded', function() {
	// 初始化
	initTabs();
	initForms();
	checkStatus();
	
	// 標籤頁切換
	function initTabs() {
		const tabButtons = document.querySelectorAll('.sidebar-item');
		const tabContents = document.querySelectorAll('.tab-content');
		
		tabButtons.forEach(button => {
			button.addEventListener('click', function() {
				const targetTab = this.getAttribute('data-tab');
				
				// 移除所有活動狀態
				tabButtons.forEach(btn => btn.classList.remove('active'));
				tabContents.forEach(content => content.classList.remove('active'));
				
				// 設置當前活動狀態
				this.classList.add('active');
				document.getElementById(`tab-${targetTab}`).classList.add('active');
			});
		});
	}
	
	// 表單初始化
	function initForms() {
		// 登入表單
		const loginForm = document.getElementById('loginForm');
		if (loginForm) {
			loginForm.addEventListener('submit', handleLogin);
		}
		
		// 獲取社團按鈕
		const getCommunitiesBtn = document.getElementById('getCommunitiesBtn');
		if (getCommunitiesBtn) {
			getCommunitiesBtn.addEventListener('click', getCommunities);
		}
		
		// 發文表單
		const postingForm = document.getElementById('postingForm');
		if (postingForm) {
			postingForm.addEventListener('submit', handlePosting);
		}
		
		// 重新檢查狀態按鈕
		const refreshStatusBtn = document.getElementById('refreshStatusBtn');
		if (refreshStatusBtn) {
			refreshStatusBtn.addEventListener('click', checkStatus);
		}
	}
	
	// 處理登入
	async function handleLogin(event) {
		event.preventDefault();
		
		const formData = new FormData(event.target);
		const email = formData.get('email');
		const password = formData.get('password');
		
		if (!email || !password) {
			showNotification('請填寫完整的登入資訊', 'error');
			return;
		}
		
		// 禁用按鈕
		const loginBtn = document.getElementById('loginBtn');
		loginBtn.disabled = true;
		loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登入中...';
		
		try {
			const response = await fetch('/crawler/api/facebook/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': getCSRFToken()
				},
				body: JSON.stringify({
					action: 'login_and_save_cookies',
					email: email,
					password: password
				})
			});
			
			const data = await response.json();
			
			if (response.ok) {
				showNotification(data.message, 'success');
				showStatusMessage('loginStatus', data.message, 'success');
				checkStatus(); // 重新檢查狀態
			} else {
				showNotification(data.error, 'error');
				showStatusMessage('loginStatus', data.error, 'error');
			}
		} catch (error) {
			console.error('登入錯誤:', error);
			showNotification('登入失敗，請檢查網路連線', 'error');
			showStatusMessage('loginStatus', '登入失敗，請檢查網路連線', 'error');
		} finally {
			// 恢復按鈕
			loginBtn.disabled = false;
			loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登入並保存 Cookie';
		}
	}
	
	// 獲取社團列表
	async function getCommunities() {
		const getCommunitiesBtn = document.getElementById('getCommunitiesBtn');
		const communitiesStatus = document.getElementById('communitiesStatus');
		const communitiesList = document.getElementById('communitiesList');
		const communitySelect = document.getElementById('communitySelect');
		
		// 禁用按鈕
		getCommunitiesBtn.disabled = true;
		getCommunitiesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 獲取中...';
		communitiesStatus.textContent = '正在獲取社團列表...';
		
		try {
			const response = await fetch('/crawler/api/facebook/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': getCSRFToken()
				},
				body: JSON.stringify({
					action: 'get_communities'
				})
			});
			
			const data = await response.json();
			
			if (response.ok) {
				communitiesStatus.textContent = `成功獲取 ${data.count} 個社團`;
				displayCommunities(data.communities);
				updateCommunitySelect(data.communities);
				showNotification(`成功獲取 ${data.count} 個社團`, 'success');
			} else {
				communitiesStatus.textContent = data.error;
				showNotification(data.error, 'error');
			}
		} catch (error) {
			console.error('獲取社團錯誤:', error);
			communitiesStatus.textContent = '獲取失敗，請檢查網路連線';
			showNotification('獲取社團失敗，請檢查網路連線', 'error');
		} finally {
			// 恢復按鈕
			getCommunitiesBtn.disabled = false;
			getCommunitiesBtn.innerHTML = '<i class="fas fa-sync"></i> 獲取社團列表';
		}
	}
	
	// 顯示社團列表
	function displayCommunities(communities) {
		const communitiesList = document.getElementById('communitiesList');
		
		if (communities.length === 0) {
			communitiesList.innerHTML = '<p class="text-muted">沒有找到社團</p>';
			return;
		}
		
		const communitiesHTML = communities.map(community => `
			<div class="community-item">
				<div class="community-info">
					<h4>${community.name}</h4>
					<p>${community.url}</p>
				</div>
				<div class="community-actions">
					<button class="btn btn-sm btn-primary" onclick="selectCommunity('${community.url}', '${community.name}')">
						<i class="fas fa-edit"></i> 選擇發文
					</button>
				</div>
			</div>
		`).join('');
		
		communitiesList.innerHTML = communitiesHTML;
	}
	
	// 更新社團選擇下拉選單
	function updateCommunitySelect(communities) {
		const communitySelect = document.getElementById('communitySelect');
		
		// 清空現有選項
		communitySelect.innerHTML = '<option value="">選擇社團</option>';
		
		// 添加社團選項
		communities.forEach(community => {
			const option = document.createElement('option');
			option.value = community.url;
			option.textContent = community.name;
			communitySelect.appendChild(option);
		});
	}
	
	// 選擇社團（用於發文）
	window.selectCommunity = function(url, name) {
		const communitySelect = document.getElementById('communitySelect');
		communitySelect.value = url;
		
		// 切換到發文標籤頁
		document.querySelector('[data-tab="posting"]').click();
		
		showNotification(`已選擇社團: ${name}`, 'info');
	};
	
	// 處理發文
	async function handlePosting(event) {
		event.preventDefault();
		
		const formData = new FormData(event.target);
		const communityUrl = formData.get('community_url');
		const message = formData.get('message');
		
		if (!communityUrl || !message) {
			showNotification('請填寫完整的發文資訊', 'error');
			return;
		}
		
		// 禁用按鈕
		const postBtn = document.getElementById('postBtn');
		postBtn.disabled = true;
		postBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 發文中...';
		
		try {
			const response = await fetch('/crawler/api/facebook/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': getCSRFToken()
				},
				body: JSON.stringify({
					action: 'post_to_community',
					community_url: communityUrl,
					message: message
				})
			});
			
			const data = await response.json();
			
			if (response.ok) {
				showNotification(data.message, 'success');
				showStatusMessage('postingStatus', data.message, 'success');
				event.target.reset(); // 清空表單
			} else {
				showNotification(data.error, 'error');
				showStatusMessage('postingStatus', data.error, 'error');
			}
		} catch (error) {
			console.error('發文錯誤:', error);
			showNotification('發文失敗，請檢查網路連線', 'error');
			showStatusMessage('postingStatus', '發文失敗，請檢查網路連線', 'error');
		} finally {
			// 恢復按鈕
			postBtn.disabled = false;
			postBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 發佈到社團';
		}
	}
	
	// 檢查狀態
	async function checkStatus() {
		try {
			// 這裡可以添加檢查 Cookie 狀態的 API 調用
			// 目前先顯示基本狀態
			updateStatusDisplay();
		} catch (error) {
			console.error('狀態檢查錯誤:', error);
		}
	}
	
	// 更新狀態顯示
	function updateStatusDisplay() {
		// 這裡可以根據實際 API 回應更新狀態
		// 目前顯示預設值
		document.getElementById('cookieStatus').textContent = '檢查中...';
		document.getElementById('communitiesCount').textContent = '未知';
		document.getElementById('lastUpdate').textContent = new Date().toLocaleString('zh-TW');
	}
	
	// 顯示狀態訊息
	function showStatusMessage(elementId, message, type) {
		const element = document.getElementById(elementId);
		if (element) {
			element.textContent = message;
			element.className = `status-message ${type}`;
			element.style.display = 'block';
			
			// 3秒後自動隱藏
			setTimeout(() => {
				element.style.display = 'none';
			}, 3000);
		}
	}
	
	// 顯示通知
	function showNotification(message, type = 'info') {
		const notifications = document.getElementById('notifications');
		const notification = document.createElement('div');
		notification.className = `notification ${type}`;
		notification.textContent = message;
		
		notifications.appendChild(notification);
		
		// 5秒後自動移除
		setTimeout(() => {
			notification.remove();
		}, 5000);
	}
	
	// 獲取 CSRF Token
	function getCSRFToken() {
		const cookies = document.cookie.split(';');
		for (let cookie of cookies) {
			const [name, value] = cookie.trim().split('=');
			if (name === 'csrftoken') {
				return value;
			}
		}
		return '';
	}
});
