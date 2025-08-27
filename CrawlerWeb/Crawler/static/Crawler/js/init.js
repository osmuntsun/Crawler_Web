// init.js - 爬蟲工具初始化

// 爬蟲工具功能初始化
function initCrawlerTools() {
	// 帳號登入表單處理 - 現在由 ajax_navigation.js 統一管理
	// const accountLoginForm = document.getElementById('accountLoginForm');
	// if (accountLoginForm) {
	// 	accountLoginForm.addEventListener('submit', window.handleAccountLogin);
	// }

	// 文案設定表單處理 - 現在由 ajax_navigation.js 統一管理
	// const copyForm = document.querySelector('#tab-copy form');
	// if (copyForm) {
	// 	copyForm.addEventListener('submit', window.handleCopySave);
	// }

	// 發文設定表單處理 - 現在由 ajax_navigation.js 統一管理
	// const postingForm = document.getElementById('postingForm');
	// if (postingForm) {
	// 	postingForm.addEventListener('submit', window.handlePosting);
	// }

	// 獲取社團列表按鈕 - 現在由 ajax_navigation.js 統一管理
	// const getCommunitiesBtn = document.getElementById('getCommunitiesBtn');
	// if (getCommunitiesBtn) {
	// 	getCommunitiesBtn.addEventListener('click', window.getFacebookCommunities);
	// }

	// 圖片上傳處理 - 現在由 ajax_navigation.js 統一管理
	// const postingImageUpload = document.getElementById('postingImageUpload');
	// if (postingImageUpload) {
	// 	postingImageUpload.addEventListener('change', window.handleImageUpload);
	// }

	// 重新整理社團按鈕 - 現在由 ajax_navigation.js 統一管理
	// const refreshCommunitiesBtn = document.getElementById('refreshCommunitiesBtn');
	// if (refreshCommunitiesBtn) {
	// 	refreshCommunitiesBtn.addEventListener('click', window.refreshCommunities);
	// }

	// 模板圖片上傳 - 現在由 ajax_navigation.js 統一管理
	// const templateImageUpload = document.getElementById('templateImageUpload');
	// const imageUploadArea = document.getElementById('imageUploadArea');
	// if (templateImageUpload && imageUploadArea) {
	// 	templateImageUpload.addEventListener('change', window.handleTemplateImageUpload);
	// 	
	// 	// 拖拽上傳
	// 	imageUploadArea.addEventListener('dragover', window.handleDragOver);
	// 	imageUploadArea.addEventListener('dragleave', window.handleDragLeave);
	// 	imageUploadArea.addEventListener('drop', window.handleDrop);
	// }

	// 儲存模板按鈕 - 現在由 ajax_navigation.js 統一管理
	// const saveTemplateBtn = document.getElementById('saveTemplateBtn');
	// if (saveTemplateBtn) {
	// 	saveTemplateBtn.addEventListener('click', handleSaveTemplate);
	// }

	// 預覽模板按鈕 - 現在由 ajax_navigation.js 統一管理
	// const previewTemplateBtn = document.getElementById('previewTemplateBtn');
	// if (previewTemplateBtn) {
	// 	previewTemplateBtn.addEventListener('click', handlePreviewTemplate);
	// }

	// 清空模板按鈕 - 現在由 ajax_navigation.js 統一管理
	// const clearTemplateBtn = document.getElementById('clearTemplateBtn');
	// if (clearTemplateBtn) {
	// 	clearTemplateBtn.addEventListener('click', handleClearTemplate);
	// }

	// 標籤篩選器 - 現在由 ajax_navigation.js 統一管理
	// const hashtagFilter = document.getElementById('hashtagFilter');
	// if (hashtagFilter) {
	// 	console.log('標籤篩選器元素找到，綁定事件監聽器');
	// 	hashtagFilter.addEventListener('change', window.handleHashtagFilter);
	// } else {
	// 	console.log('標籤篩選器元素不存在，跳過綁定');
	// }

	// 文案模板選擇器 - 現在由 ajax_navigation.js 統一管理
	// const copyTemplateSelect = document.getElementById('templateSelect');
	// if (copyTemplateSelect) {
	// 	console.log('文案模板選擇器元素找到，綁定事件監聽器');
	// 	copyTemplateSelect.addEventListener('change', window.handleCopyTemplateChange);
	// 	if (copyTemplateSelect) {
	// 		console.log('文案模板選擇器元素找到，綁定事件監聽器');
	// 		copyTemplateSelect.addEventListener('change', window.handleCopyTemplateChange);
	// 	} else {
	// 		console.log('文案模板選擇器元素不存在，跳過綁定');
	// 	}
	// }

	// 發文平台選擇器 - 現在由 ajax_navigation.js 統一管理
	// const postingPlatformSelect = document.getElementById('platformSelect');
	// if (postingPlatformBtn) {
	// 	console.log('發文平台選擇器元素找到，綁定事件監聽器');
	// 	postingPlatformSelect.addEventListener('change', window.handlePostingPlatformChange);
	// } else {
	// 	console.log('發文平台選擇器元素不存在，跳過綁定');
	// }
	
	// 初始化平台和模板選項（只在相關元素存在時執行）
	setTimeout(async () => {
		console.log('檢查是否需要初始化平台和模板選項...');
		const platformSelect = document.getElementById('platformSelect');
		const templateSelect = document.getElementById('templateSelect');
		
		if (platformSelect && templateSelect) {
			console.log('開始初始化平台和模板選項...');
			await window.updatePostingPlatforms();
			await window.updateCopyTemplateOptions();
			console.log('平台和模板選項初始化完成');
		} else {
			console.log('平台或模板選擇器不存在，跳過初始化');
		}
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
	
	// 移除 messageTextarea 相關的事件監聽器，因為元素已不存在
	
	// 為表單輸入框添加事件監聽器，檢查內容變化
	window.bindFormInputListeners();

	// 初始化頁面數據（只在相關元素存在時執行）
	(async () => {
		console.log('檢查是否需要初始化頁面數據...');
		const platformSelect = document.getElementById('platformSelect');
		const templateSelect = document.getElementById('templateSelect');
		
		if (platformSelect && templateSelect) {
			console.log('開始初始化頁面數據...');
			await window.loadAccountsStatus();
			await window.loadCommunities();
			await window.loadCopyTemplates();
			await window.loadPostTemplates();
			await window.updatePostingPlatforms(); // 這會自動檢查Facebook登入狀態並載入社團
			await window.updateCopyTemplateOptions(); // 更新文案模板選項
			console.log('頁面數據初始化完成');
		} else {
			console.log('平台或模板選擇器不存在，跳過頁面數據初始化');
		}
	})();
	
	// 檢查並隱藏已登入的平台選項（只在相關元素存在時執行）
	setTimeout(async () => {
		console.log('延遲1秒後檢查是否需要檢查已登入的平台...');
		const platformSelect = document.getElementById('platformSelect');
		if (platformSelect) {
			console.log('開始檢查已登入的平台...');
			await window.checkAndHideLoggedInPlatforms();
		} else {
			console.log('平台選擇器不存在，跳過檢查已登入平台');
		}
	}, 1000); // 延遲1秒執行，確保其他數據已載入
	
	// 再次檢查（以防第一次失敗）
	setTimeout(async () => {
		console.log('延遲3秒後再次檢查是否需要檢查已登入的平台...');
		const platformSelect = document.getElementById('platformSelect');
		if (platformSelect) {
			console.log('再次檢查已登入的平台...');
			await window.checkAndHideLoggedInPlatforms();
		} else {
			console.log('平台選擇器不存在，跳過再次檢查已登入平台');
		}
	}, 3000);
	
	// 綁定事件監聽器
	bindEventListeners();
}

// 即時更新文案預覽
function updateCopyPreview() {
	// 由於 messageTextarea 已移除，這個函數暫時不需要
	// 文案預覽現在由模板選擇器直接觸發
	console.log('updateCopyPreview: messageTextarea 已移除，函數暫時不需要');
}

// 綁定事件監聽器
function bindEventListeners() {
	// 文案模板選擇變化時更新預覽
	const copyTemplateSelect = document.getElementById('templateSelect');
	if (copyTemplateSelect) {
		copyTemplateSelect.addEventListener('change', function() {
			const copyPreview = document.getElementById('copyPreview');
			if (this.value) {
				// 從後端獲取模板詳細信息
				fetch(`/crawler/api/templates/${this.value}/`)
					.then(response => response.json())
					.then(template => {
						if (template.success) {
							// 創建預覽內容（不包含標籤和標題）
							let previewContent = `
								<div class="template-preview">
									<div class="preview-content">
										<div class="content-text">${template.template.content.replace(/\n/g, '<br>')}</div>
									</div>
							`;
							
							// 如果有圖片，顯示圖片預覽
							if (template.template.images && template.template.images.length > 0) {
								previewContent += `
									<div class="preview-images-grid">
								`;
								
								template.template.images.forEach((image, index) => {
									const imageUrl = image.url || image.alt_text || '';
									if (imageUrl) {
										previewContent += `
											<div class="preview-image-item">
												<img src="${imageUrl}" alt="預覽圖片 ${index + 1}">
												<div class="preview-image-order">${index + 1}</div>
											</div>
										`;
									}
								});
								
								previewContent += `
									</div>
								`;
							}
							
							previewContent += `
								</div>
							`;
							
							// 顯示預覽內容
							copyPreview.innerHTML = previewContent;
							copyPreview.classList.add('preview-active');
						} else {
							copyPreview.innerHTML = '<p class="text-muted">載入模板失敗</p>';
							copyPreview.classList.remove('preview-active');
						}
					})
					.catch(error => {
						console.error('載入模板失敗:', error);
						copyPreview.innerHTML = '<p class="text-muted">載入模板失敗</p>';
						copyPreview.classList.remove('preview-active');
					});
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

// 立即導出到全局，確保其他模組可以使用
window.initCrawlerTools = initCrawlerTools;
window.updateCopyPreview = updateCopyPreview;
