// auth.js - 帳號認證和帳號管理功能

// 處理帳號登入
async function handleAccountLogin(e) {
	e.preventDefault();
	
	const form = e.target;
	const formData = new FormData(form);
	const data = {
		action: 'login_and_save_cookies',
		platform: formData.get('login_platform'),
		email: formData.get('email'),
		password: formData.get('password')
	};

	const loginBtn = document.getElementById('accountLoginBtn');
	const statusDiv = document.getElementById('accountLoginStatus');
	
	// 更新按鈕狀態
	loginBtn.disabled = true;
	const platform = formData.get('login_platform');
	if (platform === 'facebook') {
		loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登入中並獲取社團...';
	} else {
		loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登入中...';
	}
	
	// 清除之前的狀態
	statusDiv.style.display = 'none';
	statusDiv.className = 'status-message';

	try {
		// 獲取 CSRF 令牌
		const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
		
		const response = await fetch('/crawler/api/facebook/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			},
			body: JSON.stringify(data)
		});

		const result = await response.json();

		if (response.ok && result.success) {
			statusDiv.className = 'status-message success';
			statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> ' + result.message;
			statusDiv.style.display = 'block';
			
			// 顯示成功通知
			if (data.platform === 'facebook' && result.communities_count > 0) {
				window.showNotification(`${data.platform} 登入成功！已獲取 ${result.communities_count} 個社團`, 'success');
			} else {
				window.showNotification(`${data.platform} 登入成功！`, 'success');
			}
			
			// 清空表單
			form.reset();
			
			// 重新載入帳號狀態、社團列表和發文平台選項
			(async () => {
				await loadAccountsStatus();
				await loadCommunities();
				await updatePostingPlatforms();
				// 立即檢查並隱藏已登入的平台選項
				await checkAndHideLoggedInPlatforms();
			})();
			
			// 如果是 Facebook 登入成功，從選項中移除 Facebook
			if (data.platform === 'facebook') {
				const platformSelect = document.querySelector('select[name="login_platform"]');
				if (platformSelect) {
					const facebookOption = platformSelect.querySelector('option[value="facebook"]');
					if (facebookOption) {
						facebookOption.style.display = 'none';
						facebookOption.disabled = true;
						console.log('Facebook登入成功，已隱藏Facebook選項');
					}
				}
			}
		} else {
			throw new Error(result.error || '登入失敗');
		}
	} catch (error) {
		statusDiv.className = 'status-message error';
		statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + error.message;
		statusDiv.style.display = 'block';
		
		window.showNotification('登入失敗：' + error.message, 'error');
	} finally {
		// 恢復按鈕狀態
		loginBtn.disabled = false;
		loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登入並獲取 Cookie';
	}
}

// 載入帳號狀態
async function loadAccountsStatus() {
	console.log('loadAccountsStatus 函數被調用');
	const accountsStatusDiv = document.getElementById('accountsStatus');
	if (!accountsStatusDiv) {
		console.log('找不到 accountsStatus 元素');
		return;
	}
	console.log('找到 accountsStatus 元素:', accountsStatusDiv);

	try {
		console.log('開始載入帳號狀態...');
		const response = await fetch('/crawler/api/accounts/status/');
		const accounts = await response.json();
		console.log('帳號狀態響應:', accounts);

		let html = '';
		const platforms = [
			{ key: 'facebook', name: 'Facebook', icon: 'fab fa-facebook' },
			{ key: 'instagram', name: 'Instagram', icon: 'fab fa-instagram' },
			{ key: 'twitter', name: 'Twitter', icon: 'fab fa-twitter' },
			{ key: 'linkedin', name: 'LinkedIn', icon: 'fab fa-linkedin' },
			{ key: 'youtube', name: 'YouTube', icon: 'fab fa-youtube' },
			{ key: 'discord', name: 'Discord', icon: 'fab fa-discord' },
			{ key: 'telegram', name: 'Telegram', icon: 'fab fa-telegram' },
			{ key: 'line', name: 'Line', icon: 'fab fa-line' },
			{ key: 'wechat', name: 'WeChat', icon: 'fab fa-weixin' }
		];

		platforms.forEach(platform => {
			const account = accounts.find(acc => acc.website === platform.key);
			const isConnected = account && account.is_active;
			console.log(`平台 ${platform.key}: ${isConnected ? '已連接' : '未連接'}`);
			
			html += `
				<div class="account-status-card ${isConnected ? 'connected' : 'disconnected'}">
					<div class="platform-icon">
						<i class="${platform.icon}"></i>
					</div>
					<div class="platform-name">${platform.name}</div>
					<div class="status-text">
						${isConnected ? '已登入' : '未登入'}
					</div>
					${isConnected ? `<div class="last-update">最後更新：${new Date(account.last_updated).toLocaleString()}</div>` : ''}
					${isConnected ? `<div class="cookie-count">Cookie 數量：${account.cookie_count || 0}</div>` : ''}
				</div>
			`;
		});

		accountsStatusDiv.innerHTML = html;
		
		// 同時更新帳號列表表格
		await updateAccountsTable(accounts);
		
		// 只有在帳號設定頁面才更新平台選項
		const platformSelect = document.querySelector('select[name="login_platform"]');
		if (platformSelect) {
			await checkAndHideLoggedInPlatforms();
		}
	} catch (error) {
		console.error('載入帳號狀態失敗:', error);
		console.error('錯誤詳情:', error.message);
		accountsStatusDiv.innerHTML = '<p class="text-muted">載入帳號狀態失敗</p>';
	}
}

