// utils.js - 通用工具函數

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
	window.showNotification('文案模板保存成功！', 'success');
	
	// 清空表單
	form.reset();
	
	// 重新載入文案模板
	await window.loadCopyTemplates();
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
function removeImage(index) {
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
}

// 處理步驟2的圖片上傳
function handlePostingImageUpload(e) {
	const files = Array.from(e.target.files);
	const imagePreview = document.getElementById('imagePreview');
	const imagePreviewRow = document.getElementById('imagePreviewRow');
	
	if (files.length === 0) {
		imagePreview.innerHTML = '';
		imagePreviewRow.style.display = 'none';
		return;
	}

	imagePreviewRow.style.display = 'block';
	let html = '';
	files.forEach((file, index) => {
		const reader = new FileReader();
		reader.onload = function(e) {
			const imgElement = document.querySelector(`#posting_preview_${index} img`);
			if (imgElement) {
				imgElement.src = e.target.result;
				// 隱藏載入動畫，顯示圖片
				const loadingDiv = document.querySelector(`#posting_preview_${index} .image-loading`);
				if (loadingDiv) {
					loadingDiv.style.display = 'none';
				}
				imgElement.style.display = 'block';
			}
		};
		reader.readAsDataURL(file);

		html += `
			<div class="image-preview-item" id="posting_preview_${index}" data-file="${JSON.stringify({
				name: file.name,
				size: file.size,
				type: file.type,
				lastModified: file.lastModified
			})}">
				<img src="" alt="預覽圖片" style="display: none;">
				<div class="image-loading">
					<i class="fas fa-spinner fa-spin"></i>
				</div>
				<button type="button" class="remove-image" onclick="removePostingImage(${index})">
					<i class="fas fa-times"></i>
				</button>
			</div>
		`;
	});
	
	imagePreview.innerHTML = html;
}

// 移除步驟2的圖片預覽
function removePostingImage(index) {
	const previewItem = document.getElementById(`posting_preview_${index}`);
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
	
	// 如果沒有圖片了，隱藏預覽行
	if (files.length === 0) {
		document.getElementById('imagePreviewRow').style.display = 'none';
	}
}

// 更新發文平台選項
async function updatePostingPlatforms() {
	const postingPlatformSelect = document.getElementById('platformSelect');
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
			option.textContent = window.getPlatformDisplayName(account.website);
			postingPlatformSelect.appendChild(option);
		});
		
		// 檢查是否有 Facebook 帳號登入
		const hasFacebook = accounts.some(account => 
			account.website === 'facebook' && account.is_active
		);
		
		if (hasFacebook && facebookCommunitiesRow) {
			facebookCommunitiesRow.style.display = 'block';
			// 自動載入 Facebook 社團
			await window.loadFacebookCommunitiesFromDatabase();
		} else if (facebookCommunitiesRow) {
			facebookCommunitiesRow.style.display = 'none';
		}
	} catch (error) {
		console.error('更新發文平台選項失敗:', error);
	}
}

// 處理發文平台選擇變更
function handlePostingPlatformChange() {
	const postingPlatformSelect = document.getElementById('platformSelect');
	const facebookCommunitiesRow = document.getElementById('facebookCommunitiesRow');
	
	if (!postingPlatformSelect || !facebookCommunitiesRow) return;
	
	const selectedPlatform = postingPlatformSelect.value;
	
	if (selectedPlatform === 'facebook') {
		facebookCommunitiesRow.style.display = 'block';
		// 如果還沒有載入社團，則自動載入
		const communitiesList = document.getElementById('communitiesList');
		if (communitiesList && communitiesList.innerHTML.includes('請先登入 Facebook')) {
			window.loadFacebookCommunitiesFromDatabase();
		}
	} else {
		facebookCommunitiesRow.style.display = 'none';
	}
}

