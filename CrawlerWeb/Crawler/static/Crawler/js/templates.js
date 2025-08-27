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
	console.log('updateCopyTemplateOptions 被調用');
	const copyTemplateSelect = document.getElementById('templateSelect');
	if (!copyTemplateSelect) {
		console.log('找不到 templateSelect 元素');
		return;
	}
	
	try {
		console.log('開始調用 API: /crawler/api/templates/');
		const response = await fetch('/crawler/api/templates/');
		console.log('API 響應狀態:', response.status, response.statusText);
		
		if (!response.ok) {
			throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
		}
		
		const result = await response.json();
		console.log('API 返回的數據:', result);
		
		if (result.success) {
			// 清空現有選項
			copyTemplateSelect.innerHTML = '<option value="">選擇要使用的文案模板</option>';
			
			console.log(`模板數量: ${result.templates ? result.templates.length : 0}`);
			
			// 添加模板選項
			if (result.templates && result.templates.length > 0) {
				result.templates.forEach(template => {
					const option = document.createElement('option');
					option.value = template.id;
					option.textContent = template.title;
					option.dataset.template = JSON.stringify(template);
					copyTemplateSelect.appendChild(option);
					console.log(`添加模板選項: ${template.id} - ${template.title}`);
				});
				
				console.log(`成功添加 ${result.templates.length} 個文案模板選項`);
			} else {
				console.log('沒有找到任何模板');
			}
		} else {
			console.error('API 返回失敗:', result.error || '未知錯誤');
		}
	} catch (error) {
		console.error('載入文案模板選項失敗:', error);
		console.error('錯誤詳情:', error.message);
		console.error('錯誤堆疊:', error.stack);
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
	const saveBtn = document.getElementById('saveTemplateBtn');
	
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
	
	// 檢查是否為編輯模式
	const isEditMode = saveBtn && saveBtn.dataset.editMode === 'true';
	const templateId = saveBtn ? saveBtn.dataset.templateId : null;
	
	if (isEditMode && templateId) {
		// 編輯模式：更新現有模板
		updateExistingTemplate(templateId, title, content, hashtags);
	} else {
		// 創建模式：創建新模板
		createNewTemplate(title, content, hashtags);
	}
}

// 創建新模板
function createNewTemplate(title, content, hashtags) {
	// 調用後端API來創建新模板
	const formData = new FormData();
	formData.append('title', title);
	formData.append('content', content);
	formData.append('hashtags', hashtags);
	
	// 添加實際的圖片文件（如果有圖片的話）
	if (window.templateImages && window.templateImages.length > 0) {
		window.templateImages.forEach((image, index) => {
			if (image.file && image.file instanceof File) {
				// 發送實際的圖片文件
				formData.append('images', image.file);
				// 發送圖片順序
				formData.append('image_orders', index.toString());
			}
		});
	}
	
	fetch('/crawler/api/templates/', {
		method: 'POST',
		headers: {
			'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
		},
		body: formData
	})
	.then(response => response.json())
	.then(result => {
		if (result.success) {
			// 顯示成功通知
			window.showNotification('模板保存成功！', 'success');
			
			// 重新載入模板列表
			loadPostTemplates();
			
			// 清空表單
			clearTemplateForm();
		} else {
			window.showNotification('保存失敗：' + (result.error || '未知錯誤'), 'error');
		}
	})
	.catch(error => {
		console.error('保存模板失敗:', error);
		window.showNotification('保存失敗：' + error.message, 'error');
	});
}

