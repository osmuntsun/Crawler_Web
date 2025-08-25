// posting.js - 發文設定功能

// 多步驟發文處理
let currentStep = 1;
let postingData = {};

// 下一步按鈕事件
document.addEventListener('click', function(e) {
	if (e.target.id === 'nextStepBtn') {
		nextStep();
	} else if (e.target.id === 'nextStepBtn2') {
		nextStep();
	} else if (e.target.id === 'prevStepBtn') {
		prevStep();
	} else if (e.target.id === 'prevStepBtn2') {
		prevStep();
	} else if (e.target.id === 'confirmPostingBtn') {
		confirmPosting();
	}
});

// 初始化步驟系統
document.addEventListener('DOMContentLoaded', function() {
	// 確保步驟1顯示，其他步驟隱藏
	showStep(1);
	
	// 綁定步驟按鈕事件
	bindStepButtons();
	
	// 設置步驟2的開始時間默認值
	setDefaultStartTime();
});

// 設置默認開始時間
function setDefaultStartTime() {
	const startTimeInput = document.getElementById('scheduleStartTime');
	if (startTimeInput) {
		// 設置為當前時間後1小時
		const now = new Date();
		now.setHours(now.getHours() + 1);
		now.setMinutes(0);
		now.setSeconds(0);
		now.setMilliseconds(0);
		
		// 格式化為 datetime-local 格式
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		
		startTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
	}
}

// 綁定步驟按鈕事件
function bindStepButtons() {
	const nextStepBtn = document.getElementById('nextStepBtn');
	const nextStepBtn2 = document.getElementById('nextStepBtn2');
	const prevStepBtn = document.getElementById('prevStepBtn');
	const prevStepBtn2 = document.getElementById('prevStepBtn2');
	const confirmPostingBtn = document.getElementById('confirmPostingBtn');

	if (nextStepBtn) {
		nextStepBtn.addEventListener('click', nextStep);
	}
	if (nextStepBtn2) {
		nextStepBtn2.addEventListener('click', nextStep);
	}
	if (prevStepBtn) {
		prevStepBtn.addEventListener('click', prevStep);
	}
	if (prevStepBtn2) {
		prevStepBtn2.addEventListener('click', prevStep);
	}
	if (confirmPostingBtn) {
		confirmPostingBtn.addEventListener('click', confirmPosting);
	}

	// 綁定步驟指示器點擊事件
	bindStepIndicators();
}

// 綁定步驟指示器點擊事件
function bindStepIndicators() {
	document.querySelectorAll('.step-item').forEach((item, index) => {
		item.addEventListener('click', function() {
			const stepNumber = index + 1;
			console.log(`點擊步驟指示器: ${stepNumber}, 當前步驟: ${currentStep}`);
			
			// 允許點擊任何已完成的步驟或當前步驟
			if (stepNumber <= currentStep) {
				// 添加點擊動畫效果
				item.style.transform = 'scale(0.95)';
				setTimeout(() => {
					item.style.transform = '';
					showStep(stepNumber);
				}, 150);
			} else {
				// 顯示警告並添加震動效果
				window.showNotification(`請先完成步驟 ${stepNumber - 1}`, 'warning');
				item.style.animation = 'shake 0.5s ease';
				setTimeout(() => {
					item.style.animation = '';
				}, 500);
			}
		});
	});
}

// 下一步
function nextStep() {
	console.log(`下一步按鈕點擊，當前步驟: ${currentStep}`);
	
	if (currentStep === 1) {
		console.log('驗證步驟1...');
		// 驗證步驟1
		validateStep1();
		
		// 檢查是否可以進行下一步
		const nextStepBtn = document.getElementById('nextStepBtn');
		if (nextStepBtn && nextStepBtn.disabled) {
			console.log('步驟1驗證失敗，無法進行下一步');
			return;
		}
		
		console.log('步驟1驗證成功，收集數據...');
		// 收集步驟1的數據
		collectStep1Data();
		console.log('切換到步驟2...');
		showStep(2);
	} else if (currentStep === 2) {
		console.log('驗證步驟2...');
		if (!validateStep2()) {
			console.log('步驟2驗證失敗');
			return;
		}
		console.log('步驟2驗證成功，收集數據...');
		// 收集步驟2的數據
		collectStep2Data();
		console.log('切換到步驟3...');
		showStep(3);
	}
}

