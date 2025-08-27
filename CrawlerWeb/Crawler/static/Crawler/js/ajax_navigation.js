/**
 * AJAX 導航系統
 * 處理側邊欄按鈕點擊和內容載入
 */

class AjaxNavigation {
	constructor() {
		this.currentTab = 'account';
		this.init();
	}

	init() {
		this.bindEvents();
		this.loadInitialContent();
	}

	bindEvents() {
		// 綁定側邊欄按鈕點擊事件
		document.addEventListener('click', (e) => {
			if (e.target.closest('.sidebar-item')) {
				const sidebarItem = e.target.closest('.sidebar-item');
				const tab = sidebarItem.getAttribute('data-tab');
				this.switchTab(tab);
			}
		});

		// 綁定瀏覽器前進/後退按鈕
		window.addEventListener('popstate', (e) => {
			if (e.state && e.state.tab) {
				this.switchTab(e.state.tab, false);
			}
		});
	}

	/**
	 * 切換標籤頁
	 */
	switchTab(tab, updateHistory = true) {
		if (tab === this.currentTab) return;

		// 更新側邊欄狀態
		this.updateSidebarState(tab);
		this.currentTab = tab;

		// 更新瀏覽器歷史
		if (updateHistory) {
			const url = `/crawler/${tab}/`;
			window.history.pushState({ tab }, '', url);
		}

		// 載入對應的內容
		this.loadTabContent(tab);
	}

	/**
	 * 更新側邊欄狀態
	 */
	updateSidebarState(activeTab) {
		// 移除所有活動狀態
		document.querySelectorAll('.sidebar-item').forEach(item => {
			item.classList.remove('active');
		});

		// 設置當前活動狀態
		const activeItem = document.querySelector(`[data-tab="${activeTab}"]`);
		if (activeItem) {
			activeItem.classList.add('active');
		}
	}

	/**
	 * 載入標籤頁內容
	 */
	async loadTabContent(tab) {
		try {
			// 顯示載入中狀態
			this.showLoading();

			// 根據標籤頁載入對應的內容
			let content = '';
			switch (tab) {
				case 'account':
					content = await this.loadAccountContent();
					break;
				case 'account-management':
					content = await this.loadAccountManagementContent();
					break;
				case 'copy':
					content = await this.loadCopyContent();
					break;
				case 'post':
					content = await this.loadPostContent();
					break;
				case 'schedule':
					content = await this.loadScheduleContent();
					break;
				case 'auto-feed':
					content = await this.loadAutoFeedContent();
					break;
				case 'group-sale':
					content = await this.loadGroupSaleContent();
					break;
				default:
					content = '<div class="error-message">頁面不存在</div>';
			}

			// 更新主要內容區域
			this.updateMainContent(content);

		} catch (error) {
			console.error('載入內容失敗:', error);
			this.showErrorMessage('載入頁面失敗，請重新整理頁面');
		}
	}

