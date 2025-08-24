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

		// 重新整理社團按鈕
		const refreshCommunitiesBtn = document.getElementById('refreshCommunitiesBtn');
		if (refreshCommunitiesBtn) {
			refreshCommunitiesBtn.addEventListener('click', refreshCommunities);
		}

		// 模板圖片上傳
		const templateImageUpload = document.getElementById('templateImageUpload');
		const imageUploadArea = document.getElementById('imageUploadArea');
		if (templateImageUpload && imageUploadArea) {
			templateImageUpload.addEventListener('change', handleTemplateImageUpload);
			
			// 拖拽上傳
			imageUploadArea.addEventListener('dragover', handleDragOver);
			imageUploadArea.addEventListener('dragleave', handleDragLeave);
			imageUploadArea.addEventListener('drop', handleDrop);
		}

		// 儲存模板按鈕
		const saveTemplateBtn = document.getElementById('saveTemplateBtn');
		if (saveTemplateBtn) {
			saveTemplateBtn.addEventListener('click', handleSaveTemplate);
		}

		// 預覽模板按鈕
		const previewTemplateBtn = document.getElementById('previewTemplateBtn');
		if (previewTemplateBtn) {
			previewTemplateBtn.addEventListener('click', handlePreviewTemplate);
		}

		// 清空模板按鈕
		const clearTemplateBtn = document.getElementById('clearTemplateBtn');
		if (clearTemplateBtn) {
			clearTemplateBtn.addEventListener('click', handleClearTemplate);
		}

		// 標籤篩選器
		const hashtagFilter = document.getElementById('hashtagFilter');
		if (hashtagFilter) {
			console.log('標籤篩選器元素找到，綁定事件監聽器');
			hashtagFilter.addEventListener('change', handleHashtagFilter);
		} else {
			console.error('找不到標籤篩選器元素');
		}

		// 文案模板選擇器
		const copyTemplateSelect = document.getElementById('copyTemplate');
		if (copyTemplateSelect) {
			console.log('文案模板選擇器元素找到，綁定事件監聽器');
			copyTemplateSelect.addEventListener('change', handleCopyTemplateChange);
		} else {
			console.error('找不到文案模板選擇器元素');
		}

		// 發文平台選擇器
		const postingPlatformSelect = document.getElementById('postingPlatform');
		if (postingPlatformSelect) {
			console.log('發文平台選擇器元素找到，綁定事件監聽器');
			postingPlatformSelect.addEventListener('change', handlePostingPlatformChange);
		} else {
			console.error('找不到發文平台選擇器元素');
		}

		// 為表單輸入框添加事件監聽器，檢查內容變化
		const titleInput = document.querySelector('input[name="copy_title"]');
		const contentTextarea = document.querySelector('textarea[name="copy_template"]');
		const hashtagsInput = document.querySelector('input[name="hashtags"]');
		
		if (titleInput) {
			titleInput.addEventListener('input', checkFormEmptyAndUpdateButtons);
		}
		if (contentTextarea) {
			contentTextarea.addEventListener('input', checkFormEmptyAndUpdateButtons);
		}
		if (hashtagsInput) {
			hashtagsInput.addEventListener('input', checkFormEmptyAndUpdateButtons);
		}

		// 初始化頁面數據
		(async () => {
			await loadAccountsStatus();
			await loadCommunities();
			await loadCopyTemplates();
			await loadPostTemplates();
			await updatePostingPlatforms(); // 這會自動檢查Facebook登入狀態並載入社團
			await updateCopyTemplateOptions(); // 更新文案模板選項
		})();
		
		// 檢查並隱藏已登入的平台選項
		setTimeout(async () => {
			await checkAndHideLoggedInPlatforms();
		}, 1000); // 延遲1秒執行，確保其他數據已載入
		
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
					showNotification(`${data.platform} 登入成功！已獲取 ${result.communities_count} 個社團`, 'success');
				} else {
					showNotification(`${data.platform} 登入成功！`, 'success');
				}
				
				// 清空表單
				form.reset();
				
				// 重新載入帳號狀態、社團列表和發文平台選項
				(async () => {
					await loadAccountsStatus();
					await loadCommunities();
					await updatePostingPlatforms();
				})();
				
				// 如果是 Facebook 登入成功，從選項中移除 Facebook
				if (data.platform === 'facebook') {
					const platformSelect = document.querySelector('select[name="login_platform"]');
					if (platformSelect) {
						const facebookOption = platformSelect.querySelector('option[value="facebook"]');
						if (facebookOption) {
							facebookOption.style.display = 'none';
							facebookOption.disabled = true;
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
		await loadCopyTemplates();
	}

	// 處理發文
	async function handlePosting(e) {
		e.preventDefault();
		
		const form = e.target;
		const formData = new FormData(form);
		
		const platform = formData.get('posting_platform');
		const copyTemplate = formData.get('copy_template');
		const imageFiles = Array.from(formData.getAll('posting_images'));

		// 獲取選取的文案內容
		let messageContent = '';
		
		if (copyTemplate) {
			// 從選中的選項中獲取模板數據
			const copyTemplateSelect = document.getElementById('copyTemplate');
			const selectedOption = copyTemplateSelect.options[copyTemplateSelect.selectedIndex];
			
			console.log('選取的模板ID:', copyTemplate);
			console.log('選中的選項:', selectedOption);
			
			if (selectedOption && selectedOption.dataset.template) {
				const template = JSON.parse(selectedOption.dataset.template);
				console.log('選取的模板:', template);
				
				// 使用通用函數處理文字內容
				messageContent = processTemplateContent(template.content);
				console.log('原始模板內容:', template.content);
				console.log('處理後的文案內容:', messageContent);
				
				// 獲取模板中的圖片
				if (template.images && template.images.length > 0) {
					console.log('模板包含圖片:', template.images);
					// 將模板圖片添加到 imageFiles 中
					template.images.forEach((image, index) => {
						// 創建一個模擬的 File 對象，包含圖片的 URL 和名稱
						const mockFile = {
							name: image.name || `template_image_${index + 1}.jpg`,
							url: image.url,
							path: image.url, // 添加 path 屬性
							type: 'image/jpeg',
							size: 0,
							lastModified: Date.now()
						};
						imageFiles.push(mockFile);
					});
					console.log('處理後的圖片文件:', imageFiles);
				}
			} else {
				showNotification('找不到選取的文案模板', 'warning');
				return;
			}
		}

		if (!platform || !messageContent || messageContent.trim() === '') {
			showNotification('請選擇社群平台和有效的文案內容', 'warning');
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

				// 獲取 CSRF 令牌
				const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
				
				// 創建 JSON 數據來發送
				const postData = {
					action: 'post_to_community',
					community_urls: selectedCommunities,
					message: messageContent,
					image_paths: imageFiles
						.map(file => file.url || file.path)
						.filter(path => path && path.trim() !== '') // 過濾掉空值
				};
				
				// 添加調試日誌
				console.log('準備發送的數據:', postData);
				console.log('圖片路徑數組:', postData.image_paths);
				console.log('JSON 字符串:', JSON.stringify(postData));
				
				response = await fetch('/crawler/api/facebook/', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-CSRFToken': csrfToken,
					},
					body: JSON.stringify(postData)
				});
			} else {
				// 其他平台的發文邏輯
				// 獲取 CSRF 令牌
				const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
				
				response = await fetch('/crawler/api/posting/', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-CSRFToken': csrfToken,
					},
					body: JSON.stringify({
						platform: platform,
						message: messageContent,
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
				
				// 安全地清空圖片預覽
				const imagePreview = document.getElementById('imagePreview');
				if (imagePreview) {
					imagePreview.innerHTML = '';
				}
				
				// 安全地清空文案預覽
				const copyPreview = document.getElementById('copyPreview');
				if (copyPreview) {
					copyPreview.innerHTML = '<p class="text-muted">請先選擇文案模板</p>';
					copyPreview.classList.remove('preview-active');
				}
				
				// 隱藏 Facebook 社團選擇
				const facebookCommunitiesRow = document.getElementById('facebookCommunitiesRow');
				if (facebookCommunitiesRow) {
					facebookCommunitiesRow.style.display = 'none';
				}
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
			// 獲取 CSRF 令牌
			const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
			
			const response = await fetch('/crawler/api/facebook/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
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

		// 使用新的多行佈局，只顯示社團名稱
		let html = '<div class="community-checkbox-group">';
		communities.forEach((community, index) => {
			html += `
				<div class="community-checkbox-item">
					<input type="checkbox" class="community-checkbox" 
						   id="community_${index}" value="${community.url}" 
						   data-name="${community.name}">
					<label for="community_${index}" title="${community.name}">${community.name}</label>
				</div>
			`;
		});
		html += '</div>';
		
		communitiesList.innerHTML = html;
		
		// 綁定全選和取消全選按鈕事件
		const selectAllBtn = document.getElementById('selectAllCommunitiesBtn');
		const deselectAllBtn = document.getElementById('deselectAllCommunitiesBtn');
		
		if (selectAllBtn) {
			selectAllBtn.addEventListener('click', selectAllCommunities);
		}
		if (deselectAllBtn) {
			deselectAllBtn.addEventListener('click', deselectAllCommunities);
		}
	}

	// 全選 Facebook 社團
	function selectAllCommunities() {
		const checkboxes = document.querySelectorAll('#communitiesList input[type="checkbox"]');
		checkboxes.forEach(checkbox => {
			checkbox.checked = true;
		});
		console.log(`已全選 ${checkboxes.length} 個 Facebook 社團`);
	}

	// 取消全選 Facebook 社團
	function deselectAllCommunities() {
		const checkboxes = document.querySelectorAll('#communitiesList input[type="checkbox"]');
		checkboxes.forEach(checkbox => {
			checkbox.checked = false;
		});
		console.log(`已取消全選 ${checkboxes.length} 個 Facebook 社團`);
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
					// 隱藏載入動畫，顯示圖片
					const loadingDiv = document.querySelector(`#preview_${index} .image-loading`);
					if (loadingDiv) {
						loadingDiv.style.display = 'none';
					}
					imgElement.style.display = 'block';
				}
			};
			reader.readAsDataURL(file);

			html += `
				<div class="image-preview-item" id="preview_${index}" data-file="${JSON.stringify({
					name: file.name,
					size: file.size,
					type: file.type,
					lastModified: file.lastModified
				})}">
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
			
			// 更新平台選項
			await checkAndHideLoggedInPlatforms();
		} catch (error) {
			console.error('載入帳號狀態失敗:', error);
			console.error('錯誤詳情:', error.message);
			accountsStatusDiv.innerHTML = '<p class="text-muted">載入帳號狀態失敗</p>';
		}
	}

	// 更新帳號列表表格
	async function updateAccountsTable(accounts) {
		console.log('更新帳號列表表格，帳號數量:', accounts.length);
		const accountsTableBody = document.querySelector('#tab-account-management .data-table tbody');
		if (!accountsTableBody) {
			console.log('找不到帳號表格主體元素');
			return;
		}

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

	// 載入社團列表
	async function loadCommunities() {
		const communitiesTableBody = document.getElementById('communitiesTableBody');
		if (!communitiesTableBody) {
			console.log('找不到社團表格主體元素');
			return;
		}

		try {
			console.log('開始載入社團列表...');
			const response = await fetch('/crawler/api/communities/');
			const result = await response.json();
			console.log('社團列表響應:', result);

			if (response.ok && result.success) {
				console.log(`找到 ${result.communities.length} 個社團`);
				if (result.communities.length === 0) {
					communitiesTableBody.innerHTML = `
						<tr class="no-data">
							<td colspan="6">
								<div class="empty-state">
									<i class="fab fa-facebook"></i>
									<p>尚未加入任何 Facebook 社團</p>
									<small>登入 Facebook 後將自動獲取您的社團列表</small>
								</div>
							</td>
						</tr>
					`;
				} else {
					let html = '';
					result.communities.forEach(community => {
						const platformName = getPlatformDisplayName(community.community_type);
						const memberCount = community.member_count || '未知';
						const statusText = community.is_active ? '啟用' : '停用';
						const statusClass = community.is_active ? 'status-active' : 'status-inactive';
						
						html += `
							<tr>
								<td>
									<div class="community-name">
										<strong>${community.name}</strong>
										${community.description ? `<br><small class="text-muted">${community.description}</small>` : ''}
									</div>
								</td>
								<td>
									<span class="platform-badge ${community.community_type}">
										<i class="fab fa-facebook"></i>
										${platformName}
									</span>
								</td>
								<td>
									<a href="${community.url}" target="_blank" class="community-link">
										<i class="fas fa-external-link-alt"></i> 查看
									</a>
								</td>
								<td>${memberCount}</td>
								<td>${new Date(community.created_at).toLocaleDateString()}</td>
								<td>
									<span class="status-badge ${statusClass}">
										${statusText}
									</span>
								</td>
							</tr>
						`;
					});
					communitiesTableBody.innerHTML = html;
				}
			} else {
				throw new Error(result.error || '載入社團列表失敗');
			}
		} catch (error) {
			console.error('載入社團列表失敗:', error);
			console.error('錯誤詳情:', error.message);
			communitiesTableBody.innerHTML = `
				<tr class="no-data">
					<td colspan="6">
						<div class="empty-state">
							<i class="fab fa-facebook"></i>
							<p>載入 Facebook 社團列表失敗</p>
							<small>${error.message}</small>
						</div>
					</td>
				</tr>
			`;
		}
	}

	// 重新整理社團列表
	async function refreshCommunities() {
		const refreshBtn = document.getElementById('refreshCommunitiesBtn');
		const originalText = refreshBtn.innerHTML;
		
		try {
			// 更新按鈕狀態
			refreshBtn.disabled = true;
			refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 重新整理中...';
			
			// 獲取 CSRF 令牌
			const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
			
			const response = await fetch('/crawler/api/communities/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
				},
				body: JSON.stringify({
					action: 'refresh'
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				showNotification(result.message, 'success');
				// 重新載入社團列表
				await loadCommunities();
			} else {
				throw new Error(result.error || '重新整理失敗');
			}
		} catch (error) {
			console.error('重新整理社團失敗:', error);
			showNotification('重新整理失敗：' + error.message, 'error');
		} finally {
			// 恢復按鈕狀態
			refreshBtn.disabled = false;
			refreshBtn.innerHTML = originalText;
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
		const facebookCommunitiesRow = document.getElementById('facebookCommunitiesRow');
		
		if (!postingPlatformSelect) return;

		try {
			const response = await fetch('/crawler/api/accounts/status/');
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
			
			// 檢查是否有 Facebook 帳號登入
			const hasFacebook = accounts.some(account => 
				account.website === 'facebook' && account.is_active
			);
			
			if (hasFacebook && facebookCommunitiesRow) {
				facebookCommunitiesRow.style.display = 'block';
				// 自動載入 Facebook 社團
				await loadFacebookCommunitiesFromDatabase();
			} else if (facebookCommunitiesRow) {
				facebookCommunitiesRow.style.display = 'none';
			}
		} catch (error) {
			console.error('更新發文平台選項失敗:', error);
		}
	}

	// 檢查並隱藏已登入的平台選項
	async function checkAndHideLoggedInPlatforms() {
		try {
			console.log('檢查已登入的平台...');
			const response = await fetch('/crawler/api/accounts/status/');
			const accounts = await response.json();
			console.log('已登入的帳號:', accounts);
			
			const platformSelect = document.querySelector('select[name="login_platform"]');
			if (!platformSelect) {
				console.log('找不到平台選擇元素');
				return;
			}
			
			accounts.forEach(account => {
				if (account.is_active) {
					const option = platformSelect.querySelector(`option[value="${account.website}"]`);
					if (option) {
						option.style.display = 'none';
						option.disabled = true;
						console.log(`隱藏平台選項: ${account.website}`);
					} else {
						console.log(`找不到平台選項: ${account.website}`);
					}
				}
			});
		} catch (error) {
			console.error('檢查已登入平台失敗:', error);
			console.error('錯誤詳情:', error.message);
		}
	}

	// 處理發文平台選擇變更
	function handlePostingPlatformChange() {
		const postingPlatformSelect = document.getElementById('postingPlatform');
		const facebookCommunitiesRow = document.getElementById('facebookCommunitiesRow');
		
		if (!postingPlatformSelect || !facebookCommunitiesRow) return;
		
		const selectedPlatform = postingPlatformSelect.value;
		
		if (selectedPlatform === 'facebook') {
			facebookCommunitiesRow.style.display = 'block';
			// 如果還沒有載入社團，則自動載入
			const communitiesList = document.getElementById('communitiesList');
			if (communitiesList && communitiesList.innerHTML.includes('請先登入 Facebook')) {
				loadFacebookCommunitiesFromDatabase();
			}
		} else {
			facebookCommunitiesRow.style.display = 'none';
		}
	}

	// 從資料庫載入已儲存的 Facebook 社團
	async function loadFacebookCommunitiesFromDatabase() {
		const communitiesList = document.getElementById('communitiesList');
		
		try {
			const response = await fetch('/crawler/api/communities/');
			const result = await response.json();
			
			if (response.ok && result.success) {
				const facebookCommunities = result.communities.filter(community => 
					community.community_type === 'facebook'
				);
				
				if (facebookCommunities.length > 0) {
					displayCommunities(facebookCommunities);
					console.log(`自動載入 ${facebookCommunities.length} 個 Facebook 社團`);
				} else {
					communitiesList.innerHTML = '<p class="text-muted">尚未獲取到 Facebook 社團，請點擊下方按鈕獲取</p>';
				}
			} else {
				communitiesList.innerHTML = '<p class="text-muted">載入社團列表失敗，請點擊下方按鈕重新獲取</p>';
			}
		} catch (error) {
			console.error('載入 Facebook 社團失敗:', error);
			communitiesList.innerHTML = '<p class="text-muted">載入社團列表失敗，請點擊下方按鈕重新獲取</p>';
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
				showNotification(`${getPlatformDisplayName(platform)} 帳號已刪除`, 'success');
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
			showNotification('刪除失敗：' + error.message, 'error');
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
						// 使用通用函數處理文字內容
						const finalContent = processTemplateContent(template.template);
						copyPreview.textContent = finalContent;
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
				if (facebookCommunitiesRow) {
					if (this.value === 'facebook') {
						// 顯示 Facebook 社團選項
						facebookCommunitiesRow.classList.remove('hidden');
						facebookCommunitiesRow.classList.add('visible');
						facebookCommunitiesRow.style.display = 'block';
					} else {
						// 隱藏 Facebook 社團選項
						facebookCommunitiesRow.classList.remove('visible');
						facebookCommunitiesRow.classList.add('hidden');
						// 延遲隱藏，讓過渡效果完成
						setTimeout(() => {
							if (!facebookCommunitiesRow.classList.contains('visible')) {
								facebookCommunitiesRow.style.display = 'none';
							}
						}, 300);
					}
				}
			});
			
			// 初始化時也要檢查一次
			const facebookCommunitiesRow = document.getElementById('facebookCommunitiesRow');
			if (facebookCommunitiesRow) {
				if (postingPlatformSelect.value === 'facebook') {
					facebookCommunitiesRow.classList.remove('hidden');
					facebookCommunitiesRow.classList.add('visible');
					facebookCommunitiesRow.style.display = 'block';
				} else {
					facebookCommunitiesRow.classList.remove('visible');
					facebookCommunitiesRow.classList.add('hidden');
					facebookCommunitiesRow.style.display = 'none';
				}
			}
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

	// 全局變量
	let templateImages = [];
	let draggedImageIndex = null;

	// 通用函數：清理文字並在第一個字元前加上換行符號
	function processTemplateContent(content) {
		if (!content) return '';
		
		// 清理文字前後的空白，保留中間的原始格式
		const cleanContent = content
			.replace(/^[\s\t\n\r]+/, '')     // 移除開頭的所有空白字符（包括製表符）
			.replace(/[\s\t\n\r]+$/, '')     // 移除結尾的所有空白字符（包括製表符）
			.trim();                          // 最後再次清理前後空白
		
		// 在第一個字元前加上換行符號
		return cleanContent ?  "\n" + cleanContent : cleanContent;
	}

	// 處理模板圖片上傳
	function handleTemplateImageUpload(e) {
		const files = Array.from(e.target.files);
		processImages(files);
	}

	// 處理拖拽相關事件
	function handleDragOver(e) {
		e.preventDefault();
		e.currentTarget.classList.add('dragover');
	}

	function handleDragLeave(e) {
		e.currentTarget.classList.remove('dragover');
	}

	function handleDrop(e) {
		e.preventDefault();
		e.currentTarget.classList.remove('dragover');
		const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
		processImages(files);
	}

	// 處理圖片
	function processImages(files) {
		files.forEach(file => {
			const reader = new FileReader();
			reader.onload = function(e) {
				templateImages.push({
					file: file,
					url: e.target.result,
					order: templateImages.length
				});
				updateImageSorting();
			};
			reader.readAsDataURL(file);
		});
	}

	// 更新圖片排序區域
	function updateImageSorting() {
		const container = document.getElementById('imageSortingContainer');
		const row = document.getElementById('imageSortingRow');
		
		if (templateImages.length > 0) {
			row.style.display = 'block';
			
			let html = '';
			templateImages.forEach((image, index) => {
				const isCopied = image.isCopied;
				const copyIndicator = isCopied ? '<div class="copy-indicator">複製</div>' : '';
				html += `
					<div class="sortable-image ${isCopied ? 'copied-image' : ''}" draggable="true" data-index="${index}">
						<img src="${image.url}" alt="模板圖片 ${index + 1}">
						<div class="image-order">${index + 1}</div>
						${copyIndicator}
						<div class="remove-image" onclick="removeImage(${index})">
							<i class="fas fa-times"></i>
						</div>
					</div>
				`;
			});
			container.innerHTML = html;
			
			// 添加拖拽事件
			const sortableImages = container.querySelectorAll('.sortable-image');
			sortableImages.forEach(image => {
				image.addEventListener('dragstart', handleImageDragStart);
				image.addEventListener('dragover', handleImageDragOver);
				image.addEventListener('drop', handleImageDrop);
				image.addEventListener('dragend', handleImageDragEnd);
			});
		} else {
			row.style.display = 'none';
		}
		
		// 檢查表單狀態並更新按鈕
		checkFormEmptyAndUpdateButtons();
	}

	// 圖片拖拽排序事件
	function handleImageDragStart(e) {
		draggedImageIndex = parseInt(e.currentTarget.dataset.index);
		e.currentTarget.classList.add('dragging');
	}

	function handleImageDragOver(e) {
		e.preventDefault();
	}

	function handleImageDrop(e) {
		e.preventDefault();
		const targetIndex = parseInt(e.currentTarget.dataset.index);
		
		if (draggedImageIndex !== null && draggedImageIndex !== targetIndex) {
			// 重新排序圖片
			const draggedImage = templateImages[draggedImageIndex];
			templateImages.splice(draggedImageIndex, 1);
			templateImages.splice(targetIndex, 0, draggedImage);
			
			// 更新順序
			templateImages.forEach((image, index) => {
				image.order = index;
			});
			
			updateImageSorting();
			
			// 檢查表單狀態並更新按鈕
			checkFormEmptyAndUpdateButtons();
		}
	}

	function handleImageDragEnd(e) {
		e.currentTarget.classList.remove('dragging');
		draggedImageIndex = null;
	}

	// 移除圖片
	function removeImage(index) {
		templateImages.splice(index, 1);
		templateImages.forEach((image, i) => {
			image.order = i;
		});
		updateImageSorting();
		
		// 檢查表單狀態並更新按鈕
		checkFormEmptyAndUpdateButtons();
	}

	// 儲存模板
	async function handleSaveTemplate() {
		const titleInput = document.querySelector('input[name="copy_title"]');
		const contentTextarea = document.querySelector('textarea[name="copy_template"]');
		const hashtagsInput = document.querySelector('input[name="hashtags"]');
		const saveBtn = document.getElementById('saveTemplateBtn');
		
		const title = titleInput.value.trim();
		const content = contentTextarea.value.trim();
		const hashtags = hashtagsInput.value.trim();
		
		if (!title || !content) {
			showNotification('請填寫模板標題和內容', 'warning');
			return;
		}
		
		const originalText = saveBtn.innerHTML;
		saveBtn.disabled = true;
		saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 儲存中...';
		
		try {
			const formData = new FormData();
			formData.append('title', title);
			formData.append('content', content);
			formData.append('hashtags', hashtags);
			
			// 檢查是否為編輯模式
			const isEditMode = saveBtn.dataset.editMode === 'true';
			const templateId = saveBtn.dataset.templateId;
			
			if (isEditMode && templateId) {
				// 在編輯模式下，先檢查模板是否仍然存在
				try {
					const checkResponse = await fetch(`/crawler/api/templates/?template_id=${templateId}`);
					const checkResult = await checkResponse.json();
					
					if (!checkResponse.ok || !checkResult.success) {
						// 模板不存在，重置為創建模式
						showNotification('原模板已被刪除，將創建新模板', 'warning');
						
						// 清空原本載入的圖片
						templateImages = [];
						updateImageSorting();
						
						// 重置儲存按鈕
						saveBtn.innerHTML = '<i class="fas fa-save"></i> 儲存模板';
						delete saveBtn.dataset.editMode;
						delete saveBtn.dataset.templateId;
						
						// 不添加 template_id，讓後端創建新模板
					} else {
						// 模板存在，繼續編輯模式
						formData.append('template_id', templateId);
					}
				} catch (error) {
					console.error('檢查模板狀態失敗:', error);
					// 檢查失敗時，重置為創建模式
					showNotification('無法檢查模板狀態，將創建新模板', 'warning');
					
					// 清空原本載入的圖片
					templateImages = [];
					updateImageSorting();
					
					// 重置儲存按鈕
					saveBtn.innerHTML = '<i class="fas fa-save"></i> 儲存模板';
					delete saveBtn.dataset.editMode;
					delete saveBtn.dataset.templateId;
				}
			}
			
			// 添加圖片和順序
			templateImages.forEach((image, index) => {
				// 如果是現有圖片，需要特殊處理
				if (image.isExisting) {
					// 對於現有圖片，我們需要標記它們
					formData.append('existing_images', image.originalId);
					formData.append('image_orders', image.order);
				} else if (image.isCopied) {
					// 如果是複製的圖片，跳過（因為沒有實際的File對象）
					// 用戶需要重新上傳圖片
					console.log('跳過複製的圖片，需要重新上傳:', image.originalUrl);
				} else {
					// 新上傳的圖片
					formData.append('images', image.file);
					formData.append('image_orders', image.order);
				}
			});
			
			// 獲取 CSRF 令牌
			const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
			
			const response = await fetch('/crawler/api/templates/', {
				method: 'POST',
				headers: {
					'X-CSRFToken': csrfToken,
				},
				body: formData
			});
			
			const result = await response.json();
			
			if (response.ok && result.success) {
				showNotification(result.message, 'success');
				
				// 清空表單
				titleInput.value = '';
				contentTextarea.value = '';
				hashtagsInput.value = '';
				templateImages = [];
				updateImageSorting();
				
				// 重置儲存按鈕
				saveBtn.innerHTML = '<i class="fas fa-save"></i> 儲存模板';
				delete saveBtn.dataset.editMode;
				delete saveBtn.dataset.templateId;
				
				// 重新載入模板列表
				await loadPostTemplates();
				
				// 檢查表單狀態並更新按鈕
				checkFormEmptyAndUpdateButtons();
			} else {
				throw new Error(result.error || '儲存失敗');
			}
		} catch (error) {
			console.error('儲存模板失敗:', error);
			showNotification('儲存失敗：' + error.message, 'error');
		} finally {
			saveBtn.disabled = false;
			saveBtn.innerHTML = originalText;
		}
	}

	// 預覽模板
	function handlePreviewTemplate() {
		const title = document.querySelector('input[name="copy_title"]').value.trim();
		const content = document.querySelector('textarea[name="copy_template"]').value.trim();
		const hashtags = document.querySelector('input[name="hashtags"]').value.trim();
		
		if (!title || !content) {
			showNotification('請填寫模板標題和內容才能預覽', 'warning');
			return;
		}
		
		// 創建預覽窗口
		let previewHtml = `
			<div style="max-width: 500px;">
				<h3 style="margin-bottom: 15px; color: #2d3748;">${title}</h3>
				<div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; white-space: pre-wrap; line-height: 1.6;">${content}</div>
		`;
		
		if (templateImages.length > 0) {
			previewHtml += `
				<div style="margin-bottom: 15px;">
					<strong style="color: #4a5568;">圖片 (${templateImages.length} 張)：</strong>
					<div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
			`;
			templateImages.forEach((image, index) => {
				previewHtml += `
					<div style="position: relative;">
						<img src="${image.url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid #e2e8f0;">
						<div style="position: absolute; top: -8px; left: -8px; background: #667eea; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8em; font-weight: bold;">${index + 1}</div>
					</div>
				`;
			});
			previewHtml += `</div></div>`;
		}
		
		if (hashtags) {
			previewHtml += `<div style="color: #667eea; font-size: 0.9em;"><strong>標籤：</strong> ${hashtags}</div>`;
		}
		
		previewHtml += `</div>`;
		
		// 顯示預覽（這裡可以用模態窗口或其他方式）
		const previewWindow = window.open('', '_blank', 'width=600,height=700,scrollbars=yes');
		previewWindow.document.write(`
			<html>
				<head>
					<title>模板預覽 - ${title}</title>
					<style>
						body { font-family: Arial, sans-serif; padding: 20px; background: #f7fafc; }
						.preview-container { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
					</style>
				</head>
				<body>
					<div class="preview-container">
						${previewHtml}
					</div>
				</body>
			</html>
		`);
	}

	// 載入貼文模板列表
	async function loadPostTemplates() {
		const templatesList = document.getElementById('templatesList');
		if (!templatesList) return;
		
		// 保存當前選中的標籤
		const hashtagFilter = document.getElementById('hashtagFilter');
		const currentSelectedHashtag = hashtagFilter ? hashtagFilter.value : 'all';
		
		try {
			const response = await fetch('/crawler/api/templates/');
			const result = await response.json();
			
			if (response.ok && result.success) {
				// 更新標籤篩選器選項
				updateHashtagFilterOptions(result.templates);
				
				// 恢復之前選中的標籤
				if (hashtagFilter && currentSelectedHashtag !== 'all') {
					hashtagFilter.value = currentSelectedHashtag;
					console.log('恢復選中的標籤:', currentSelectedHashtag);
				}
				
				// 應用當前篩選
				const filteredTemplates = filterTemplatesByHashtag(result.templates);
				
				if (filteredTemplates.length === 0) {
					templatesList.innerHTML = `
						<div class="empty-templates">
							<i class="fas fa-bookmark"></i>
							<p>沒有找到符合篩選條件的模板</p>
							<small>嘗試選擇其他標籤或清除篩選</small>
						</div>
					`;
				} else {
					let html = '';
					filteredTemplates.forEach(template => {
						const createdDate = new Date(template.created_at).toLocaleDateString();
						const imageCount = template.image_count;
						
						html += `
							<div class="template-card" data-template-id="${template.id}">
								<div class="template-card-header">
									<div>
										<h4 class="template-title">${template.title}</h4>
										<div class="template-meta">
											<span><i class="fas fa-calendar"></i> ${createdDate}</span>
											<span><i class="fas fa-images"></i> ${imageCount} 張圖片</span>
										</div>
									</div>
									<div class="template-actions">
										<button class="btn btn-sm btn-info" onclick="previewTemplate(${template.id})">
											<i class="fas fa-eye"></i> 預覽
										</button>
										<button class="btn btn-sm btn-success" onclick="copyTemplate(${template.id})">
											<i class="fas fa-copy"></i> 複製
										</button>
										<button class="btn btn-sm btn-warning" onclick="editTemplate(${template.id})">
											<i class="fas fa-edit"></i> 編輯
										</button>
										<button class="btn btn-sm btn-danger" onclick="deleteTemplate(${template.id})">
											<i class="fas fa-trash"></i> 刪除
										</button>
									</div>
								</div>
								<div class="template-content">${template.content.trim()}</div>
						`;
						
						if (template.images.length > 0) {
							html += `
								<div class="template-images">
							`;
							template.images.forEach(image => {
								html += `
									<div class="template-image-thumb">
										<img src="${image.url}" alt="模板圖片">
										<div class="thumb-order">${image.order + 1}</div>
									</div>
								`;
							});
							html += `</div>`;
						}
						
						if (template.hashtags) {
							html += `<div class="template-hashtags"><i class="fas fa-tags"></i> ${template.hashtags}</div>`;
						}
						
						html += `</div>`;
					});
					templatesList.innerHTML = html;
				}
			} else {
				throw new Error(result.error || '載入模板列表失敗');
			}
		} catch (error) {
			console.error('載入模板列表失敗:', error);
			templatesList.innerHTML = `
				<div class="empty-templates">
					<i class="fas fa-exclamation-triangle"></i>
					<p>載入模板列表失敗</p>
					<small>${error.message}</small>
				</div>
			`;
		}
	}

	// 更新標籤篩選器選項
	function updateHashtagFilterOptions(templates) {
		const hashtagFilter = document.getElementById('hashtagFilter');
		if (!hashtagFilter) {
			console.error('找不到標籤篩選器元素');
			return;
		}
		
		console.log('更新標籤篩選器選項，模板數量:', templates.length);
		
		// 收集所有標籤
		const allHashtags = new Set();
		templates.forEach((template, index) => {
			console.log(`模板 ${index}: hashtags = "${template.hashtags}"`);
			if (template.hashtags) {
				const hashtags = template.hashtags.split(',').map(tag => tag.trim()).filter(tag => tag);
				console.log(`  解析後的標籤:`, hashtags);
				hashtags.forEach(tag => allHashtags.add(tag));
			}
		});
		
		console.log('收集到的所有標籤:', Array.from(allHashtags));
		
		// 更新選項
		let options = '<option value="all">所有標籤</option>';
		Array.from(allHashtags).sort().forEach(hashtag => {
			options += `<option value="${hashtag}">${hashtag}</option>`;
		});
		
		hashtagFilter.innerHTML = options;
		console.log('標籤篩選器選項已更新');
		console.log('生成的HTML選項:', options);
		
		// 驗證選項是否正確設置
		console.log('選項數量:', hashtagFilter.options.length);
		for (let i = 0; i < hashtagFilter.options.length; i++) {
			const option = hashtagFilter.options[i];
			console.log(`選項 ${i}: value="${option.value}", text="${option.text}"`);
		}
	}

	// 根據標籤篩選模板
	function filterTemplatesByHashtag(templates) {
		const hashtagFilter = document.getElementById('hashtagFilter');
		if (!hashtagFilter) {
			console.error('找不到標籤篩選器元素');
			return templates;
		}
		
		const selectedHashtag = hashtagFilter.value;
		console.log('當前選中的標籤:', selectedHashtag);
		
		if (selectedHashtag === 'all') {
			console.log('選擇了"所有標籤"，返回所有模板');
			return templates;
		}
		
		const filteredTemplates = templates.filter(template => {
			if (!template.hashtags) {
				console.log(`模板 "${template.title}" 沒有標籤，過濾掉`);
				return false;
			}
			const hashtags = template.hashtags.split(',').map(tag => tag.trim());
			console.log(`模板 "${template.title}" 的標籤:`, hashtags);
			const isMatch = hashtags.includes(selectedHashtag);
			console.log(`標籤 "${selectedHashtag}" 匹配結果:`, isMatch);
			return isMatch;
		});
		
		console.log(`篩選結果: ${filteredTemplates.length} 個模板符合標籤 "${selectedHashtag}"`);
		return filteredTemplates;
	}

	// 處理標籤篩選器變更
	function handleHashtagFilter() {
		const hashtagFilter = document.getElementById('hashtagFilter');
		console.log('標籤篩選器變更事件觸發');
		console.log('當前選中的值:', hashtagFilter.value);
		console.log('當前選中的選項:', hashtagFilter.options[hashtagFilter.selectedIndex]?.text);
		loadPostTemplates();
	}

	// 更新文案模板選項
	async function updateCopyTemplateOptions() {
		const copyTemplateSelect = document.getElementById('copyTemplate');
		if (!copyTemplateSelect) return;
		
		try {
			const response = await fetch('/crawler/api/templates/');
			const result = await response.json();
			
			if (response.ok && result.success) {
				// 清空現有選項
				copyTemplateSelect.innerHTML = '<option value="">選擇要使用的文案模板</option>';
				
				// 添加模板選項
				result.templates.forEach(template => {
					const option = document.createElement('option');
					option.value = template.id;
					option.textContent = template.title;
					option.dataset.template = JSON.stringify(template);
					copyTemplateSelect.appendChild(option);
				});
				
				console.log(`已載入 ${result.templates.length} 個文案模板選項`);
			}
		} catch (error) {
			console.error('載入文案模板選項失敗:', error);
		}
	}

	// 處理文案模板選擇變更
	function handleCopyTemplateChange() {
		const copyTemplateSelect = document.getElementById('copyTemplate');
		const copyPreview = document.getElementById('copyPreview');
		
		if (!copyTemplateSelect || !copyPreview) return;
		
		const selectedTemplateId = copyTemplateSelect.value;
		if (!selectedTemplateId) {
			copyPreview.innerHTML = '<p class="text-muted">請先選擇文案模板</p>';
			return;
		}
		
		// 獲取選中的模板數據
		const selectedOption = copyTemplateSelect.options[copyTemplateSelect.selectedIndex];
		const template = JSON.parse(selectedOption.dataset.template);
		
		// 顯示模板預覽（只顯示內容和圖片，不顯示標題和圖片數量）
		// 使用通用函數處理文字內容
		const finalContent = processTemplateContent(template.content);
		let previewHTML = `
			<div class="template-preview">
				<div class="preview-content">
					${finalContent}
				</div>
		`;
		
		// 添加圖片預覽（不顯示標題和數量）
		if (template.images && template.images.length > 0) {
			previewHTML += `
				<div class="preview-images">
					<div class="preview-images-grid">
			`;
			
			template.images.forEach((image, index) => {
				previewHTML += `
					<div class="preview-image-item">
						<img src="${image.url}" alt="圖片 ${index + 1}" onerror="this.style.display='none'">
						<div class="preview-image-order">${index + 1}</div>
					</div>
				`;
			});
			
			previewHTML += `
					</div>
				</div>
			`;
		}
		
		previewHTML += '</div>';
		copyPreview.innerHTML = previewHTML;
	}

	// 預覽模板
	async function previewTemplate(templateId) {
		try {
			// 獲取模板詳細信息
			const response = await fetch(`/crawler/api/templates/?template_id=${templateId}`);
			const result = await response.json();
			
			if (response.ok && result.success) {
				const template = result.template;
				showTemplatePreview(template);
			} else {
				throw new Error(result.error || '載入模板失敗');
			}
		} catch (error) {
			console.error('預覽模板失敗:', error);
			showNotification('預覽失敗：' + error.message, 'error');
		}
	}

	// 顯示模板預覽
	function showTemplatePreview(template) {
		// 創建預覽模態窗口
		const modal = document.createElement('div');
		modal.className = 'template-preview-modal';
		modal.innerHTML = `
			<div class="template-preview-overlay">
				<div class="template-preview-content">
					<div class="template-preview-header">
						<h3><i class="fas fa-eye"></i> 模板預覽</h3>
						<button class="close-preview-btn" onclick="this.closest('.template-preview-modal').remove()">
							<i class="fas fa-times"></i>
						</button>
					</div>
					<div class="template-preview-body">
						<div class="preview-title">${template.title}</div>
						<div class="preview-content">${template.content.trim()}</div>
						${template.images && template.images.length > 0 ? `
							<div class="preview-images">
								<div class="preview-images-title">圖片預覽 (${template.images.length} 張)</div>
								<div class="preview-images-grid">
									${template.images.map((image, index) => `
										<div class="preview-image-item">
											<img src="${image.url}" alt="圖片 ${index + 1}">
											<div class="preview-image-order">${index + 1}</div>
										</div>
									`).join('')}
								</div>
							</div>
						` : ''}
						${template.hashtags ? `
							<div class="preview-hashtags">
								<i class="fas fa-tags"></i> ${template.hashtags}
							</div>
						` : ''}
					</div>
					<div class="template-preview-footer">
						<button class="btn btn-primary" onclick="useTemplateForPosting(${template.id})">
							<i class="fas fa-copy"></i> 使用此模板發文
						</button>
						<button class="btn btn-secondary" onclick="this.closest('.template-preview-modal').remove()">
							關閉
						</button>
					</div>
				</div>
			</div>
		`;
		
		document.body.appendChild(modal);
		
		// 點擊遮罩關閉
		modal.querySelector('.template-preview-overlay').addEventListener('click', function(e) {
			if (e.target === this) {
				modal.remove();
			}
		});
	}

	// 檢查表單是否為空並更新按鈕狀態
	function checkFormEmptyAndUpdateButtons() {
		const titleInput = document.querySelector('input[name="copy_title"]');
		const contentTextarea = document.querySelector('textarea[name="copy_template"]');
		const hashtagsInput = document.querySelector('input[name="hashtags"]');
		
		const isFormEmpty = (!titleInput || titleInput.value.trim() === '') &&
							(!contentTextarea || contentTextarea.value.trim() === '') &&
							(!hashtagsInput || hashtagsInput.value.trim() === '') &&
							templateImages.length === 0;
		
		// 獲取清空按鈕
		const clearBtn = document.getElementById('clearTemplateBtn');
		
		// 如果表單為空，重置為新建模式並隱藏清空按鈕
		if (isFormEmpty) {
			const saveBtn = document.getElementById('saveTemplateBtn');
			if (saveBtn) {
				saveBtn.innerHTML = '<i class="fas fa-save"></i> 儲存模板';
				delete saveBtn.dataset.editMode;
				delete saveBtn.dataset.templateId;
			}
			
			if (clearBtn) {
				clearBtn.style.display = 'none';
			}
		} else {
			// 如果表單有內容，顯示清空按鈕
			if (clearBtn) {
				clearBtn.style.display = 'inline-block';
			}
		}
	}

	// 清空模板
	function handleClearTemplate() {
		if (confirm('確定要清空所有內容嗎？此操作無法復原。')) {
			// 清空標題
			const titleInput = document.querySelector('input[name="copy_title"]');
			if (titleInput) {
				titleInput.value = '';
			}
			
			// 清空內容
			const contentTextarea = document.querySelector('textarea[name="copy_template"]');
			if (contentTextarea) {
				contentTextarea.value = '';
			}
			
			// 清空標籤
			const hashtagsInput = document.querySelector('input[name="hashtags"]');
			if (hashtagsInput) {
				hashtagsInput.value = '';
			}
			
			// 清空圖片
			templateImages = [];
			updateImageSorting();
			
			// 重置儲存按鈕狀態
			const saveBtn = document.getElementById('saveTemplateBtn');
			if (saveBtn) {
				saveBtn.innerHTML = '<i class="fas fa-save"></i> 儲存模板';
				delete saveBtn.dataset.editMode;
				delete saveBtn.dataset.templateId;
			}
			
			// 隱藏清空模板按鈕
			const clearBtn = document.getElementById('clearTemplateBtn');
			if (clearBtn) {
				clearBtn.style.display = 'none';
			}
			
			// 檢查表單是否為空，如果是則重置按鈕狀態
			checkFormEmptyAndUpdateButtons();
			
			showNotification('模板內容已清空', 'success');
		}
	}

	// 使用模板發文
	function useTemplateForPosting(templateId) {
		// 關閉預覽窗口
		document.querySelector('.template-preview-modal').remove();
		
		// 切換到發文設定標籤
		const postingTab = document.querySelector('[data-tab="posting"]');
		if (postingTab) {
			postingTab.click();
		}
		
		showNotification('已切換到發文設定，請選擇發文平台', 'info');
	}

	// 複製模板
	async function copyTemplate(templateId) {
		try {
			// 顯示複製中狀態
			showNotification('正在複製模板...', 'info');
			
			// 獲取模板詳情
			const response = await fetch(`/crawler/api/templates/?template_id=${templateId}`);
			const result = await response.json();
			
			if (response.ok && result.success) {
				const template = result.template;
				
				// 準備複製的數據
				const formData = new FormData();
				formData.append('title', `${template.title}(2)`);
				// 徹底清理所有類型的空白字符（包括製表符、空格、換行等）
				// 使用通用函數處理文字內容
				const finalContent = processTemplateContent(template.content);
				formData.append('content', finalContent);
				formData.append('hashtags', template.hashtags || '');
				
				// 複製圖片（只複製圖片URL，不複製實際文件）
				if (template.images && template.images.length > 0) {
					template.images.forEach((image, index) => {
						// 將圖片URL保存到資料庫，這樣可以顯示圖片
						// 但不會佔用額外的存儲空間
						formData.append('image_urls', image.url);
						formData.append('image_orders', index);
					});
				}
				
				// 獲取 CSRF 令牌
				const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
				
				// 發送複製請求
				const copyResponse = await fetch('/crawler/api/templates/', {
					method: 'POST',
					headers: {
						'X-CSRFToken': csrfToken,
					},
					body: formData
				});
				
				const copyResult = await copyResponse.json();
				
				if (copyResponse.ok && copyResult.success) {
					showNotification('模板複製成功！', 'success');
					
					// 重新載入模板列表以顯示新複製的模板
					await loadPostTemplates();
					
					// 滾動到新複製的模板位置
					setTimeout(() => {
						const newTemplateCard = document.querySelector(`[data-template-id="${copyResult.template_id}"]`);
						if (newTemplateCard) {
							newTemplateCard.scrollIntoView({ 
								behavior: 'smooth', 
								block: 'center' 
							});
							// 添加高亮效果
							newTemplateCard.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';
							setTimeout(() => {
								newTemplateCard.style.boxShadow = '';
							}, 2000);
						}
					}, 500);
				} else {
					throw new Error(copyResult.error || '複製失敗');
				}
			} else {
				throw new Error(result.error || '獲取模板失敗');
			}
		} catch (error) {
			console.error('複製模板失敗:', error);
			showNotification('複製失敗：' + error.message, 'error');
		}
	}

	// 編輯模板
	async function editTemplate(templateId) {
		try {
			// 獲取模板詳細信息
			const response = await fetch(`/crawler/api/templates/?template_id=${templateId}`);
			const result = await response.json();
			
			if (response.ok && result.success) {
				const template = result.template;
				
				// 將內容填入表單頂部
				fillTemplateForm(template);
				
				// 滾動到最上面的"文案標題"
				const titleInput = document.querySelector('input[name="copy_title"]');
				if (titleInput) {
					titleInput.scrollIntoView({ 
						behavior: 'smooth', 
						block: 'start' 
					});
					// 聚焦到標題輸入框
					titleInput.focus();
				}
				
				showNotification('模板已載入到編輯表單，請修改後點擊儲存模板', 'info');
			} else {
				throw new Error(result.error || '載入模板失敗');
			}
		} catch (error) {
			console.error('載入模板失敗:', error);
			showNotification('載入模板失敗：' + error.message, 'error');
		}
	}

	// 填充模板表單
	async function fillTemplateForm(template) {
		// 填充標題
		const titleInput = document.querySelector('input[name="copy_title"]');
		if (titleInput) {
			titleInput.value = template.title;
		}
		
		// 填充內容
		const contentTextarea = document.querySelector('textarea[name="copy_template"]');
		if (contentTextarea) {
			// 徹底清理所有類型的空白字符（包括製表符、空格、換行等）
			// 使用通用函數處理文字內容
			const finalContent = processTemplateContent(template.content);
			contentTextarea.value = finalContent;
		}
		
		// 填充標籤
		const hashtagsInput = document.querySelector('input[name="hashtags"]');
		if (hashtagsInput) {
			hashtagsInput.value = template.hashtags || '';
		}
		
		// 處理圖片 - 載入現有圖片並支援排序
		templateImages = [];
		if (template.images && template.images.length > 0) {
			// 將現有圖片載入到編輯表單中
			for (let i = 0; i < template.images.length; i++) {
				const image = template.images[i];
				// 創建一個模擬的 File 對象，包含必要的屬性
				const mockFile = {
					name: `image_${i + 1}.jpg`,
					type: 'image/jpeg',
					size: 0,
					lastModified: Date.now()
				};
				
				templateImages.push({
					file: mockFile,
					url: image.url,
					order: image.order,
					isExisting: true, // 標記為現有圖片
					originalId: image.id
				});
			}
			showNotification(`已載入 ${template.images.length} 張圖片，您可以重新排序或替換`, 'info');
		}
		
		// 更新圖片排序區域
		updateImageSorting();
		
		// 修改儲存按鈕為更新模式
		const saveBtn = document.getElementById('saveTemplateBtn');
		if (saveBtn) {
			saveBtn.innerHTML = '<i class="fas fa-save"></i> 更新模板';
			saveBtn.dataset.editMode = 'true';
			saveBtn.dataset.templateId = template.id;
		}

		// 顯示清空模板按鈕
		const clearBtn = document.getElementById('clearTemplateBtn');
		if (clearBtn) {
			clearBtn.style.display = 'inline-block';
		}
	}

	// 刪除模板
	async function deleteTemplate(templateId) {
		if (!confirm('確定要刪除這個模板嗎？此操作無法復原。')) {
			return;
		}
		
		try {
			const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
			
			const response = await fetch('/crawler/api/templates/', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csrfToken,
				},
				body: JSON.stringify({
					template_id: templateId
				})
			});
			
			const result = await response.json();
			
			if (response.ok && result.success) {
				showNotification(result.message, 'success');
				await loadPostTemplates();
			} else {
				throw new Error(result.error || '刪除失敗');
			}
		} catch (error) {
			console.error('刪除模板失敗:', error);
			showNotification('刪除失敗：' + error.message, 'error');
		}
	}

	// 導出全局函數供HTML使用
	window.showNotification = showNotification;
	window.toggleSidebar = toggleSidebar;
	window.deleteAccount = deleteAccount;
	window.removeImage = removeImage;
	window.previewTemplate = previewTemplate;
	window.copyTemplate = copyTemplate;
	window.editTemplate = editTemplate;
	window.deleteTemplate = deleteTemplate;
	window.useTemplateForPosting = useTemplateForPosting;
	window.handleClearTemplate = handleClearTemplate;
});