// 上一步
function prevStep() {
	if (currentStep === 2) {
		showStep(1);
	} else if (currentStep === 3) {
		showStep(2);
	}
}

// 顯示指定步驟
function showStep(step) {
	console.log(`切換到步驟 ${step}, 從步驟 ${currentStep} 切換`);
	
	// 隱藏所有步驟內容
	document.querySelectorAll('.posting-step-content').forEach(content => {
		content.style.display = 'none';
		console.log(`隱藏步驟內容: ${content.id}`);
	});

	// 顯示指定步驟
	const targetStep = document.getElementById(`step${step}-content`);
	if (targetStep) {
		targetStep.style.display = 'block';
		console.log(`顯示步驟內容: ${targetStep.id}`);
	} else {
		console.error(`找不到步驟 ${step} 的內容元素`);
	}

	// 更新步驟指示器
	updateStepIndicator(step);

	// 更新當前步驟
	currentStep = step;
	console.log(`當前步驟已更新為: ${currentStep}`);

	// 如果是步驟3，填充確認信息
	if (step === 3) {
		fillConfirmationSummary();
	}
	
	// 如果是第二步，重新初始化發文方式選擇和排程實驗
	if (step === 2) {
		reinitializePostingMethodSelection();
		initializeScheduleTest();
		// 初始化日期選擇按鈕
		setTimeout(() => {
			initializeDateSelectionButtons();
			addDateCheckboxListeners();
		}, 100);
	}
	
	// 顯示步驟切換通知
	const stepNames = ['選擇文案', '排程設定', '確認發布'];
	window.showNotification(`已切換到步驟 ${step}: ${stepNames[step - 1]}`, 'info');
}

// 更新步驟指示器
function updateStepIndicator(step) {
	console.log(`更新步驟指示器到步驟 ${step}`);
	
	// 更新步驟項目狀態
	document.querySelectorAll('.step-item').forEach((item, index) => {
		const stepNumber = index + 1;
		item.classList.remove('active', 'completed', 'clickable', 'disabled');
		
		if (stepNumber === step) {
			item.classList.add('active');
			console.log(`步驟 ${stepNumber} 設為活動狀態`);
		} else if (stepNumber < step) {
			item.classList.add('completed', 'clickable');
			console.log(`步驟 ${stepNumber} 設為完成狀態，可點擊`);
		} else {
			item.classList.add('disabled');
			console.log(`步驟 ${stepNumber} 設為禁用狀態`);
		}
	});
	
	// 更新連線效果
	updateStepConnections(step);
	
	// 調試信息
	console.log(`步驟指示器更新完成，當前步驟: ${step}`);
	console.log(`可點擊的步驟: ${Array.from(document.querySelectorAll('.step-item.clickable')).map((item, index) => index + 1).join(', ')}`);
}

// 更新步驟連線效果（已簡化，因為移除了連線）
function updateStepConnections(step) {
	// 連線已移除，此函數保留以備將來使用
	console.log(`當前步驟: ${step}`);
}

