// posting.js - 發文設定功能

// 多步驟發文處理
let currentStep = 1;
let postingData = {};

// 初始化步驟系統
document.addEventListener('DOMContentLoaded', function() {
	// 確保步驟1顯示，其他步驟隱藏
	showStep(1);
	
	// 綁定步驟按鈕事件
	bindStepButtons();
	
	// 設置步驟2的開始時間默認值
	setDefaultStartTime();

	// 綁定發文方式選擇事件
	bindPostingMethodEvents();
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

// 綁定步驟2的按鈕事件
function bindStep2Buttons() {
	const prevStepBtnImmediate = document.getElementById('prevStepBtnImmediate');
	const nextStepBtnImmediate = document.getElementById('nextStepBtnImmediate');
	
	// 移除舊的事件監聽器（如果存在）
	if (prevStepBtnImmediate) {
		prevStepBtnImmediate.removeEventListener('click', prevStep);
		prevStepBtnImmediate.addEventListener('click', prevStep);
	}
	if (nextStepBtnImmediate) {
		nextStepBtnImmediate.removeEventListener('click', nextStep);
		nextStepBtnImmediate.addEventListener('click', nextStep);
	}
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
	
	// 如果是第二步，重新初始化發文方式選擇
	if (step === 2) {
		// 綁定步驟2的按鈕事件
		bindStep2Buttons();
		// 初始化發文方式選擇
		handlePostingMethodChange();
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
	// 由於我們已經移除了 messageTextarea，直接設為 true
	const hasMessage = true;
	console.log('發文內容: 已移除 messageTextarea，直接設為 true');
	
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
	const postingMethod = document.querySelector('input[name="posting_method"]:checked').value;
	
	if (postingMethod === 'immediate') {
		// 立即發文不需要額外驗證
		console.log('立即發文模式，驗證通過');
		return true;
	} else if (postingMethod === 'scheduled') {
		// 排程發文只需要驗證執行日期和發文時間
		const selectedDays = document.querySelectorAll('input[name="days"]:checked');
		const postingTimes = document.querySelectorAll('input[name="posting_times[]"]');
		
		// 檢查執行日期
		if (selectedDays.length === 0) {
			window.showNotification('請至少選擇一個執行日期', 'warning');
			return false;
		}
		
		// 檢查發文時間
		let hasValidTime = false;
		postingTimes.forEach(timeInput => {
			if (timeInput.value && timeInput.value.trim() !== '') {
				hasValidTime = true;
			}
		});
		
		if (!hasValidTime) {
			window.showNotification('請至少設定一個發文時間', 'warning');
			return false;
		}
		
		console.log('排程發文模式，驗證通過');
		return true;
	}
	
	console.error('未知的發文方式:', postingMethod);
	return false;
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
		const selectedCommunities = Array.from(document.querySelectorAll('#communitiesList input[name="communities"]:checked'))
			.map(checkbox => ({
				url: checkbox.value,
				name: checkbox.closest('.community-item')?.querySelector('.community-name')?.textContent || '未知社團'
			}));
		postingData.communities = selectedCommunities;
		console.log('收集到的社團信息:', selectedCommunities);
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
		// 排程發文，收集執行日期和發文時間
		const selectedDays = Array.from(document.querySelectorAll('input[name="days"]:checked'))
			.map(checkbox => checkbox.value);
		
		const postingTimes = [];
		document.querySelectorAll('input[name="posting_times[]"]').forEach(timeInput => {
			if (timeInput.value && timeInput.value.trim() !== '') {
				postingTimes.push(timeInput.value);
			}
		});
		
		// 檢查是否有重複的日期
		const uniqueDays = [...new Set(selectedDays)];
		if (selectedDays.length !== uniqueDays.length) {
			console.warn('檢測到重複的日期選擇，已自動去重:', {
				original: selectedDays,
				unique: uniqueDays
			});
		}
			
		postingData.step2 = {
			method: 'scheduled',
			selectedDays: uniqueDays, // 使用去重後的日期
			postingTimes
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
		const scheduleText = `執行日期：${schedule.selectedDays.join(', ')}，發文時間：${schedule.postingTimes.join(', ')}`;
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
			// 排程發文：添加執行日期和發文時間
			postData.schedule = {
				selectedDays: postingData.step2.selectedDays,
				postingTimes: postingData.step2.postingTimes
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

// 保存排程發文
async function saveScheduledPosting() {
	try {
		console.log('開始保存排程發文...');
		
		// 檢查是否有步驟2數據
		if (!postingData.step2 || postingData.step2.method !== 'scheduled') {
			window.showNotification('排程設定數據不完整', 'error');
			return;
		}
		
		// 使用已經收集好的數據
		const scheduleData = {
			action: 'save_scheduled_posting',
			platform: postingData.platform,
			message: postingData.messageContent,
			communities: postingData.communities,
			template_images: postingData.templateImages || [],
			execution_days: postingData.step2.selectedDays,
			posting_times: postingData.step2.postingTimes
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
	console.log('重置到步驟1，清空所有數據...');
	
	currentStep = 1;
	postingData = {};
	
	// 清空表單
	document.getElementById('postingForm').reset();
	document.getElementById('copyPreview').innerHTML = '<p class="text-muted">請先選擇文案模板</p>';

	// 隱藏Facebook社團選擇
	const facebookCommunitiesRow = document.getElementById('facebookCommunitiesRow');
	if (facebookCommunitiesRow) {
		facebookCommunitiesRow.style.display = 'none';
	}
	
	// 重置發文方式選擇
	const immediatePosting = document.getElementById('immediate_posting');
	const scheduledPosting = document.getElementById('scheduled_posting');
	if (immediatePosting) immediatePosting.checked = true;
	if (scheduledPosting) scheduledPosting.checked = false;
	
	// 隱藏排程選項
	const schedulingOptions = document.getElementById('schedulingOptions');
	if (schedulingOptions) schedulingOptions.style.display = 'none';
	
	// 顯示立即發文按鈕
	const immediatePostingActions = document.getElementById('immediatePostingActions');
	if (immediatePostingActions) immediatePostingActions.style.display = 'none';
	
	// 重置日期選擇
	document.querySelectorAll('input[name="days"]').forEach(checkbox => {
		checkbox.checked = false;
	});
	
	// 重置發文時間
	const postingTimesList = document.getElementById('postingTimesList');
	if (postingTimesList) {
		postingTimesList.innerHTML = `
			<div class="posting-time-item">
				<input type="time" name="posting_times[]" value="09:00" class="form-input time-input">
				<button type="button" class="btn btn-sm btn-danger remove-time-btn" onclick="removePostingTime(this)">
					<i class="fas fa-minus"></i>
				</button>
			</div>
		`;
	}
	
	console.log('重置完成，所有數據已清空');
	
	// 顯示步驟1
	showStep(1);
}

// 處理發文（保留原有邏輯，但改為內部調用）
async function handlePosting(e) {
	e.preventDefault();
	
	// 直接進入多步驟流程
	nextStep();
}

// 處理發文方式選擇
function handlePostingMethodChange() {
	const immediatePosting = document.getElementById('immediate_posting');
	const scheduledPosting = document.getElementById('scheduled_posting');
	const immediateActions = document.getElementById('immediatePostingActions');
	const schedulingOptions = document.getElementById('schedulingOptions');
	
	if (immediatePosting.checked) {
		// 顯示立即發文的按鈕
		immediateActions.style.display = 'block';
		schedulingOptions.style.display = 'none';
		console.log('選擇立即發文，顯示立即發文按鈕');
	} else if (scheduledPosting.checked) {
		// 顯示排程設定選項
		immediateActions.style.display = 'none';
		schedulingOptions.style.display = 'block';
		console.log('選擇排程發文，顯示排程設定選項');
	}
}

// 綁定發文方式選擇事件
function bindPostingMethodEvents() {
	const immediatePosting = document.getElementById('immediate_posting');
	const scheduledPosting = document.getElementById('scheduled_posting');
	
	if (immediatePosting) {
		immediatePosting.addEventListener('change', handlePostingMethodChange);
	}
	
	if (scheduledPosting) {
		scheduledPosting.addEventListener('change', handlePostingMethodChange);
	}
	
	// 初始化時觸發一次
	handlePostingMethodChange();
}

// 獲取 CSRF Token
function getCSRFToken() {
	return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
		   document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
}

// 日期選擇按鈕功能
function selectAllDays() {
	const dayCheckboxes = document.querySelectorAll('input[name="days"]');
	dayCheckboxes.forEach(checkbox => {
		checkbox.checked = true;
	});
	console.log('已選中所有日期');
}

function selectWeekdays() {
	const dayCheckboxes = document.querySelectorAll('input[name="days"]');
	dayCheckboxes.forEach(checkbox => {
		// 週一到週五 (monday, tuesday, wednesday, thursday, friday)
		if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(checkbox.value)) {
			checkbox.checked = true;
		} else {
			checkbox.checked = false;
		}
	});
	console.log('已選中工作日（週一到週五）');
}

function clearDays() {
	const dayCheckboxes = document.querySelectorAll('input[name="days"]');
	dayCheckboxes.forEach(checkbox => {
		checkbox.checked = false;
	});
	console.log('已清空所有日期選擇');
}

// 發文時間管理功能
function addPostingTime() {
	const postingTimesList = document.getElementById('postingTimesList');
	if (!postingTimesList) return;
	
	const newTimeItem = document.createElement('div');
	newTimeItem.className = 'posting-time-item';
	newTimeItem.innerHTML = `
		<input type="time" name="posting_times[]" value="09:00" class="form-input time-input">
		<button type="button" class="btn btn-sm btn-danger remove-time-btn" onclick="removePostingTime(this)">
			<i class="fas fa-minus"></i>
		</button>
	`;
	
	postingTimesList.appendChild(newTimeItem);
	console.log('已新增發文時間');
}

function removePostingTime(button) {
	const timeItem = button.closest('.posting-time-item');
	if (timeItem) {
		// 確保至少保留一個時間輸入框
		const timeItems = document.querySelectorAll('.posting-time-item');
		if (timeItems.length > 1) {
			timeItem.remove();
			console.log('已移除發文時間');
		} else {
			console.log('至少需要保留一個發文時間');
		}
	}
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
window.selectAllDays = selectAllDays;
window.selectWeekdays = selectWeekdays;
window.clearDays = clearDays;
window.addPostingTime = addPostingTime;
window.removePostingTime = removePostingTime;
