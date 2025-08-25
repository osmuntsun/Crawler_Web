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
	const copyTemplateSelect = document.getElementById('copyTemplate');
	const messageTextarea = document.getElementById('messageTextarea');
	
	if (!copyTemplateSelect || !messageTextarea) return;
	
	const selectedTemplateId = copyTemplateSelect.value;
	if (!selectedTemplateId) {
		messageTextarea.value = '';
		return;
	}
	
	// 從本地存儲獲取模板內容
	const templates = JSON.parse(localStorage.getItem('copyTemplates') || '[]');
	const template = templates.find(t => t.id === selectedTemplateId);
	
	if (template) {
		messageTextarea.value = template.template;
		// 觸發文案預覽更新
		if (typeof window.updateCopyPreview === 'function') {
			window.updateCopyPreview();
		}
	}
}

// 模板保存、預覽、清空等操作函數
function handleSaveTemplate() {
	const titleInput = document.querySelector('input[name="copy_title"]');
	const contentTextarea = document.querySelector('textarea[name="copy_template"]');
	const hashtagsInput = document.querySelector('input[name="hashtags"]');
	
	if (!titleInput || !contentTextarea) {
		window.showNotification('請填寫模板標題和內容', 'warning');
		return;
	}
	
	const title = titleInput.value.trim();
	const content = contentTextarea.value.trim();
	const hashtags = hashtagsInput ? hashtagsInput.value.trim() : '';
	
	if (!title || !content) {
		window.showNotification('請填寫模板標題和內容', 'warning');
		return;
	}
	
	// 創建新模板
	const newTemplate = {
		id: Date.now().toString(),
		title: title,
		template: content,
		hashtags: hashtags,
		images: window.templateImages || [],
		created_at: new Date().toISOString()
	};
	
	// 保存到本地存儲
	const templates = JSON.parse(localStorage.getItem('copyTemplates') || '[]');
	templates.push(newTemplate);
	localStorage.setItem('copyTemplates', JSON.stringify(templates));
	
	// 顯示成功通知
	window.showNotification('模板保存成功！', 'success');
	
	// 重新載入模板選項
	loadCopyTemplates();
	
	// 清空表單
	titleInput.value = '';
	contentTextarea.value = '';
	if (hashtagsInput) hashtagsInput.value = '';
	
	// 清空圖片
	const imageUploadArea = document.getElementById('imageUploadArea');
	if (imageUploadArea) {
		imageUploadArea.innerHTML = '<p>拖拽圖片到這裡或點擊選擇檔案</p>';
	}
	window.templateImages = [];
	
	// 更新按鈕狀態
	checkFormEmptyAndUpdateButtons();
}

function handlePreviewTemplate() {
	const titleInput = document.querySelector('input[name="copy_title"]');
	const contentTextarea = document.querySelector('textarea[name="copy_template"]');
	const hashtagsInput = document.querySelector('input[name="hashtags"]');
	
	if (!titleInput || !contentTextarea) {
		window.showNotification('請填寫模板標題和內容', 'warning');
		return;
	}
	
	const title = titleInput.value.trim();
	const content = contentTextarea.value.trim();
	const hashtags = hashtagsInput ? hashtagsInput.value.trim() : '';
	
	if (!title || !content) {
		window.showNotification('請填寫模板標題和內容', 'warning');
		return;
	}
	
	// 創建預覽內容
	let previewContent = `標題：${title}\n\n內容：${content}`;
	if (hashtags) {
		previewContent += `\n\n標籤：${hashtags}`;
	}
	
	// 顯示預覽（這裡可以彈出一個模態框或更新預覽區域）
	window.showNotification('模板預覽功能開發中...', 'info');
	console.log('模板預覽:', previewContent);
}

function handleClearTemplate() {
	const titleInput = document.querySelector('input[name="copy_title"]');
	const contentTextarea = document.querySelector('textarea[name="copy_template"]');
	const hashtagsInput = document.querySelector('input[name="hashtags"]');
	
	// 清空所有輸入欄位
	if (titleInput) titleInput.value = '';
	if (contentTextarea) contentTextarea.value = '';
	if (hashtagsInput) hashtagsInput.value = '';
	
	// 清空圖片
	const imageUploadArea = document.getElementById('imageUploadArea');
	if (imageUploadArea) {
		imageUploadArea.innerHTML = '<p>拖拽圖片到這裡或點擊選擇檔案</p>';
	}
	window.templateImages = [];
	
	// 更新按鈕狀態
	checkFormEmptyAndUpdateButtons();
	
	// 顯示通知
	window.showNotification('模板已清空', 'info');
}

// 檢查表單是否為空並更新按鈕狀態
function checkFormEmptyAndUpdateButtons() {
	const titleInput = document.querySelector('input[name="copy_title"]');
	const contentTextarea = document.querySelector('textarea[name="copy_template"]');
	const hashtagsInput = document.querySelector('input[name="hashtags"]');
	
	const isFormEmpty = (!titleInput || titleInput.value.trim() === '') &&
						(!contentTextarea || contentTextarea.value.trim() === '') &&
						(!hashtagsInput || hashtagsInput.value.trim() === '') &&
						(!window.templateImages || window.templateImages.length === 0);
	
	// 獲取清空按鈕
	const clearBtn = document.getElementById('clearTemplateBtn');
	
	// 如果表單為空，隱藏清空按鈕
	if (isFormEmpty) {
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
window.handleSaveTemplate = handleSaveTemplate;
window.handlePreviewTemplate = handlePreviewTemplate;
window.handleClearTemplate = handleClearTemplate;
window.checkFormEmptyAndUpdateButtons = checkFormEmptyAndUpdateButtons;