// 更新現有模板
function updateExistingTemplate(templateId, title, content, hashtags) {
	// 調用後端API來更新模板
	const updateData = {
		title: title,
		content: content,
		hashtags: hashtags,
		images: window.templateImages || []
	};
	
	fetch(`/crawler/api/templates/${templateId}/update/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
		},
		body: JSON.stringify(updateData)
	})
	.then(response => response.json())
	.then(result => {
		if (result.success) {
			// 顯示成功通知
			window.showNotification('模板更新成功！', 'success');
			
			// 重新載入模板列表
			loadPostTemplates();
			
			// 清空表單並重置編輯模式
			clearTemplateForm();
			resetEditMode();
		} else {
			window.showNotification('更新失敗：' + (result.error || '未知錯誤'), 'error');
		}
	})
	.catch(error => {
		console.error('更新模板失敗:', error);
		window.showNotification('更新失敗：' + error.message, 'error');
	});
}

// 清空表單
function clearTemplateForm() {
	const titleInput = document.querySelector('input[name="copy_title"]');
	const contentTextarea = document.querySelector('textarea[name="copy_template"]');
	const hashtagsInput = document.querySelector('input[name="hashtags"]');
	
	if (titleInput) titleInput.value = '';
	if (contentTextarea) contentTextarea.value = '';
	if (hashtagsInput) hashtagsInput.value = '';
	
	// 清空圖片
	window.templateImages = [];
	const imageUploadArea = document.getElementById('imageUploadArea');
	if (imageUploadArea) {
		imageUploadArea.innerHTML = '<p>拖拽圖片到這裡或點擊選擇檔案</p>';
	}
	
	// 隱藏圖片排序區域
	const imageSortingRow = document.getElementById('imageSortingRow');
	if (imageSortingRow) {
		imageSortingRow.style.display = 'none';
	}
	
	// 更新按鈕狀態
	checkFormEmptyAndUpdateButtons();
}

// 重置編輯模式
function resetEditMode() {
	const saveBtn = document.getElementById('saveTemplateBtn');
	if (saveBtn) {
		saveBtn.innerHTML = '<i class="fas fa-save"></i> 儲存模板';
		delete saveBtn.dataset.editMode;
		delete saveBtn.dataset.templateId;
	}
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
	
	// 顯示預覽 modal，包括圖片信息
	showPreviewModal(title, content, hashtags, window.templateImages || []);
}

// 顯示預覽 Modal
function showPreviewModal(title, content, hashtags, images = []) {
	// 更新 modal 內容
	document.getElementById('modalPreviewTitle').textContent = title;
	document.getElementById('modalPreviewContent').textContent = content;
	
	// 處理標籤
	if (hashtags) {
		document.getElementById('modalPreviewHashtags').innerHTML = `
			<i class="fas fa-hashtag"></i> ${hashtags}
		`;
		document.getElementById('modalPreviewHashtags').style.display = 'block';
	} else {
		document.getElementById('modalPreviewHashtags').style.display = 'none';
	}
	
	// 處理圖片
	if (images && images.length > 0) {
		const imagesGrid = document.getElementById('modalPreviewImagesGrid');
		imagesGrid.innerHTML = '';
		
		images.forEach((image, index) => {
			const imageUrl = image.url || image.alt_text || '';
			if (imageUrl) {
				const imageItem = document.createElement('div');
				imageItem.className = 'preview-image-item';
				imageItem.innerHTML = `
					<img src="${imageUrl}" alt="預覽圖片 ${index + 1}">
					<div class="preview-image-order">${index + 1}</div>
				`;
				imagesGrid.appendChild(imageItem);
			}
		});
		
		document.getElementById('modalPreviewImages').style.display = 'block';
	} else {
		document.getElementById('modalPreviewImages').style.display = 'none';
	}
	
	// 顯示 modal
	document.getElementById('templatePreviewModal').style.display = 'block';
	
	// 防止背景滾動
	document.body.style.overflow = 'hidden';
}

// 關閉預覽 Modal
function closePreviewModal() {
	document.getElementById('templatePreviewModal').style.display = 'none';
	// 恢復背景滾動
	document.body.style.overflow = 'auto';
}

// 使用預覽內容
function usePreviewContent() {
	// 這裡可以添加邏輯來將預覽的內容應用到發文表單
	window.showNotification('預覽內容已準備就緒', 'success');
	closePreviewModal();
}

function handleClearTemplate() {
	// 清空所有輸入欄位和圖片
	clearTemplateForm();
	
	// 重置編輯模式
	resetEditMode();
	
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

// 模板操作函數
function editTemplate(templateId) {
	// 從後端獲取模板詳細信息
	fetch(`/crawler/api/templates/${templateId}/`)
		.then(response => response.json())
		.then(template => {
			if (template.success) {
				// 填充表單
				const titleInput = document.querySelector('input[name="copy_title"]');
				const contentTextarea = document.querySelector('textarea[name="copy_template"]');
				const hashtagsInput = document.querySelector('input[name="hashtags"]');
				
				if (titleInput) titleInput.value = template.template.title || '';
				if (contentTextarea) contentTextarea.value = template.template.content || '';
				if (hashtagsInput) hashtagsInput.value = template.template.hashtags || '';
				
				// 載入模板圖片到排序區域
				if (template.template.images && template.template.images.length > 0) {
					// 更新全局圖片數組
					window.templateImages = template.template.images.map((image, index) => ({
						...image,
						order: index
					}));
					
					// 顯示圖片排序區域
					const imageSortingRow = document.getElementById('imageSortingRow');
					if (imageSortingRow) {
						imageSortingRow.style.display = 'block';
					}
					
					// 更新圖片排序容器
					const imageSortingContainer = document.getElementById('imageSortingContainer');
					if (imageSortingContainer) {
						let html = '';
						window.templateImages.forEach((image, index) => {
							html += `
								<div class="sortable-image" data-index="${index}" draggable="true">
									<img src="${image.url}" alt="模板圖片 ${index + 1}">
									<div class="image-order">${index + 1}</div>
									<button type="button" class="remove-image-btn" onclick="removeTemplateImage(${index})">
										<i class="fas fa-times"></i>
									</button>
								</div>
							`;
						});
						imageSortingContainer.innerHTML = html;
						
						// 初始化拖拽排序功能
						initializeImageSorting();
					}
					
					// 更新圖片上傳區域顯示
					const imageUploadArea = document.getElementById('imageUploadArea');
					if (imageUploadArea) {
						imageUploadArea.innerHTML = `
							<p>已載入 ${window.templateImages.length} 張圖片</p>
							<small>點擊選擇檔案添加更多圖片</small>
						`;
					}
				} else {
					// 如果沒有圖片，清空相關區域
					window.templateImages = [];
					const imageSortingRow = document.getElementById('imageSortingRow');
					if (imageSortingRow) {
						imageSortingRow.style.display = 'none';
					}
					const imageSortingContainer = document.getElementById('imageSortingContainer');
					if (imageSortingContainer) {
						imageSortingContainer.innerHTML = '';
					}
					const imageUploadArea = document.getElementById('imageUploadArea');
					if (imageUploadArea) {
						imageUploadArea.innerHTML = '<p>拖拽圖片到這裡或點擊選擇檔案</p>';
					}
				}
				
				// 更新保存按鈕為編輯模式
				const saveBtn = document.getElementById('saveTemplateBtn');
				if (saveBtn) {
					saveBtn.innerHTML = '<i class="fas fa-save"></i> 更新模板';
					saveBtn.dataset.editMode = 'true';
					saveBtn.dataset.templateId = templateId;
				}
				
				// 自動滾動到"文案設定"標題
				const copyHeader = document.querySelector('.content-header h2');
				if (copyHeader) {
					// 使用平滑滾動效果，滾動到"文案設定"標題
					copyHeader.scrollIntoView({ 
						behavior: 'smooth', 
						block: 'start' 
					});
				}
				
				// 顯示通知
				window.showNotification('模板已載入到編輯表單', 'info');
				
				// 檢查表單狀態
				checkFormEmptyAndUpdateButtons();
			} else {
				window.showNotification('載入模板失敗：' + (template.error || '未知錯誤'), 'error');
			}
		})
		.catch(error => {
			console.error('載入模板失敗:', error);
			window.showNotification('載入模板失敗：' + error.message, 'error');
		});
}

function deleteTemplate(templateId) {
	if (!confirm('確定要刪除此模板嗎？此操作無法撤銷。')) {
		return;
	}
	
	// 從後端刪除模板
	fetch(`/crawler/api/templates/${templateId}/delete/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
		}
	})
	.then(response => response.json())
	.then(result => {
		if (result.success) {
			window.showNotification('模板已刪除', 'success');
			// 重新載入模板列表
			loadPostTemplates();
		} else {
			window.showNotification('刪除失敗：' + (result.error || '未知錯誤'), 'error');
		}
	})
	.catch(error => {
		console.error('刪除模板失敗:', error);
		window.showNotification('刪除失敗：' + error.message, 'error');
	});
}

