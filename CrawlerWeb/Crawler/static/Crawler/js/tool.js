document.addEventListener('DOMContentLoaded', function() {
	// 側邊欄導航功能
	const sidebarItems = document.querySelectorAll('.sidebar-item');
	const tabContents = {
		account: document.getElementById('tab-account'),
		'account-management': document.getElementById('tab-account-management'),
		copy: document.getElementById('tab-copy'),
		post: document.getElementById('tab-post'),
		schedule: document.getElementById('tab-schedule'),
		"auto养": document.getElementById('tab-auto养'),
		"group-sale": document.getElementById('tab-group-sale'),
	};

	// 從後端注入的可用性旗標
	const canUseTool = !!(window.CRAWLER_CAN_USE_TOOL);

	// 切換分頁功能
	function activateTab(tabKey) {
		// 更新側邊欄狀態
		sidebarItems.forEach(item => {
			item.classList.toggle('active', item.dataset.tab === tabKey);
		});

		// 更新內容區域
		Object.entries(tabContents).forEach(([key, element]) => {
			if (!element) return;
			element.classList.toggle('active', key === tabKey);
		});

		// 更新URL參數
		const params = new URLSearchParams(location.search);
		params.set('tab', tabKey);
		history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
	}

	// 獲取分頁名稱（保留以備後續需要）
	function getTabName(tabKey) {
		const tabNames = {
			account: '帳號設定',
			'account-management': '帳號管理',
			copy: '文案設定',
			post: '發文設定',
			schedule: '排程設定',
			"auto养": '自動養號',
			"group-sale": '社團拍賣商品'
		};
		return tabNames[tabKey] || tabKey;
	}

	// 綁定側邊欄點擊事件
	sidebarItems.forEach(item => {
		item.addEventListener('click', () => {
			activateTab(item.dataset.tab);
		});
	});

	// 從URL參數恢復分頁狀態
	const urlTab = new URLSearchParams(location.search).get('tab');
	if (urlTab && tabContents[urlTab]) {
		activateTab(urlTab);
	}

	// 通知系統
	function showNotification(message, type = 'info') {
		const notifications = document.getElementById('notifications');
		const notification = document.createElement('div');
		notification.className = `notification notification-${type}`;
		notification.innerHTML = `
			<div class="notification-content">
				<i class="fas fa-${getNotificationIcon(type)}"></i>
				<span>${message}</span>
			</div>
			<button class="notification-close" onclick="this.parentElement.remove()">
				<i class="fas fa-times"></i>
			</button>
		`;

		notifications.appendChild(notification);

		// 自動移除通知
		setTimeout(() => {
			if (notification.parentElement) {
				notification.remove();
			}
		}, 5000);
	}

	function getNotificationIcon(type) {
		const icons = {
			success: 'check-circle',
			error: 'exclamation-circle',
			warning: 'exclamation-triangle',
			info: 'info-circle'
		};
		return icons[type] || 'info-circle';
	}

	// 檔案上傳拖拽功能
	document.querySelectorAll('.file-upload').forEach(upload => {
		upload.addEventListener('dragover', function(e) {
			e.preventDefault();
			this.style.borderColor = '#764ba2';
			this.style.background = 'rgba(102, 126, 234, 0.1)';
		});

		upload.addEventListener('dragleave', function(e) {
			e.preventDefault();
			this.style.borderColor = '#667eea';
			this.style.background = 'transparent';
		});

		upload.addEventListener('drop', function(e) {
			e.preventDefault();
			this.style.borderColor = '#667eea';
			this.style.background = 'transparent';
			
			const files = Array.from(e.dataTransfer.files);
			const input = this.querySelector('input[type="file"]');
			input.files = e.dataTransfer.files;
			
			const uploadText = this.querySelector('.file-upload-text span');
			uploadText.textContent = `已選擇 ${files.length} 個檔案`;
			showNotification(`已拖拽上傳 ${files.length} 個檔案`, 'success');
		});
	});

	// 表單驗證
	function validateForm(form) {
		const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
		let isValid = true;

		inputs.forEach(input => {
			if (!input.value.trim()) {
				input.style.borderColor = '#dc3545';
				isValid = false;
			} else {
				input.style.borderColor = '#e1e5e9';
			}
		});

		return isValid;
	}

	// 自動保存功能
	let autoSaveTimeout;
	document.querySelectorAll('input, textarea, select').forEach(element => {
		element.addEventListener('input', function() {
			clearTimeout(autoSaveTimeout);
			autoSaveTimeout = setTimeout(() => {
				// 這裡可以實現自動保存邏輯
				console.log('自動保存觸發');
			}, 2000);
		});
	});

	// 響應式側邊欄切換
	const sidebar = document.querySelector('.sidebar');
	const content = document.querySelector('.content');
	
	function toggleSidebar() {
		sidebar.classList.toggle('open');
	}

	// 在移動設備上點擊內容區域時關閉側邊欄
	content.addEventListener('click', function() {
		if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
			sidebar.classList.remove('open');
		}
	});

	// 鍵盤快捷鍵
	document.addEventListener('keydown', function(e) {
		// Ctrl/Cmd + S 保存
		if ((e.ctrlKey || e.metaKey) && e.key === 's') {
			e.preventDefault();
			const activeForm = document.querySelector('.tab-content.active form');
			if (activeForm) {
				// 根據當前分頁執行相應的保存邏輯
				const activeTab = document.querySelector('.tab-content.active').id;
				if (activeTab === 'tab-copy') {
					handleCopySave(e);
				}
			}
		}

		// ESC 關閉側邊欄（移動設備）
		if (e.key === 'Escape' && window.innerWidth <= 768) {
			sidebar.classList.remove('open');
		}
	});

	// 爬蟲工具功能初始化
	function initCrawlerTools() {
		// 帳號登入表單處理
		const accountLoginForm = document.getElementById('accountLoginForm');
		if (accountLoginForm) {
			accountLoginForm.addEventListener('submit', handleAccountLogin);
		}

		// 文案設定表單處理
		const copyForm = document.querySelector('#tab-copy form');
		if (copyForm) {
			copyForm.addEventListener('submit', handleCopySave);
		}

		// 發文設定表單處理
		const postingForm = document.getElementById('postingForm');
		if (postingForm) {
			postingForm.addEventListener('submit', handlePosting);
		}

		// 獲取社團列表按鈕
		const getCommunitiesBtn = document.getElementById('getCommunitiesBtn');
		if (getCommunitiesBtn) {
			getCommunitiesBtn.addEventListener('click', getFacebookCommunities);
		}

		// 圖片上傳處理
		const postingImageUpload = document.getElementById('postingImageUpload');
		if (postingImageUpload) {
			postingImageUpload.addEventListener('change', handleImageUpload);
		}

		// 初始化頁面數據
		loadAccountsStatus();
		loadCopyTemplates();
		updatePostingPlatforms();
		
		// 綁定事件監聽器
		bindEventListeners();
	}

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
		loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登入中...';
		
		// 清除之前的狀態
		statusDiv.style.display = 'none';
		statusDiv.className = 'status-message';

		try {
			const response = await fetch('/Crawler/api/facebook/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data)
			});

			const result = await response.json();

			if (response.ok && result.success) {
				statusDiv.className = 'status-message success';
				statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> ' + result.message;
				statusDiv.style.display = 'block';
				
				showNotification(`${data.platform} 登入成功！`, 'success');
				
				// 清空表單
				form.reset();
				
				// 重新載入帳號狀態和發文平台選項
				loadAccountsStatus();
				updatePostingPlatforms();
			} else {
				throw new Error(result.error || '登入失敗');
			}
		} catch (error) {
			statusDiv.className = 'status-message error';
			statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + error.message;
			statusDiv.style.display = 'block';
			
			showNotification('登入失敗：' + error.message, 'error');
		} finally {
			// 恢復按鈕狀態
			loginBtn.disabled = false;
			loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登入並獲取 Cookie';
		}
	}

	// 處理文案保存
	async function handleCopySave(e) {
		e.preventDefault();
		
		const form = e.target;
		const formData = new FormData(form);
		const data = {
			title: formData.get('copy_title'),
			template: formData.get('copy_template'),
			hashtags: formData.get('hashtags')
		};

		// 這裡可以實現文案保存到後端的邏輯
		console.log('保存文案:', data);
		
		// 顯示成功通知
		showNotification('文案模板保存成功！', 'success');
		
		// 清空表單
		form.reset();
		
		// 重新載入文案模板
		loadCopyTemplates();
	}

	// 處理發文
	async function handlePosting(e) {
		e.preventDefault();
		
		const form = e.target;
		const formData = new FormData(form);
		
		const platform = formData.get('posting_platform');
		const copyTemplate = formData.get('copy_template');
		const imageFiles = Array.from(formData.getAll('posting_images'));

		if (!platform || !copyTemplate) {
			showNotification('請選擇社群平台和文案模板', 'warning');
			return;
		}

		const postingBtn = document.getElementById('postingBtn');
		const statusDiv = document.getElementById('postingStatus');
		
		// 更新按鈕狀態
		postingBtn.disabled = true;
		postingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 發文中...';
		
		// 清除之前的狀態
		statusDiv.style.display = 'none';
		statusDiv.className = 'status-message';

		try {
			let response;
			
			if (platform === 'facebook') {
				// Facebook 特殊處理
				const selectedCommunities = Array.from(document.querySelectorAll('.community-checkbox:checked'))
					.map(checkbox => checkbox.value);
				
				if (selectedCommunities.length === 0) {
					throw new Error('請至少選擇一個 Facebook 社團');
				}

				response = await fetch('/Crawler/api/facebook/', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						action: 'post_to_community',
						community_urls: selectedCommunities,
						message: copyTemplate,
						image_paths: imageFiles.map(file => file.path || file.name)
					})
				});
			} else {
				// 其他平台的發文邏輯
				response = await fetch('/Crawler/api/posting/', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						platform: platform,
						message: copyTemplate,
						images: imageFiles.map(file => file.path || file.name)
					})
				});
			}

			const result = await response.json();

			if (response.ok && result.success) {
				statusDiv.className = 'status-message success';
				statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> ' + result.message;
				statusDiv.style.display = 'block';
				
				showNotification('發文成功！', 'success');
				
				// 清空表單
				form.reset();
				document.getElementById('imagePreview').innerHTML = '';
				document.getElementById('copyPreview').innerHTML = '<p class="text-muted">請先選擇文案模板</p>';
				document.getElementById('copyPreview').classList.remove('preview-active');
				
				// 隱藏 Facebook 社團選擇
				document.getElementById('facebookCommunitiesRow').style.display = 'none';
			} else {
				throw new Error(result.error || '發文失敗');
			}
		} catch (error) {
			statusDiv.className = 'status-message error';
			statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + error.message;
			statusDiv.style.display = 'block';
			
			showNotification('發文失敗：' + error.message, 'error');
		} finally {
			// 恢復按鈕狀態
			postingBtn.disabled = false;
			postingBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 發佈內容';
		}
	}

	// 獲取 Facebook 社團列表
	async function getFacebookCommunities() {
		const getCommunitiesBtn = document.getElementById('getCommunitiesBtn');
		const communitiesList = document.getElementById('communitiesList');
		
		// 更新按鈕狀態
		getCommunitiesBtn.disabled = true;
		getCommunitiesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 獲取中...';

		try {
			const response = await fetch('/Crawler/api/facebook/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'get_communities'
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				displayCommunities(result.communities);
				showNotification(`成功獲取 ${result.communities.length} 個社團`, 'success');
			} else {
				throw new Error(result.error || '獲取社團失敗');
			}
		} catch (error) {
			communitiesList.innerHTML = `
				<div class="status-message error">
					<i class="fas fa-exclamation-circle"></i> 獲取社團失敗：${error.message}
				</div>
			`;
			showNotification('獲取社團失敗：' + error.message, 'error');
		} finally {
			// 恢復按鈕狀態
			getCommunitiesBtn.disabled = false;
			getCommunitiesBtn.innerHTML = '<i class="fas fa-sync"></i> 獲取社團列表';
		}
	}

	// 顯示社團列表
	function displayCommunities(communities) {
		const communitiesList = document.getElementById('communitiesList');
		
		if (!communities || communities.length === 0) {
			communitiesList.innerHTML = '<p class="text-muted">沒有找到社團</p>';
			return;
		}

		let html = '<div class="communities-container">';
		communities.forEach((community, index) => {
			html += `
				<div class="community-item">
					<input type="checkbox" class="community-checkbox" 
						   id="community_${index}" value="${community.url}" 
						   data-name="${community.name}">
					<div class="community-info">
						<h5>${community.name}</h5>
						<p>${community.url}</p>
					</div>
				</div>
			`;
		});
		html += '</div>';
		
		communitiesList.innerHTML = html;
	}

	// 處理圖片上傳
	function handleImageUpload(e) {
		const files = Array.from(e.target.files);
		const imagePreview = document.getElementById('imagePreview');
		
		if (files.length === 0) {
			imagePreview.innerHTML = '';
			return;
		}

		let html = '';
		files.forEach((file, index) => {
			const reader = new FileReader();
			reader.onload = function(e) {
				const imgElement = document.querySelector(`#preview_${index} img`);
				if (imgElement) {
					imgElement.src = e.target.result;
				}
			};
			reader.readAsDataURL(file);

			html += `
				<div class="image-preview-item" id="preview_${index}">
					<img src="" alt="預覽圖片" style="display: none;">
					<div class="image-loading">
						<i class="fas fa-spinner fa-spin"></i>
					</div>
					<button type="button" class="remove-image" onclick="removeImage(${index})">
						<i class="fas fa-times"></i>
					</button>
				</div>
			`;
		});
		
		imagePreview.innerHTML = html;
	}

	// 移除圖片預覽
	window.removeImage = function(index) {
		const previewItem = document.getElementById(`preview_${index}`);
		if (previewItem) {
			previewItem.remove();
		}
		
		// 重新設置 input 的 files
		const postingImageUpload = document.getElementById('postingImageUpload');
		const dt = new DataTransfer();
		const files = Array.from(postingImageUpload.files);
		files.splice(index, 1);
		files.forEach(file => dt.items.add(file));
		postingImageUpload.files = dt.files;
	};

	// 載入帳號狀態
	async function loadAccountsStatus() {
		const accountsStatusDiv = document.getElementById('accountsStatus');
		if (!accountsStatusDiv) return;

		try {
			const response = await fetch('/Crawler/api/accounts/status/');
			const accounts = await response.json();

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
					</div>
				`;
			});

			accountsStatusDiv.innerHTML = html;
		} catch (error) {
			console.error('載入帳號狀態失敗:', error);
			accountsStatusDiv.innerHTML = '<p class="text-muted">載入帳號狀態失敗</p>';
		}
	}

	// 載入文案模板
	async function loadCopyTemplates() {
		const copyTemplateSelect = document.getElementById('copyTemplate');
		if (!copyTemplateSelect) return;

		try {
			// 這裡可以從後端獲取文案模板
			// 暫時使用本地存儲的示例數據
			const templates = JSON.parse(localStorage.getItem('copyTemplates') || '[]');
			
			// 清空現有選項
			copyTemplateSelect.innerHTML = '<option value="">選擇要使用的文案模板</option>';
			
			// 添加文案選項
			templates.forEach(template => {
				const option = document.createElement('option');
				option.value = template.id;
				option.textContent = template.title;
				copyTemplateSelect.appendChild(option);
			});
		} catch (error) {
			console.error('載入文案模板失敗:', error);
		}
	}

	// 更新發文平台選項
	async function updatePostingPlatforms() {
		const postingPlatformSelect = document.getElementById('postingPlatform');
		if (!postingPlatformSelect) return;

		try {
			const response = await fetch('/Crawler/api/accounts/status/');
			const accounts = await response.json();
			
			// 清空現有選項
			postingPlatformSelect.innerHTML = '<option value="">選擇要發文的社群平台</option>';
			
			// 只顯示已登入的平台
			accounts.filter(acc => acc.is_active).forEach(account => {
				const option = document.createElement('option');
				option.value = account.website;
				option.textContent = getPlatformDisplayName(account.website);
				postingPlatformSelect.appendChild(option);
			});
		} catch (error) {
			console.error('更新發文平台選項失敗:', error);
		}
	}

	// 獲取平台顯示名稱
	function getPlatformDisplayName(platform) {
		const names = {
			facebook: 'Facebook',
			instagram: 'Instagram',
			twitter: 'Twitter',
			linkedin: 'LinkedIn',
			youtube: 'YouTube',
			discord: 'Discord',
			telegram: 'Telegram',
			line: 'Line',
			wechat: 'WeChat'
		};
		return names[platform] || platform;
	}

	// 綁定事件監聽器
	function bindEventListeners() {
		// 文案模板選擇變化時更新預覽
		const copyTemplateSelect = document.getElementById('copyTemplate');
		if (copyTemplateSelect) {
			copyTemplateSelect.addEventListener('change', function() {
				const copyPreview = document.getElementById('copyPreview');
				if (this.value) {
					// 這裡可以從後端獲取文案內容
					const templates = JSON.parse(localStorage.getItem('copyTemplates') || '[]');
					const template = templates.find(t => t.id === this.value);
					
					if (template) {
						copyPreview.textContent = template.template;
						copyPreview.classList.add('preview-active');
					}
				} else {
					copyPreview.innerHTML = '<p class="text-muted">請先選擇文案模板</p>';
					copyPreview.classList.remove('preview-active');
				}
			});
		}

		// 發文平台選擇變化時處理特殊邏輯
		const postingPlatformSelect = document.getElementById('postingPlatform');
		if (postingPlatformSelect) {
			postingPlatformSelect.addEventListener('change', function() {
				const facebookCommunitiesRow = document.getElementById('facebookCommunitiesRow');
				if (this.value === 'facebook') {
					facebookCommunitiesRow.style.display = 'block';
				} else {
					facebookCommunitiesRow.style.display = 'none';
				}
			});
		}
	}

	// 僅對可用帳號顯示就緒提示
	if (canUseTool) {
		setTimeout(() => {
			showNotification('爬蟲工具已準備就緒！', 'success');
		}, 600);
		
		// 初始化爬蟲工具功能
		initCrawlerTools();
	}

	// 導出全局函數供HTML使用
	window.showNotification = showNotification;
	window.toggleSidebar = toggleSidebar;
});