	/**
	 * 載入帳號設定內容
	 */
	async loadAccountContent() {
		const response = await fetch('/crawler/account/', {
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			}
		});
		if (response.ok) {
			return await response.text();
		}
		throw new Error('載入帳號設定失敗');
	}

	/**
	 * 載入帳號管理內容
	 */
	async loadAccountManagementContent() {
		const response = await fetch('/crawler/account-management/', {
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			}
		});
		if (response.ok) {
			return await response.text();
		}
		throw new Error('載入帳號管理失敗');
	}

	/**
	 * 載入文案設定內容
	 */
	async loadCopyContent() {
		const response = await fetch('/crawler/copy/', {
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			}
		});
		if (response.ok) {
			return await response.text();
		}
		throw new Error('載入文案設定失敗');
	}

	/**
	 * 載入發文設定內容
	 */
	async loadPostContent() {
		const response = await fetch('/crawler/post/', {
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			}
		});
		if (response.ok) {
			return await response.text();
		}
		throw new Error('載入發文設定失敗');
	}

	/**
	 * 載入排程設定內容
	 */
	async loadScheduleContent() {
		const response = await fetch('/crawler/schedule/', {
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			}
		});
		if (response.ok) {
			return await response.text();
		}
		throw new Error('載入排程設定失敗');
	}

	/**
	 * 載入自動養號內容
	 */
	async loadAutoFeedContent() {
		const response = await fetch('/crawler/auto-feed/', {
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			}
		});
		if (response.ok) {
			return await response.text();
		}
		throw new Error('載入自動養號失敗');
	}

	/**
	 * 載入社團拍賣商品內容
	 */
	async loadGroupSaleContent() {
		const response = await fetch('/crawler/group-sale/', {
			headers: {
				'X-Requested-With': 'XMLHttpRequest'
			}
		});
		if (response.ok) {
			return await response.text();
		}
		throw new Error('載入社團拍賣商品失敗');
	}

	/**
	 * 顯示載入中狀態
	 */
	showLoading() {
		const mainContent = document.getElementById('main-content') || document.querySelector('.content');
		if (mainContent) {
			mainContent.innerHTML = `
				<div class="loading-placeholder">
					<div class="loading-content">
						<i class="fas fa-spinner fa-spin"></i>
						<p>載入中...</p>
					</div>
				</div>
			`;
		}
	}

	/**
	 * 更新主要內容區域
	 */
	updateMainContent(content) {
		const mainContent = document.getElementById('main-content') || document.querySelector('.content');
		if (mainContent) {
			mainContent.innerHTML = content;
			
			// 重新綁定事件（因為內容是動態載入的）
			this.rebindEvents();
		}
	}

	/**
	 * 重新綁定事件
	 */
	rebindEvents() {
		console.log('重新綁定事件');
		
		// 根據當前頁面重新綁定對應的事件
		switch (this.currentTab) {
			case 'account':
				this.rebindAccountEvents();
				break;
			case 'account-management':
				this.rebindAccountManagementEvents();
				break;
			case 'copy':
				this.rebindCopyEvents();
				break;
			case 'post':
				this.rebindPostEvents();
				break;
			case 'schedule':
				this.rebindScheduleEvents();
				break;
			case 'auto-feed':
				this.rebindAutoFeedEvents();
				break;
			case 'group-sale':
				this.rebindGroupSaleEvents();
				break;
		}
	}

	/**
	 * 重新綁定帳號設定頁面事件
	 */
	rebindAccountEvents() {
		// 帳號登入表單處理
		const accountLoginForm = document.getElementById('accountLoginForm');
		if (accountLoginForm) {
			accountLoginForm.addEventListener('submit', window.handleAccountLogin);
		}

		// 檢查並隱藏已登入的平台選項
		if (window.checkAndHideLoggedInPlatforms) {
			window.checkAndHideLoggedInPlatforms();
		}
	}

	/**
	 * 重新綁定帳號管理頁面事件
	 */
	rebindAccountManagementEvents() {
		console.log('rebindAccountManagementEvents 被調用');
		
		// 載入帳號狀態
		if (window.loadAccountsStatus) {
			console.log('調用 window.loadAccountsStatus');
			window.loadAccountsStatus();
		} else {
			console.log('window.loadAccountsStatus 不存在');
		}

		// 載入社團列表
		if (window.loadCommunities) {
			console.log('調用 window.loadCommunities');
			window.loadCommunities();
		} else {
			console.log('window.loadCommunities 不存在');
		}

		// 重新整理社團按鈕
		const refreshCommunitiesBtn = document.getElementById('refreshCommunitiesBtn');
		if (refreshCommunitiesBtn) {
			refreshCommunitiesBtn.addEventListener('click', window.refreshCommunities);
		}
	}

	/**
	 * 重新綁定文案設定頁面事件
	 */
	rebindCopyEvents() {
		// 載入已儲存的模板列表
		if (window.loadTemplates) {
			window.loadTemplates();
		}

		// 文案設定表單處理
		const copyForm = document.querySelector('form');
		if (copyForm) {
			copyForm.addEventListener('submit', window.handleCopySave);
		}

		// 模板圖片上傳
		const templateImageUpload = document.getElementById('templateImageUpload');
		const imageUploadArea = document.getElementById('imageUploadArea');
		if (templateImageUpload && imageUploadArea) {
			templateImageUpload.addEventListener('change', window.handleTemplateImageUpload);
			
			// 拖拽上傳
			imageUploadArea.addEventListener('dragover', window.handleDragOver);
			imageUploadArea.addEventListener('dragleave', window.handleDragLeave);
			imageUploadArea.addEventListener('drop', window.handleDrop);
		}

		// 儲存模板按鈕
		const saveTemplateBtn = document.getElementById('saveTemplateBtn');
		if (saveTemplateBtn) {
			saveTemplateBtn.addEventListener('click', window.handleSaveTemplate);
		}

		// 預覽模板按鈕
		const previewTemplateBtn = document.getElementById('previewTemplateBtn');
		if (previewTemplateBtn) {
			previewTemplateBtn.addEventListener('click', window.handlePreviewTemplate);
		}

		// 清空模板按鈕
		const clearTemplateBtn = document.getElementById('clearTemplateBtn');
		if (clearTemplateBtn) {
			clearTemplateBtn.addEventListener('click', window.handleClearTemplate);
		}

		// 標籤篩選器
		const hashtagFilter = document.getElementById('hashtagFilter');
		if (hashtagFilter) {
			hashtagFilter.addEventListener('change', window.handleHashtagFilter);
		}
	}

	/**
	 * 重新綁定發文設定頁面事件
	 */
	rebindPostEvents() {
		console.log('rebindPostEvents 被調用');
		
		// 初始化發文設定系統
		if (window.initPostingSystem) {
			console.log('調用 window.initPostingSystem');
			window.initPostingSystem();
		} else {
			console.log('window.initPostingSystem 不存在');
		}
		
		// 載入發文平台選項
		if (window.updatePostingPlatforms) {
			console.log('調用 window.updatePostingPlatforms');
			window.updatePostingPlatforms();
		} else {
			console.log('window.updatePostingPlatforms 不存在');
		}

		// 載入文案模板選項（為發文設定頁面的下拉選單）
		if (window.updateCopyTemplateOptions) {
			console.log('調用 window.updateCopyTemplateOptions');
			window.updateCopyTemplateOptions();
		} else {
			console.log('window.updateCopyTemplateOptions 不存在');
		}

		// 發文設定表單處理
		const postingForm = document.getElementById('postingForm');
		if (postingForm) {
			// 移除舊的事件監聽器（如果存在）
			postingForm.removeEventListener('submit', window.handlePosting);
			// 添加新的事件監聽器
			postingForm.addEventListener('submit', window.handlePosting);
		}

		// 獲取社團列表按鈕
		const getCommunitiesBtn = document.getElementById('getCommunitiesBtn');
		if (getCommunitiesBtn) {
			// 移除舊的事件監聽器（如果存在）
			getCommunitiesBtn.removeEventListener('click', window.getFacebookCommunities);
			// 添加新的事件監聽器
			getCommunitiesBtn.addEventListener('click', window.getFacebookCommunities);
		}

		// 社團選擇控制按鈕
		const selectAllCommunitiesBtn = document.getElementById('selectAllCommunitiesBtn');
		const deselectAllCommunitiesBtn = document.getElementById('deselectAllCommunitiesBtn');
		
		if (selectAllCommunitiesBtn) {
			selectAllCommunitiesBtn.removeEventListener('click', window.selectAllCommunities);
			selectAllCommunitiesBtn.addEventListener('click', window.selectAllCommunities);
		}
		if (deselectAllCommunitiesBtn) {
			deselectAllCommunitiesBtn.removeEventListener('click', window.deselectAllCommunities);
			deselectAllCommunitiesBtn.addEventListener('click', window.deselectAllCommunities);
		}

		// 社團選擇 checkbox 事件
		const communityCheckboxes = document.querySelectorAll('input[name="communities"]');
		communityCheckboxes.forEach(checkbox => {
			checkbox.removeEventListener('change', () => {
				window.updateCommunitySelectionStyles();
				window.updateSelectionButtonIcons();
				if (typeof window.validateStep1 === 'function') {
					window.validateStep1();
				}
			});
			checkbox.addEventListener('change', () => {
				window.updateCommunitySelectionStyles();
				window.updateSelectionButtonIcons();
				// 觸發驗證
				if (typeof window.validateStep1 === 'function') {
					window.validateStep1();
				}
			});
		});

		// 發文平台選擇器
		const postingPlatformSelect = document.getElementById('platformSelect');
		if (postingPlatformSelect) {
			// 移除舊的事件監聽器（如果存在）
			postingPlatformSelect.removeEventListener('change', window.handlePostingPlatformChange);
			// 添加新的事件監聽器
			postingPlatformSelect.addEventListener('change', (e) => {
				window.handlePostingPlatformChange(e);
				// 觸發驗證
				if (typeof window.validateStep1 === 'function') {
					window.validateStep1();
				}
			});
		}

		// 文案模板選擇器
		const copyTemplateSelect = document.getElementById('templateSelect');
		if (copyTemplateSelect) {
			// 移除舊的事件監聽器（如果存在）
			copyTemplateSelect.removeEventListener('change', window.handlePostingTemplateChange);
			// 添加新的事件監聽器
			copyTemplateSelect.addEventListener('change', (e) => {
				window.handlePostingTemplateChange(e);
				// 觸發驗證
				if (typeof window.validateStep1 === 'function') {
					window.validateStep1();
				}
			});
		}

		// 綁定步驟切換事件
		this.bindPostingStepEvents();
		
		// 驗證第一步驟
		if (typeof window.validateStep1 === 'function') {
			console.log('調用 validateStep1 驗證第一步驟');
			window.validateStep1();
		} else {
			console.log('validateStep1 函數不存在');
		}
	}

	/**
	 * 綁定發文設定步驟切換事件
	 */
	bindPostingStepEvents() {
		// 下一步按鈕
		const nextStepBtn = document.getElementById('nextStepBtn');
		if (nextStepBtn) {
			nextStepBtn.removeEventListener('click', () => window.switchToStep(2));
			nextStepBtn.addEventListener('click', () => window.switchToStep(2));
		}

		const nextStepBtn2 = document.getElementById('nextStepBtn2');
		if (nextStepBtn2) {
			nextStepBtn2.removeEventListener('click', () => window.switchToStep(3));
			nextStepBtn2.addEventListener('click', () => window.switchToStep(3));
		}

		// 上一步按鈕
		const prevStepBtn = document.getElementById('prevStepBtn');
		if (prevStepBtn) {
			prevStepBtn.removeEventListener('click', () => window.switchToStep(1));
			prevStepBtn.addEventListener('click', () => window.switchToStep(1));
		}

		const prevStepBtn2 = document.getElementById('prevStepBtn2');
		if (prevStepBtn2) {
			prevStepBtn2.removeEventListener('click', () => window.switchToStep(2));
			prevStepBtn2.addEventListener('click', () => window.switchToStep(2));
		}

		// 立即發文按鈕
		const nextStepBtnImmediate = document.getElementById('nextStepBtnImmediate');
		if (nextStepBtnImmediate) {
			nextStepBtnImmediate.removeEventListener('click', () => window.switchToStep(3));
			nextStepBtnImmediate.addEventListener('click', () => window.switchToStep(3));
		}

		// 發文方式選擇
		const immediatePosting = document.getElementById('immediate_posting');
		const scheduledPosting = document.getElementById('scheduled_posting');
		if (immediatePosting && scheduledPosting) {
			// 移除舊的事件監聽器（如果存在）
			immediatePosting.removeEventListener('change', window.handlePostingMethodChange);
			scheduledPosting.removeEventListener('change', window.handlePostingMethodChange);
			// 添加新的事件監聽器
			immediatePosting.addEventListener('change', window.handlePostingMethodChange);
			scheduledPosting.addEventListener('change', window.handlePostingMethodChange);
		}

		// 日期選擇按鈕
		const selectAllDaysBtn = document.getElementById('selectAllDaysBtn');
		const selectWeekdaysBtn = document.getElementById('selectWeekdaysBtn');
		const clearDaysBtn = document.getElementById('clearDaysBtn');
		
		if (selectAllDaysBtn) {
			selectAllDaysBtn.removeEventListener('click', window.selectAllDays);
			selectAllDaysBtn.addEventListener('click', window.selectAllDays);
		}
		if (selectWeekdaysBtn) {
			selectWeekdaysBtn.removeEventListener('click', window.selectWeekdays);
			selectWeekdaysBtn.addEventListener('click', window.selectWeekdays);
		}
		if (clearDaysBtn) {
			clearDaysBtn.removeEventListener('click', window.clearDays);
			clearDaysBtn.addEventListener('click', window.clearDays);
		}

		// 時間設定
		const addTimeBtn = document.getElementById('addTimeBtn');
		if (addTimeBtn) {
			addTimeBtn.removeEventListener('click', window.addPostingTime);
			addTimeBtn.addEventListener('click', window.addPostingTime);
		}

		// 移除時間按鈕（動態生成的按鈕）
		const removeTimeBtns = document.querySelectorAll('.remove-time-btn');
		removeTimeBtns.forEach(btn => {
			btn.removeEventListener('click', () => window.removePostingTime(btn));
			btn.addEventListener('click', () => window.removePostingTime(btn));
		});

		// 確認發布按鈕
		const confirmPostingBtn = document.getElementById('confirmPostingBtn');
		if (confirmPostingBtn) {
			confirmPostingBtn.removeEventListener('click', window.confirmPosting);
			confirmPostingBtn.addEventListener('click', window.confirmPosting);
		}
	}

	/**
	 * 切換發文設定步驟
	 */
	switchToStep(stepNumber) {
		// 隱藏所有步驟內容
		document.querySelectorAll('.posting-step-content').forEach(content => {
			content.style.display = 'none';
		});

		// 顯示指定步驟內容
		const stepContent = document.getElementById(`step${stepNumber}-content`);
		if (stepContent) {
			stepContent.style.display = 'block';
		}

		// 更新步驟指示器
		document.querySelectorAll('.step-item').forEach((item, index) => {
			item.classList.remove('active', 'completed');
			if (index + 1 === stepNumber) {
				item.classList.add('active');
			} else if (index + 1 < stepNumber) {
				item.classList.add('completed');
			}
		});
	}





	/**
	 * 重新綁定排程設定頁面事件
	 */
	rebindScheduleEvents() {
		// 載入排程列表
		if (window.loadSchedules) {
			window.loadSchedules();
		}

		// 排程設定相關事件
		console.log('綁定排程設定事件');
	}

	/**
	 * 重新綁定自動養號頁面事件
	 */
	rebindAutoFeedEvents() {
		// 載入自動養號設定
		if (window.loadAutoFeedSettings) {
			window.loadAutoFeedSettings();
		}

		// 自動養號相關事件
		console.log('綁定自動養號事件');
	}

	/**
	 * 重新綁定社團拍賣商品頁面事件
	 */
	rebindGroupSaleEvents() {
		// 載入商品列表
		if (window.loadProducts) {
			window.loadProducts();
		}

		// 社團拍賣商品相關事件
		console.log('綁定社團拍賣商品事件');
	}

	/**
	 * 顯示錯誤訊息
	 */
	showErrorMessage(message) {
		const mainContent = document.getElementById('main-content') || document.querySelector('.content');
		if (mainContent) {
			mainContent.innerHTML = `
				<div class="error-message">
					<i class="fas fa-exclamation-triangle"></i>
					<p>${message}</p>
					<button class="btn btn-primary" onclick="location.reload()">重新整理</button>
				</div>
			`;
		}
	}

	/**
	 * 載入初始內容
	 */
	async loadInitialContent() {
		try {
			// 檢查是否有預設頁面（從 Django 傳遞過來）
			let defaultTab = 'account';
			if (window.CRAWLER_CURRENT_PAGE) {
				defaultTab = window.CRAWLER_CURRENT_PAGE;
				console.log('檢測到預設頁面:', defaultTab);
			}
			
			this.currentTab = defaultTab;
			this.updateSidebarState(defaultTab);
			
			// 載入預設頁面內容
			await this.loadTabContent(defaultTab);
		} catch (error) {
			console.error('載入初始內容失敗:', error);
			this.showErrorMessage('載入頁面失敗，請重新整理頁面');
		}
	}
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
	window.ajaxNavigation = new AjaxNavigation();
	
	// 將 switchToStep 函數暴露到 window 對象
	window.switchToStep = (stepNumber) => {
		// 隱藏所有步驟內容
		document.querySelectorAll('.posting-step-content').forEach(content => {
			content.style.display = 'none';
		});

		// 顯示指定步驟內容
		const stepContent = document.getElementById(`step${stepNumber}-content`);
		if (stepContent) {
			stepContent.style.display = 'block';
		}

		// 更新步驟指示器
		document.querySelectorAll('.step-item').forEach((item, index) => {
			item.classList.remove('active', 'completed');
			if (index + 1 === stepNumber) {
				item.classList.add('active');
			} else if (index + 1 < stepNumber) {
				item.classList.add('completed');
			}
		});
	};
});

// 導出類別供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
	module.exports = AjaxNavigation;
}