// 更新帳號列表表格
async function updateAccountsTable(accounts) {
	console.log('updateAccountsTable 函數被調用，帳號數量:', accounts.length);
	console.log('帳號數據:', accounts);
	const accountsTableBody = document.getElementById('accountsTableBody');
	if (!accountsTableBody) {
		console.log('找不到帳號表格主體元素 #accountsTableBody');
		console.log('當前頁面所有元素:', document.querySelectorAll('*[id]'));
		return;
	}
	console.log('找到帳號表格主體元素:', accountsTableBody);

	// 檢查用戶權限
	let isSuperUser = false;
	try {
		const userResponse = await fetch('/crawler/api/user/permissions/');
		if (userResponse.ok) {
			const userData = await userResponse.json();
			isSuperUser = userData.is_superuser || false;
		}
	} catch (error) {
		console.log('無法獲取用戶權限，預設為非超級用戶');
	}

	if (accounts.length === 0) {
		accountsTableBody.innerHTML = `
			<tr class="no-data">
				<td colspan="6">
					<div class="empty-state">
						<i class="fas fa-inbox"></i>
						<p>尚未新增任何社群軟體帳號</p>
						<small>點擊上方表單新增您的第一個帳號</small>
					</div>
				</td>
			</tr>
		`;
	} else {
		let html = '';
		accounts.forEach(account => {
			const platformName = getPlatformDisplayName(account.website);
			const cookieCount = account.cookie_count || 0;
			const statusText = account.is_active ? '啟用' : '停用';
			const statusClass = account.is_active ? 'status-active' : 'status-inactive';
			
			html += `
				<tr>
					<td>
						<span class="platform-badge ${account.website}">
							<i class="fab fa-${account.website === 'facebook' ? 'facebook' : 'globe'}"></i>
							${platformName}
						</span>
					</td>
					<td>
						<a href="${account.website_url}" target="_blank" class="community-link">
							<i class="fas fa-external-link-alt"></i> ${account.website_url}
						</a>
					</td>
					<td>${cookieCount}</td>
					<td>${new Date(account.last_updated).toLocaleString()}</td>
					<td>
						<span class="status-badge ${statusClass}">
							${statusText}
						</span>
					</td>
					<td>
						${isSuperUser ? 
							`<button class="btn btn-sm btn-danger delete-account-btn" data-platform="${account.website}">
								<i class="fas fa-trash"></i> 刪除
							</button>` : 
							`<small class="text-muted">僅超級管理員可刪除</small>`
						}
					</td>
				</tr>
			`;
		});
		accountsTableBody.innerHTML = html;
		
		// 綁定刪除按鈕事件
		if (isSuperUser) {
			const deleteButtons = accountsTableBody.querySelectorAll('.delete-account-btn');
			deleteButtons.forEach(button => {
				button.addEventListener('click', function() {
					const platform = this.getAttribute('data-platform');
					deleteAccount(platform);
				});
			});
		}
	}
}

