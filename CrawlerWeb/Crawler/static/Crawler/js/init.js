// init.js - 爬蟲工具初始化

// 爬蟲工具功能初始化
function initCrawlerTools() {
	// 帳號登入表單處理
	const accountLoginForm = document.getElementById('accountLoginForm');
	if (accountLoginForm) {
		accountLoginForm.addEventListener('submit', window.handleAccountLogin);
	}

	// 文案設定表單處理
	const copyForm = document.querySelector('#tab-copy form');
	if (copyForm) {
		copyForm.addEventListener('submit', window.handleCopySave);
	}

	// 發文設定表單處理
	const postingForm = document.getElementById('postingForm');
	if (postingForm) {
		postingForm.addEventListener('submit', window.handlePosting);
	}

	// 獲取社團列表按鈕
	const getCommunitiesBtn = document.getElementById('getCommunitiesBtn');
	if (getCommunitiesBtn) {
		getCommunitiesBtn.addEventListener('click', window.getFacebookCommunities);
	}

	// 圖片上傳處理
	const postingImageUpload = document.getElementById('postingImageUpload');
	if (postingImageUpload) {
		postingImageUpload.addEventListener('change', window.handleImageUpload);
	}

	// 重新整理社團按鈕
	const refreshCommunitiesBtn = document.getElementById('refreshCommunitiesBtn');
	if (refreshCommunitiesBtn) {
		refreshCommunitiesBtn.addEventListener('click', window.refreshCommunities);
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
		hashtagFilter.addEventListener('change', window.handleHashtagFilter);
	} else {
		console.error('找不到標籤篩選器元素');
	}

	// 文案模板選擇器
	const copyTemplateSelect = document.getElementById('templateSelect');
	if (copyTemplateSelect) {
		console.log('文案模板選擇器元素找到，綁定事件監聽器');
		copyTemplateSelect.addEventListener('change', window.handleCopyTemplateChange);
	} else {
		console.error('找不到文案模板選擇器元素');
	}

	// 發文平台選擇器
	const postingPlatformSelect = document.getElementById('platformSelect');
	if (postingPlatformSelect) {
		console.log('發文平台選擇器元素找到，綁定事件監聽器');
		postingPlatformSelect.addEventListener('change', window.handlePostingPlatformChange);
	} else {
		console.error('找不到發文平台選擇器元素');
	}
	
	// 初始化平台和模板選項
	setTimeout(async () => {
		console.log('開始初始化平台和模板選項...');
		await window.updatePostingPlatforms();
		await window.updateCopyTemplateOptions();
		console.log('平台和模板選項初始化完成');
	}, 500);
	
	// 初始化第一步驟驗證
	setTimeout(() => {
		if (typeof window.validateStep1 === 'function') {
			window.validateStep1();
		}
	}, 600);
	
	// 為相關元素添加事件監聽器
	const platformSelect = document.getElementById('platformSelect');
	if (platformSelect) {
		platformSelect.addEventListener('change', function() {
			// 根據平台選擇顯示/隱藏社團選擇
			const facebookCommunitiesRow = document.getElementById('facebookCommunitiesRow');
			if (facebookCommunitiesRow) {
				if (this.value === 'facebook') {
					facebookCommunitiesRow.style.display = 'block';
				} else {
					facebookCommunitiesRow.style.display = 'none';
				}
			}
			
			if (typeof window.validateStep1 === 'function') {
				window.validateStep1();
			}
		});
	}
	
	const templateSelect = document.getElementById('templateSelect');
	if (templateSelect) {
		templateSelect.addEventListener('change', function() {
			// 當選擇模板時，自動填充發文內容並更新預覽
			if (this.value) {
				// 觸發模板變更處理
				window.handleCopyTemplateChange();
			}
			if (typeof window.validateStep1 === 'function') {
				window.validateStep1();
			}
		});
	}
	
	const messageTextarea = document.getElementById('messageTextarea');
	if (messageTextarea) {
		messageTextarea.addEventListener('input', function() {
			if (typeof window.validateStep1 === 'function') {
				window.validateStep1();
			}
			// 添加文案預覽即時更新
			updateCopyPreview();
		});
	}

	// 為表單輸入框添加事件監聽器，檢查內容變化
	window.bindFormInputListeners();

	// 初始化頁面數據
	(async () => {
		await window.loadAccountsStatus();
		await window.loadCommunities();
		await window.loadCopyTemplates();
		await window.loadPostTemplates();
		await window.updatePostingPlatforms(); // 這會自動檢查Facebook登入狀態並載入社團
		await window.updateCopyTemplateOptions(); // 更新文案模板選項
	})();
	
	// 檢查並隱藏已登入的平台選項
	setTimeout(async () => {
		await window.checkAndHideLoggedInPlatforms();
	}, 1000); // 延遲1秒執行，確保其他數據已載入
	
	// 綁定事件監聽器
	bindEventListeners();
}

// 即時更新文案預覽
function updateCopyPreview() {
	const messageTextarea = document.getElementById('messageTextarea');
	const copyPreview = document.getElementById('copyPreview');
	
	if (!messageTextarea || !copyPreview) {
		return;
	}
	
	const content = messageTextarea.value.trim();
	
	if (content) {
		// 處理內容並顯示預覽
		const processedContent = window.processTemplateContent(content);
		copyPreview.innerHTML = `
			<div class="template-preview">
				<div class="preview-content">
					${processedContent}
				</div>
			</div>
		`;
		copyPreview.classList.add('preview-active');
	} else {
		copyPreview.innerHTML = '<p class="text-muted">請先選擇文案模板</p>';
		copyPreview.classList.remove('preview-active');
	}
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
					const finalContent = window.processTemplateContent(template.template);
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
		});
	}
}

// 導出全局函數
window.initCrawlerTools = initCrawlerTools;
window.updateCopyPreview = updateCopyPreview;
