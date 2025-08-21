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

	// 檢查是否為訪客模式
	const guestNotice = document.querySelector('.guest-notice');
	const isGuest = guestNotice && (!guestNotice.style.display || guestNotice.style.display !== 'none');

	// 按鈕點擊處理
	document.addEventListener('click', function(e) {
		if (e.target.matches('.btn')) {
			e.preventDefault();
			const button = e.target;
			
			// 如果是訪客模式且不是登入相關按鈕，顯示提示
			if (isGuest && !button.closest('.notice-actions') && !button.closest('.nav-menu')) {
				showNotification('請先登入後再使用此功能', 'warning');
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

	// 初始化完成通知
	setTimeout(() => {
		showNotification('爬蟲工具已準備就緒！', 'success');
	}, 1000);

	// 導出全局函數供HTML使用
	window.showNotification = showNotification;
	window.toggleSidebar = toggleSidebar;
});