// 檢查並隱藏已登入的平台選項
async function checkAndHideLoggedInPlatforms() {
	try {
		console.log('開始檢查已登入的平台...');
		
		// 查找平台選擇元素
		const platformSelect = document.querySelector('select[name="login_platform"]');
		if (!platformSelect) {
			console.log('當前頁面沒有平台選擇元素，跳過檢查已登入平台');
			return;
		}
		
		console.log('找到平台選擇元素:', platformSelect);
		
		// 獲取所有選項
		const allOptions = platformSelect.querySelectorAll('option');
		console.log('所有平台選項:', Array.from(allOptions).map(opt => ({ value: opt.value, text: opt.textContent })));
		
		// 發送API請求獲取帳號狀態
		const response = await fetch('/crawler/api/accounts/status/');
		if (!response.ok) {
			throw new Error(`API請求失敗: ${response.status} ${response.statusText}`);
		}
		
		const accounts = await response.json();
		console.log('API返回的帳號數據:', accounts);
		
		if (!Array.isArray(accounts)) {
			console.error('API返回的數據不是陣列:', accounts);
			return;
		}
		
		// 遍歷每個帳號，隱藏已登入的平台
		accounts.forEach(account => {
			console.log('處理帳號:', account);
			
			if (account.is_active && account.website) {
				console.log(`帳號 ${account.website} 是活躍的，準備隱藏對應選項`);
				
				// 查找對應的平台選項
				const option = platformSelect.querySelector(`option[value="${account.website}"]`);
				if (option) {
					// 隱藏選項
					option.style.display = 'none';
					option.disabled = true;
					console.log(`成功隱藏平台選項: ${account.website}`);
				} else {
					console.warn(`找不到對應的平台選項: ${account.website}`);
					console.log('當前所有選項值:', Array.from(allOptions).map(opt => opt.value));
				}
			} else {
				console.log(`帳號 ${account.website} 不是活躍的或缺少website字段:`, account);
			}
		});
		
		// 檢查最終結果
		const visibleOptions = platformSelect.querySelectorAll('option:not([style*="display: none"])');
		console.log('隱藏完成後的可見選項數量:', visibleOptions.length);
		console.log('隱藏完成後的可見選項:', Array.from(visibleOptions).map(opt => ({ value: opt.value, text: opt.textContent })));
		
	} catch (error) {
		console.error('檢查已登入平台時發生錯誤:', error);
		console.error('錯誤詳情:', error.message);
		console.error('錯誤堆疊:', error.stack);
	}
}

// 刪除帳號
async function deleteAccount(platform) {
	if (!confirm(`確定要刪除 ${getPlatformDisplayName(platform)} 帳號嗎？`)) {
		return;
	}

	try {
		// 獲取 CSRF 令牌
		const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
		
		const response = await fetch('/crawler/api/accounts/delete/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			},
			body: JSON.stringify({
				platform: platform
			})
		});

		const result = await response.json();

		if (response.ok && result.success) {
			window.showNotification(`${getPlatformDisplayName(platform)} 帳號已刪除`, 'success');
			(async () => {
				await loadAccountsStatus();
				await loadCommunities();
				await updatePostingPlatforms();
			})();
			
			// 如果是 Facebook，重新顯示選項
			if (platform === 'facebook') {
				const platformSelect = document.querySelector('select[name="login_platform"]');
				if (platformSelect) {
					const facebookOption = platformSelect.querySelector('option[value="facebook"]');
					if (facebookOption) {
						facebookOption.style.display = '';
						facebookOption.disabled = false;
					}
				}
			}
		} else {
			throw new Error(result.error || '刪除失敗');
		}
	} catch (error) {
		window.showNotification('刪除失敗：' + error.message, 'error');
	}
}

// 獲取平台顯示名稱
function getPlatformDisplayName(platform) {
	const platformNames = {
		'facebook': 'Facebook',
		'instagram': 'Instagram',
		'twitter': 'Twitter',
		'linkedin': 'LinkedIn',
		'youtube': 'YouTube',
		'tiktok': 'TikTok'
	};
	return platformNames[platform] || platform;
}

// 導出全局函數
window.handleAccountLogin = handleAccountLogin;
window.loadAccountsStatus = loadAccountsStatus;
window.updateAccountsTable = updateAccountsTable;
window.checkAndHideLoggedInPlatforms = checkAndHideLoggedInPlatforms;
window.deleteAccount = deleteAccount;
window.getPlatformDisplayName = getPlatformDisplayName;
