// templates.js - 文案模板管理功能

// 全局變量
let templateImages = [];
let draggedImageIndex = null;

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
					
					if (template.images && template.images.length > 0) {
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
					
					if (template.hashtags && Array.isArray(template.hashtags) && template.hashtags.length > 0) {
						const hashtagsText = template.hashtags.join(', ');
						html += `<div class="template-hashtags"><i class="fas fa-tags"></i> ${hashtagsText}</div>`;
					}
					
					html += `</div>`;
				});
				templatesList.innerHTML = html;
			}
		} else {
			throw new Error(result.error || '載入模板列表失敗');
		}
		
		// 同時更新發文設定頁面的文案模板選項，保持兩個頁面同步
		await updateCopyTemplateOptions();
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
		console.log(`模板 ${index}: hashtags =`, template.hashtags);
		if (template.hashtags && Array.isArray(template.hashtags)) {
			const hashtags = template.hashtags.filter(tag => tag && tag.trim());
			console.log(`  解析後的標籤:`, hashtags);
			hashtags.forEach(tag => allHashtags.add(tag.trim()));
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
		if (!template.hashtags || !Array.isArray(template.hashtags)) {
			console.log(`模板 "${template.title}" 沒有標籤，過濾掉`);
			return false;
		}
		const hashtags = template.hashtags.map(tag => tag.trim());
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
	const copyTemplateSelect = document.getElementById('templateSelect');
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
	console.log('模板選擇變更事件觸發');
	
	const copyTemplateSelect = document.getElementById('templateSelect');
	const copyPreview = document.getElementById('copyPreview');
	const messageTextarea = document.getElementById('messageTextarea');
	
	console.log('找到的元素:', {
		copyTemplateSelect: !!copyTemplateSelect,
		copyPreview: !!copyPreview,
		messageTextarea: !!messageTextarea
	});
	
	if (!copyTemplateSelect || !copyPreview) {
		console.error('找不到必要的元素');
		return;
	}
	
	const selectedTemplateId = copyTemplateSelect.value;
	console.log('選中的模板ID:', selectedTemplateId);
	
	if (!selectedTemplateId) {
		copyPreview.innerHTML = '<p class="text-muted">請先選擇文案模板</p>';
		// 清空發文內容
		if (messageTextarea) {
			messageTextarea.value = '';
		}
		return;
	}
	
	// 獲取選中的模板數據
	const selectedOption = copyTemplateSelect.options[copyTemplateSelect.selectedIndex];
	console.log('選中的選項:', selectedOption);
	
	if (!selectedOption || !selectedOption.dataset.template) {
		console.error('模板數據不存在');
		return;
	}
	
	const template = JSON.parse(selectedOption.dataset.template);
	console.log('解析的模板數據:', template);
	
	// 填充發文內容到textarea
	if (messageTextarea && template.content) {
		console.log('填充發文內容:', template.content);
		messageTextarea.value = template.content.trim();
	} else {
		console.log('無法填充發文內容:', {
			hasMessageTextarea: !!messageTextarea,
			hasContent: !!template.content
		});
	}
	
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
	
	// 觸發驗證
	if (typeof validateStep1 === 'function') {
		validateStep1();
	}
}

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

// 導出全局函數
window.loadCopyTemplates = loadCopyTemplates;
window.loadPostTemplates = loadPostTemplates;
window.updateHashtagFilterOptions = updateHashtagFilterOptions;
window.filterTemplatesByHashtag = filterTemplatesByHashtag;
window.handleHashtagFilter = handleHashtagFilter;
window.updateCopyTemplateOptions = updateCopyTemplateOptions;
window.handleCopyTemplateChange = handleCopyTemplateChange;
window.processTemplateContent = processTemplateContent;