function copyTemplate(templateId) {
	// 從後端獲取模板詳細信息
	fetch(`/crawler/api/templates/${templateId}/`)
		.then(response => response.json())
		.then(template => {
			if (template.success) {
				// 準備新模板數據
				const newTitle = `${template.template.title} (複製)`;
				const newContent = template.template.content;
				const newHashtags = template.template.hashtags;
				const newImages = template.template.images || [];
				
				// 創建新模板
				createNewTemplateFromCopy(newTitle, newContent, newHashtags, newImages);
			} else {
				window.showNotification('複製模板失敗：' + (template.error || '未知錯誤'), 'error');
			}
		})
		.catch(error => {
			console.error('複製模板失敗:', error);
			window.showNotification('複製模板失敗：' + error.message, 'error');
		});
}

// 從複製的模板創建新模板
function createNewTemplateFromCopy(title, content, hashtags, images) {
	// 準備表單數據
	const formData = new FormData();
	formData.append('title', title);
	formData.append('content', content);
	formData.append('hashtags', hashtags);
	
	// 添加圖片URLs（用於複製功能）
	if (images && images.length > 0) {
		images.forEach(image => {
			if (image.url) {
				formData.append('image_urls', image.url);
			}
		});
	}
	
	// 調用後端API創建新模板
	fetch('/crawler/api/templates/', {
		method: 'POST',
		headers: {
			'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
		},
		body: formData
	})
	.then(response => response.json())
	.then(result => {
		if (result.success) {
			// 顯示成功通知
			window.showNotification('模板複製成功！', 'success');
			
			// 重新載入模板列表
			loadPostTemplates();
			
			// 清空表單
			clearTemplateForm();
			
			// 滾動到"已儲存的模板"標題位置
			setTimeout(() => {
				const savedTemplatesSection = document.querySelector('.saved-templates-section');
				if (savedTemplatesSection) {
					savedTemplatesSection.scrollIntoView({ 
						behavior: 'smooth', 
						block: 'start' 
					});
				}
			}, 500); // 等待模板列表重新載入完成
		} else {
			window.showNotification('複製失敗：' + (result.error || '未知錯誤'), 'error');
		}
	})
	.catch(error => {
		console.error('複製模板失敗:', error);
		window.showNotification('複製失敗：' + error.message, 'error');
	});
}