// 為表單輸入框添加事件監聽器，檢查內容變化
function bindFormInputListeners() {
	const titleInput = document.querySelector('input[name="copy_title"]');
	const contentTextarea = document.querySelector('textarea[name="copy_template"]');
	const hashtagsInput = document.querySelector('input[name="hashtags"]');
	
	if (titleInput) {
		titleInput.addEventListener('input', window.checkFormEmptyAndUpdateButtons);
	}
	if (contentTextarea) {
		contentTextarea.addEventListener('input', window.checkFormEmptyAndUpdateButtons);
	}
	if (hashtagsInput) {
		hashtagsInput.addEventListener('input', window.checkFormEmptyAndUpdateButtons);
	}
}

// 模板圖片上傳相關函數
function handleTemplateImageUpload(e) {
	const files = Array.from(e.target.files);
	const imageUploadArea = document.getElementById('imageUploadArea');
	
	if (files.length === 0) {
		imageUploadArea.innerHTML = '<p>拖拽圖片到這裡或點擊選擇檔案</p>';
		return;
	}
	
	// 處理選中的圖片檔案
	processTemplateImages(files);
}

function handleDragOver(e) {
	e.preventDefault();
	e.stopPropagation();
	const imageUploadArea = document.getElementById('imageUploadArea');
	if (imageUploadArea) {
		imageUploadArea.style.borderColor = '#667eea';
		imageUploadArea.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
	}
}

function handleDragLeave(e) {
	e.preventDefault();
	e.stopPropagation();
	const imageUploadArea = document.getElementById('imageUploadArea');
	if (imageUploadArea) {
		imageUploadArea.style.borderColor = '#e1e5e9';
		imageUploadArea.style.backgroundColor = 'transparent';
	}
}

function handleDrop(e) {
	e.preventDefault();
	e.stopPropagation();
	
	const imageUploadArea = document.getElementById('imageUploadArea');
	if (imageUploadArea) {
		imageUploadArea.style.borderColor = '#e1e5e9';
		imageUploadArea.style.backgroundColor = 'transparent';
	}
	
	const files = Array.from(e.dataTransfer.files).filter(file => 
		file.type.startsWith('image/')
	);
	
	if (files.length > 0) {
		processTemplateImages(files);
	}
}

function processTemplateImages(files) {
	const imageUploadArea = document.getElementById('imageUploadArea');
	if (!imageUploadArea) return;
	
	// 清空上傳區域
	imageUploadArea.innerHTML = '';
	
	// 創建圖片預覽
	files.forEach((file, index) => {
		const reader = new FileReader();
		reader.onload = function(e) {
			const imgContainer = document.createElement('div');
			imgContainer.className = 'template-image-preview';
			imgContainer.innerHTML = `
				<img src="${e.target.result}" alt="模板圖片 ${index + 1}">
				<button type="button" class="remove-template-image" onclick="removeTemplateImage(${index})">
					<i class="fas fa-times"></i>
				</button>
			`;
			imageUploadArea.appendChild(imgContainer);
		};
		reader.readAsDataURL(file);
	});
	
	// 更新全局變數
	window.templateImages = files;
	
	// 檢查表單狀態
	window.checkFormEmptyAndUpdateButtons();
}

function removeTemplateImage(index) {
	const imageUploadArea = document.getElementById('imageUploadArea');
	if (!imageUploadArea) return;
	
	const imageContainers = imageUploadArea.querySelectorAll('.template-image-preview');
	if (imageContainers[index]) {
		imageContainers[index].remove();
	}
	
	// 更新全局變數
	if (window.templateImages && window.templateImages.length > index) {
		window.templateImages.splice(index, 1);
	}
	
	// 檢查表單狀態
	window.checkFormEmptyAndUpdateButtons();
}

// 導出全局函數
window.handleCopySave = handleCopySave;
window.handleImageUpload = handleImageUpload;
window.removeImage = removeImage;
window.handlePostingImageUpload = handlePostingImageUpload;
window.removePostingImage = removePostingImage;
window.updatePostingPlatforms = updatePostingPlatforms;
window.handlePostingPlatformChange = handlePostingPlatformChange;
window.bindFormInputListeners = bindFormInputListeners;
window.handleTemplateImageUpload = handleTemplateImageUpload;
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;
window.removeTemplateImage = removeTemplateImage;