// 驗證步驟1
function validateStep1() {
	console.log('validateStep1 函數被調用');
	
	const nextStepBtn = document.getElementById('nextStepBtn');
	if (!nextStepBtn) {
		console.error('找不到 nextStepBtn 元素');
		return;
	}
	console.log('找到 nextStepBtn 元素');
	
	// 檢查是否選擇了平台
	const platformSelect = document.getElementById('platformSelect');
	const platform = platformSelect ? platformSelect.value : '';
	console.log('平台選擇:', { element: !!platformSelect, value: platform });
	
	// 檢查是否選擇了文案模板
	const templateSelect = document.getElementById('templateSelect');
	const template = templateSelect ? templateSelect.value : '';
	console.log('模板選擇:', { element: !!templateSelect, value: template });
	
	// 檢查是否選擇了社團（如果是Facebook平台）
	let hasCommunities = true;
	if (platform === 'facebook') {
		// 檢查社團列表是否已載入
		const communitiesList = document.getElementById('communitiesList');
		if (communitiesList && communitiesList.querySelector('.communities-loading')) {
			// 社團列表還在載入中，暫時允許通過
			hasCommunities = true;
		} else {
			const selectedCommunities = document.querySelectorAll('#communitiesList input[name="communities"]:checked');
			hasCommunities = selectedCommunities.length > 0;
		}
		console.log('Facebook社團選擇:', { hasCommunities });
	}
	
	// 檢查是否有發文內容
	const messageTextarea = document.getElementById('messageTextarea');
	const hasMessage = messageTextarea && messageTextarea.value.trim().length > 0;
	console.log('發文內容:', { element: !!messageTextarea, hasContent: hasMessage, content: messageTextarea ? messageTextarea.value.trim() : 'N/A' });
	
	// 所有條件都滿足時啟用下一步按鈕
	const canProceed = platform && template && hasCommunities && hasMessage;
	
	console.log('驗證結果:', {
		platform: !!platform,
		template: !!template,
		hasCommunities,
		hasMessage,
		canProceed
	});
	
	nextStepBtn.disabled = !canProceed;
	
	if (canProceed) {
		nextStepBtn.classList.remove('btn-secondary');
		nextStepBtn.classList.add('btn-primary');
		console.log('下一步按鈕已啟用');
	} else {
		nextStepBtn.classList.remove('btn-primary');
		nextStepBtn.classList.add('btn-secondary');
		console.log('下一步按鈕已禁用');
	}
}

// 驗證步驟2
function validateStep2() {
	const startTime = document.getElementById('scheduleStartTime').value;
	const intervalMin = document.querySelector('input[name="interval_min"]').value;
	const intervalUnit = document.querySelector('select[name="interval_unit"]').value;
	const selectedDays = document.querySelectorAll('input[name="days"]:checked');

	if (!startTime) {
		window.showNotification('請設定開始時間', 'warning');
		return false;
	}

	if (!intervalMin || intervalMin < 1) {
		window.showNotification('請設定有效的發文間隔', 'warning');
		return false;
	}

	if (selectedDays.length === 0) {
		window.showNotification('請至少選擇一個執行日期', 'warning');
		return false;
	}

	return true;
}

// 收集步驟1數據
function collectStep1Data() {
	const platform = document.getElementById('platformSelect').value;
	const copyTemplate = document.getElementById('templateSelect').value;
	const copyTemplateSelect = document.getElementById('templateSelect');
	const selectedOption = copyTemplateSelect.options[copyTemplateSelect.selectedIndex];

	postingData.platform = platform;
	postingData.templateId = copyTemplate;

	if (selectedOption && selectedOption.dataset.template) {
		const template = JSON.parse(selectedOption.dataset.template);
		postingData.template = template;
		postingData.messageContent = window.processTemplateContent(template.content);
		postingData.templateImages = template.images || [];
	}

	// 如果是Facebook，收集社團信息
	if (platform === 'facebook') {
		const selectedCommunities = Array.from(document.querySelectorAll('.community-checkbox:checked'))
			.map(checkbox => ({
				url: checkbox.value,
				name: checkbox.dataset.name
			}));
		postingData.communities = selectedCommunities;
	}
}

