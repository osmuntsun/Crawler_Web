document.addEventListener('DOMContentLoaded', function() {
	// 側邊欄導航功能
	const sidebarItems = document.querySelectorAll('.sidebar-item');
	const tabContents = {
		account: document.getElementById('tab-account'),
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

	// 表單處理
	function handleFormSubmit(form, action) {
		const formData = new FormData(form);
		const data = Object.fromEntries(formData.entries());
		
		// 模擬API調用
		showNotification('正在處理中...', 'info');
		
		setTimeout(() => {
			showNotification(`${action}成功！`, 'success');
		}, 1500);
	}

	// 綁定所有表單提交事件
	document.querySelectorAll('form').forEach(form => {
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			const action = e.submitter?.textContent?.trim() || '儲存';
			handleFormSubmit(form, action);
		});
	});

	// 檢查是否為受限模式（不可使用工具）
	const guestNotice = document.querySelector('.guest-notice');
	const isRestricted = !canUseTool; // 未啟用或未登入 -> 受限

	// 按鈕點擊處理
	document.addEventListener('click', function(e) {
		if (e.target.matches('.btn')) {
			e.preventDefault();
			const button = e.target;
			
			// 若受限且不是提示卡/導覽的按鈕，禁止操作
			if (isRestricted && !button.closest('.notice-actions') && !button.closest('.nav-menu')) {
				showNotification('目前僅能參觀工具，請先登入並完成啟用', 'warning');
				return;
			}
			
			const originalText = button.innerHTML;
			const action = button.textContent.trim();

			// 添加載入狀態
			button.innerHTML = '<span class="loading"></span> 處理中...';
			button.disabled = true;

			// 模擬API調用
			setTimeout(() => {
				button.innerHTML = originalText;
				button.disabled = false;
				showNotification(`${action}成功！`, 'success');
			}, 2000);
		}
	});

	// 檔案上傳處理
	document.querySelectorAll('.file-upload input[type="file"]').forEach(input => {
		input.addEventListener('change', function(e) {
			const files = Array.from(e.target.files);
			const uploadText = this.parentElement.querySelector('.file-upload-text span');
			
			if (files.length > 0) {
				uploadText.textContent = `已選擇 ${files.length} 個檔案`;
				showNotification(`已選擇 ${files.length} 個檔案`, 'success');
			}
		});
	});

	// 拖拽上傳功能
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
				handleFormSubmit(activeForm, '儲存');
			}
		}

		// ESC 關閉側邊欄（移動設備）
		if (e.key === 'Escape' && window.innerWidth <= 768) {
			sidebar.classList.remove('open');
		}
	});

	// 僅對可用帳號顯示就緒提示
	if (canUseTool) {
		setTimeout(() => {
			showNotification('爬蟲工具已準備就緒！', 'success');
		}, 600);
	}

	// Facebook 自動化功能
	function initFacebookAutomation() {
		// Facebook 登入表單處理
		const facebookLoginForm = document.getElementById('facebookLoginForm');
		if (facebookLoginForm) {
			facebookLoginForm.addEventListener('submit', handleFacebookLogin);
		}

		// 獲取社團列表按鈕
		const getCommunitiesBtn = document.getElementById('getCommunitiesBtn');
		if (getCommunitiesBtn) {
			getCommunitiesBtn.addEventListener('click', getFacebookCommunities);
		}

		// Facebook 發文表單處理
		const facebookPostingForm = document.getElementById('facebookPostingForm');
		if (facebookPostingForm) {
			facebookPostingForm.addEventListener('submit', handleFacebookPosting);
		}

		// 圖片上傳處理
		const fbImageUpload = document.getElementById('fbImageUpload');
		if (fbImageUpload) {
			fbImageUpload.addEventListener('change', handleImageUpload);
		}
	}

	// 處理 Facebook 登入
	async function handleFacebookLogin(e) {
		e.preventDefault();
		
		const form = e.target;
		const formData = new FormData(form);
		const data = {
			action: 'login_and_save_cookies',
			email: formData.get('fb_email'),
			password: formData.get('fb_password')
		};

		const loginBtn = document.getElementById('fbLoginBtn');
		const statusDiv = document.getElementById('fbLoginStatus');
		
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
				
				showNotification('Facebook 登入成功！', 'success');
				
				// 清空表單
				form.reset();
				
				// 啟用獲取社團列表按鈕
				const getCommunitiesBtn = document.getElementById('getCommunitiesBtn');
				if (getCommunitiesBtn) {
					getCommunitiesBtn.disabled = false;
				}
			} else {
				throw new Error(result.error || '登入失敗');
			}
		} catch (error) {
			statusDiv.className = 'status-message error';
			statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + error.message;
			statusDiv.style.display = 'block';
			
			showNotification('Facebook 登入失敗：' + error.message, 'error');
		} finally {
			// 恢復按鈕狀態
			loginBtn.disabled = false;
			loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登入並保存 Cookie';
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
		const fbImageUpload = document.getElementById('fbImageUpload');
		const dt = new DataTransfer();
		const files = Array.from(fbImageUpload.files);
		files.splice(index, 1);
		files.forEach(file => dt.items.add(file));
		fbImageUpload.files = dt.files;
	};

	// 處理 Facebook 發文
	async function handleFacebookPosting(e) {
		e.preventDefault();
		
		const form = e.target;
		const formData = new FormData(form);
		
		// 獲取選中的社團
		const selectedCommunities = Array.from(document.querySelectorAll('.community-checkbox:checked'))
			.map(checkbox => checkbox.value);
		
		if (selectedCommunities.length === 0) {
			showNotification('請至少選擇一個社團', 'warning');
			return;
		}

		const message = formData.get('fb_message');
		if (!message.trim()) {
			showNotification('請輸入發文內容', 'warning');
			return;
		}

		// 獲取圖片檔案
		const imageFiles = Array.from(formData.getAll('fb_images'));
		const imagePaths = imageFiles.map(file => file.path || file.name);

		const postBtn = document.getElementById('fbPostBtn');
		const statusDiv = document.getElementById('fbPostingStatus');
		
		// 更新按鈕狀態
		postBtn.disabled = true;
		postBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 發文中...';
		
		// 清除之前的狀態
		statusDiv.style.display = 'none';
		statusDiv.className = 'status-message';

		try {
			const response = await fetch('/Crawler/api/facebook/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'post_to_community',
					community_urls: selectedCommunities,
					message: message,
					image_paths: imagePaths
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				statusDiv.className = 'status-message success';
				statusDiv.innerHTML = `
					<i class="fas fa-check-circle"></i> ${result.message}
					<br><small>成功：${result.success_count} 個，失敗：${result.failed_count} 個</small>
				`;
				statusDiv.style.display = 'block';
				
				showNotification(result.message, 'success');
				
				// 清空表單
				form.reset();
				document.getElementById('imagePreview').innerHTML = '';
				
				// 取消選中所有社團
				document.querySelectorAll('.community-checkbox:checked')
					.forEach(checkbox => checkbox.checked = false);
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
			postBtn.disabled = false;
			postBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 發佈到選中社團';
		}
	}

	// 初始化 Facebook 自動化功能
	if (canUseTool) {
		initFacebookAutomation();
	}

	// 導出全局函數供HTML使用
	window.showNotification = showNotification;
	window.toggleSidebar = toggleSidebar;
});