function previewTemplate(templateId) {
	// 從後端獲取模板詳細信息
	fetch(`/crawler/api/templates/${templateId}/`)
		.then(response => response.json())
		.then(template => {
			if (template.success) {
				// 顯示預覽 modal，包括圖片信息
				showPreviewModal(
					template.template.title,
					template.template.content,
					template.template.hashtags,
					template.template.images || []
				);
				
				// 顯示成功通知
				window.showNotification('模板預覽已載入', 'success');
			} else {
				window.showNotification('預覽模板失敗：' + (template.error || '未知錯誤'), 'error');
			}
		})
		.catch(error => {
			console.error('預覽模板失敗:', error);
			window.showNotification('預覽模板失敗：' + error.message, 'error');
		});
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

// 圖片拖拽排序功能
function initializeImageSorting() {
	const imageSortingContainer = document.getElementById('imageSortingContainer');
	if (!imageSortingContainer) return;
	
	// 綁定拖拽事件
	imageSortingContainer.addEventListener('dragstart', handleImageSortDragStart);
	imageSortingContainer.addEventListener('dragover', handleImageSortDragOver);
	imageSortingContainer.addEventListener('drop', handleImageSortDrop);
	imageSortingContainer.addEventListener('dragenter', handleImageSortDragEnter);
	imageSortingContainer.addEventListener('dragleave', handleImageSortDragLeave);
	
	// 防止拖拽事件冒泡到上傳區域
	imageSortingContainer.addEventListener('dragstart', (e) => {
		e.stopPropagation();
	});
	imageSortingContainer.addEventListener('dragover', (e) => {
		e.stopPropagation();
	});
	imageSortingContainer.addEventListener('drop', (e) => {
		e.stopPropagation();
	});
}

// 拖拽開始
function handleImageSortDragStart(e) {
	const sortableImage = e.target.closest('.sortable-image');
	if (sortableImage) {
		draggedImageIndex = parseInt(sortableImage.dataset.index);
		e.dataTransfer.effectAllowed = 'move';
		sortableImage.classList.add('dragging');
		
		// 設置拖拽數據，防止被當作檔案處理
		e.dataTransfer.setData('text/plain', 'image-sort');
		e.dataTransfer.setData('application/x-image-sort', draggedImageIndex.toString());
		
		console.log('開始拖拽圖片，索引:', draggedImageIndex);
	}
}

// 拖拽懸停
function handleImageSortDragOver(e) {
	e.preventDefault();
	e.stopPropagation();
	e.dataTransfer.dropEffect = 'move';
}

// 拖拽進入
function handleImageSortDragEnter(e) {
	e.preventDefault();
	e.stopPropagation();
	const sortableImage = e.target.closest('.sortable-image');
	if (sortableImage) {
		sortableImage.classList.add('drag-over');
	}
}

// 拖拽離開
function handleImageSortDragLeave(e) {
	e.stopPropagation();
	const sortableImage = e.target.closest('.sortable-image');
	if (sortableImage) {
		sortableImage.classList.remove('drag-over');
	}
}

// 拖拽放下
function handleImageSortDrop(e) {
	e.preventDefault();
	e.stopPropagation();
	
	// 檢查是否為圖片排序拖拽
	if (e.dataTransfer.getData('application/x-image-sort')) {
		const draggedElement = document.querySelector('.sortable-image.dragging');
		if (!draggedElement || draggedImageIndex === null) return;
		
		const targetElement = e.target.closest('.sortable-image');
		if (!targetElement) return;
		
		const targetIndex = parseInt(targetElement.dataset.index);
		
		// 移除拖拽樣式
		draggedElement.classList.remove('dragging');
		targetElement.classList.remove('drag-over');
		
		// 如果拖拽到不同位置
		if (draggedImageIndex !== targetIndex) {
			console.log(`將圖片從位置 ${draggedImageIndex} 移動到位置 ${targetIndex}`);
			
			// 重新排序圖片數組
			const draggedImage = window.templateImages[draggedImageIndex];
			window.templateImages.splice(draggedImageIndex, 1);
			window.templateImages.splice(targetIndex, 0, draggedImage);
			
			// 更新所有圖片的order屬性
			window.templateImages.forEach((image, index) => {
				image.order = index;
			});
			
			// 重新渲染圖片排序區域
			renderImageSortingArea();
		}
		
		draggedImageIndex = null;
	}
}

// 重新渲染圖片排序區域
function renderImageSortingArea() {
	const imageSortingContainer = document.getElementById('imageSortingContainer');
	if (!imageSortingContainer) return;
	
	let html = '';
	window.templateImages.forEach((image, index) => {
		html += `
			<div class="sortable-image" data-index="${index}" draggable="true">
				<img src="${image.url}" alt="模板圖片 ${index + 1}">
				<div class="image-order">${index + 1}</div>
				<button type="button" class="remove-image-btn" onclick="removeTemplateImage(${index})">
					<i class="fas fa-times"></i>
				</button>
			</div>
		`;
	});
	imageSortingContainer.innerHTML = html;
	
	// 重新初始化拖拽功能，確保新添加的圖片元素有拖拽功能
	initializeImageSorting();
	
	console.log('圖片排序區域已重新渲染，圖片數量:', window.templateImages.length);
}

// 移除模板圖片
function removeTemplateImage(index) {
	if (confirm('確定要移除此圖片嗎？')) {
		// 從數組中移除圖片
		window.templateImages.splice(index, 1);
		
		// 更新剩餘圖片的order屬性
		window.templateImages.forEach((image, newIndex) => {
			image.order = newIndex;
		});
		
		// 重新渲染圖片排序區域
		renderImageSortingArea();
		
		// 更新圖片上傳區域顯示
		updateImageUploadAreaDisplay();
		
		// 如果沒有圖片了，隱藏排序區域
		if (window.templateImages.length === 0) {
			const imageSortingRow = document.getElementById('imageSortingRow');
			if (imageSortingRow) {
				imageSortingRow.style.display = 'none';
			}
		}
		
		// 檢查表單狀態
		checkFormEmptyAndUpdateButtons();
		
		window.showNotification('圖片已移除', 'info');
	}
}

// 更新圖片上傳區域顯示
function updateImageUploadAreaDisplay() {
	const imageUploadArea = document.getElementById('imageUploadArea');
	if (imageUploadArea) {
		if (window.templateImages && window.templateImages.length > 0) {
			imageUploadArea.innerHTML = `
				<p>已載入 ${window.templateImages.length} 張圖片</p>
				<small>點擊選擇檔案添加更多圖片</small>
			`;
		} else {
			imageUploadArea.innerHTML = '<p>拖拽圖片到這裡或點擊選擇檔案</p>';
		}
	}
}

// 導出全局函數
window.loadCopyTemplates = loadCopyTemplates;
window.loadPostTemplates = loadPostTemplates;
window.loadTemplates = loadPostTemplates; // 為了向後兼容，添加別名
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
window.editTemplate = editTemplate;
window.deleteTemplate = deleteTemplate;
window.copyTemplate = copyTemplate;
window.previewTemplate = previewTemplate;
window.createNewTemplate = createNewTemplate;
window.updateExistingTemplate = updateExistingTemplate;
window.clearTemplateForm = clearTemplateForm;
window.resetEditMode = resetEditMode;
window.initializeImageSorting = initializeImageSorting;
window.handleImageSortDragStart = handleImageSortDragStart;
window.handleImageSortDragOver = handleImageSortDragOver;
window.handleImageSortDrop = handleImageSortDrop;
window.handleImageSortDragEnter = handleImageSortDragEnter;
window.handleImageSortDragLeave = handleImageSortDragLeave;
window.renderImageSortingArea = renderImageSortingArea;
window.removeTemplateImage = removeTemplateImage;
window.updateImageUploadAreaDisplay = updateImageUploadAreaDisplay;
window.createNewTemplateFromCopy = createNewTemplateFromCopy;
window.showPreviewModal = showPreviewModal;
window.closePreviewModal = closePreviewModal;
window.usePreviewContent = usePreviewContent;