// 收集步驟2數據
function collectStep2Data() {
	const postingMethod = document.querySelector('input[name="posting_method"]:checked').value;
	
	if (postingMethod === 'immediate') {
		// 立即發文，不需要額外圖片
		postingData.step2 = {
			method: 'immediate'
		};
		
		console.log('立即發文模式，步驟2數據收集完成:', postingData.step2);
	} else {
		// 排程發文，收集所有排程設定
		const startTime = document.getElementById('scheduleStartTime').value;
		const intervalMin = document.querySelector('input[name="interval_min"]').value;
		const intervalUnit = document.querySelector('select[name="interval_unit"]').value;
		const selectedDays = Array.from(document.querySelectorAll('input[name="days"]:checked'))
			.map(checkbox => checkbox.value);
			
		postingData.step2 = {
			method: 'scheduled',
			startTime,
			intervalMin,
			intervalUnit,
			selectedDays
		};
		
		console.log('排程發文模式，步驟2數據收集完成:', postingData.step2);
	}
}

// 填充確認摘要
function fillConfirmationSummary() {
	// 平台信息
	document.getElementById('confirmPlatform').textContent = window.getPlatformDisplayName(postingData.platform);
	
	// 文案內容
	const contentPreview = postingData.messageContent ? 
		postingData.messageContent.substring(0, 100) + (postingData.messageContent.length > 100 ? '...' : '') :
		'無';
	document.getElementById('confirmContent').textContent = contentPreview;
	
	// 發文方式
	if (postingData.step2 && postingData.step2.method === 'immediate') {
		document.getElementById('confirmSchedule').textContent = '立即發文';
	} else if (postingData.step2 && postingData.step2.method === 'scheduled') {
		const schedule = postingData.step2;
		const scheduleText = `開始時間：${new Date(schedule.startTime).toLocaleString()}，間隔：${schedule.intervalMin} ${schedule.intervalUnit}，執行日期：${schedule.selectedDays.join(', ')}`;
		document.getElementById('confirmSchedule').textContent = scheduleText;
	} else {
		document.getElementById('confirmSchedule').textContent = '未設定';
	}
	
	// 圖片數量
	const templateImagesCount = (postingData.templateImages ? postingData.templateImages.length : 0);
	document.getElementById('confirmImages').textContent = `${templateImagesCount} 張圖片`;
}

// 準備發文數據
function preparePostingData() {
	const postData = {
		platform: postingData.platform,
		messageContent: postingData.messageContent,
		templateImages: postingData.templateImages || [],
		communities: postingData.communities || []
	};
	
	// 根據發文方式添加額外數據
	if (postingData.step2) {
		if (postingData.step2.method === 'immediate') {
			// 立即發文：不需要額外圖片
			postData.method = 'immediate';
		} else if (postingData.step2.method === 'scheduled') {
			// 排程發文：添加排程設定
			postData.schedule = {
				startTime: postingData.step2.startTime,
				intervalMin: postingData.step2.intervalMin,
				intervalUnit: postingData.step2.intervalUnit,
				selectedDays: postingData.step2.selectedDays
			};
			postData.method = 'scheduled';
		}
	}
	
	console.log('準備發文數據:', postData);
	return postData;
}

// 執行立即發文
async function executeImmediatePosting(postData) {
	try {
		console.log('開始執行立即發文:', postData);
		
		// 準備發送到後端的數據
		const requestData = {
			action: 'post_to_community',
			platform: postData.platform,
			message: postData.messageContent,
			communities: postData.communities.map(community => community.url || community.id),
			template_images: postData.templateImages.map(img => img.url || img.path)
		};
		
		// 獲取 CSRF Token
		const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
						  document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
		
		if (!csrfToken) {
			throw new Error('無法獲取 CSRF Token');
		}
		
		// 發送請求到後端
		const response = await fetch('/crawler/api/facebook/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			},
			body: JSON.stringify(requestData)
		});
		
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
		}
		
		const result = await response.json();
		
		if (result.success) {
			window.showNotification(`發布成功！成功：${result.success_count} 個，失敗：${result.failed_count} 個`, 'success');
			console.log('發布結果:', result);
		} else {
			throw new Error(result.error || '發布失敗');
		}
		
		// 發布成功後重置到步驟1
		resetToStep1();
		
	} catch (error) {
		console.error('立即發文執行失敗:', error);
		throw new Error(`立即發文失敗: ${error.message}`);
	}
}

// 保存排程發文設定
async function saveScheduledPosting() {
	try {
		// 收集發文時間數據
		const postingTimes = collectPostingTimesData();
		if (postingTimes.length === 0) {
			window.showNotification('請至少設定一個發文時間', 'error');
			return;
		}
		
		// 收集執行日期數據
		const executionDays = [];
		const dayCheckboxes = document.querySelectorAll('input[name="days"]:checked');
		dayCheckboxes.forEach(checkbox => {
			executionDays.push(checkbox.value);
		});
		
		if (executionDays.length === 0) {
			window.showNotification('請至少選擇一個執行日期', 'error');
			return;
		}
		
		// 準備排程數據
		const scheduleData = {
			action: 'save_scheduled_posting',
			platform: postingData.platform,
			message: postingData.message,
			communities: postingData.communities,
			template_images: postingData.template_images || [],
			posting_times: postingTimes,
			execution_days: executionDays
		};
		
		console.log('準備保存排程發文:', scheduleData);
		
		// 發送請求到後端
		const response = await fetch('/crawler/api/schedule/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': getCSRFToken()
			},
			body: JSON.stringify(scheduleData)
		});
		
		const result = await response.json();
		
		if (result.success) {
			window.showNotification(result.message, 'success');
			console.log('排程發文保存成功:', result);
			
			// 重置到第一步驟
			resetToStep1();
			
		} else {
			window.showNotification(`排程發文保存失敗: ${result.error}`, 'error');
			console.error('排程發文保存失敗:', result.error);
		}
		
	} catch (error) {
		console.error('保存排程發文時發生錯誤:', error);
		window.showNotification(`排程發文保存失敗: ${error.message}`, 'error');
	}
}

// 確認發布
async function confirmPosting() {
	const confirmBtn = document.getElementById('confirmPostingBtn');
	const originalText = confirmBtn.innerHTML;
	
	try {
		confirmBtn.disabled = true;
		confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 發布中...';

		// 準備發文數據
		const postData = preparePostingData();
		
		// 根據發文方式決定發送方式
		if (postingData.step2 && postingData.step2.method === 'immediate') {
			// 立即發文：直接發送到後端執行 Selenium
			await executeImmediatePosting(postData);
		} else {
			// 排程發文：保存到排程系統
			await saveScheduledPosting();
		}
		
	} catch (error) {
		console.error('發布失敗:', error);
		window.showNotification('發布失敗：' + error.message, 'error');
	} finally {
		confirmBtn.disabled = false;
		confirmBtn.innerHTML = originalText;
	}
}

// 重置到步驟1
function resetToStep1() {
	currentStep = 1;
	postingData = {};
	showStep(1);
			
	// 清空表單
	document.getElementById('postingForm').reset();
	document.getElementById('imagePreview').innerHTML = '';
	document.getElementById('copyPreview').innerHTML = '<p class="text-muted">請先選擇文案模板</p>';

	// 隱藏Facebook社團選擇
	const facebookCommunitiesRow = document.getElementById('facebookCommunitiesRow');
	if (facebookCommunitiesRow) {
		facebookCommunitiesRow.style.display = 'none';
	}
}

// 處理發文（保留原有邏輯，但改為內部調用）
async function handlePosting(e) {
	e.preventDefault();
	
	// 直接進入多步驟流程
	nextStep();
}

// 獲取 CSRF Token
function getCSRFToken() {
	return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
		   document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
}

// 導出全局函數
window.nextStep = nextStep;
window.prevStep = prevStep;
window.showStep = showStep;
window.validateStep1 = validateStep1;
window.validateStep2 = validateStep2;
window.collectStep1Data = collectStep1Data;
window.collectStep2Data = collectStep2Data;
window.fillConfirmationSummary = fillConfirmationSummary;
window.preparePostingData = preparePostingData;
window.executeImmediatePosting = executeImmediatePosting;
window.saveScheduledPosting = saveScheduledPosting;
window.confirmPosting = confirmPosting;
window.resetToStep1 = resetToStep1;
window.handlePosting = handlePosting;
