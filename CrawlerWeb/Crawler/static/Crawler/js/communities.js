// communities.js - 社團管理功能

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
					const platformName = window.getPlatformDisplayName(community.community_type);
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
			window.showNotification(result.message, 'success');
			// 重新載入社團列表
			await loadCommunities();
		} else {
			throw new Error(result.error || '重新整理失敗');
		}
	} catch (error) {
		console.error('重新整理社團失敗:', error);
		window.showNotification('重新整理失敗：' + error.message, 'error');
	} finally {
		// 恢復按鈕狀態
		refreshBtn.disabled = false;
		refreshBtn.innerHTML = originalText;
	}
}

// 獲取 Facebook 社團列表
async function getFacebookCommunities() {
	const getCommunitiesBtn = document.getElementById('getCommunitiesBtn');
	const communitiesList = document.getElementById('communitiesList');
	
	if (!getCommunitiesBtn || !communitiesList) return;
	
	// 顯示載入狀態
	getCommunitiesBtn.disabled = true;
	getCommunitiesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 獲取中...';
	communitiesList.innerHTML = '<div class="communities-loading"><i class="fas fa-spinner fa-spin"></i> 正在獲取社團列表...</div>';
	
	// 發送請求
	fetch('/crawler/api/facebook/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': getCSRFToken()
		},
		body: JSON.stringify({
			action: 'get_communities'
		})
	})
	.then(response => response.json())
	.then(data => {
		if (data.success) {
			// 顯示社團列表
			displayCommunities(data.communities);
			
			// 顯示更新信息
			if (data.added_count > 0 || data.deleted_count > 0) {
				window.showNotification(data.message, 'success');
			}
		} else {
			communitiesList.innerHTML = `<div class="text-danger">${data.error}</div>`;
			window.showNotification(data.error, 'error');
		}
	})
	.catch(error => {
		console.error('獲取社團列表失敗:', error);
		communitiesList.innerHTML = '<div class="text-danger">獲取社團列表失敗</div>';
		window.showNotification('獲取社團列表失敗', 'error');
	})
	.finally(() => {
		// 恢復按鈕狀態
		getCommunitiesBtn.disabled = false;
		getCommunitiesBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 獲取社團列表';
	});
}

// 顯示社團列表
function displayCommunities(communities) {
	const communitiesList = document.getElementById('communitiesList');
	if (!communitiesList) return;
	
	if (!communities || communities.length === 0) {
		communitiesList.innerHTML = '<div class="text-muted">沒有找到任何社團</div>';
		return;
	}
	
	let html = '';
	communities.forEach(community => {
		html += `
			<div class="community-item" data-community-id="${community.url}">
				<input type="checkbox" name="communities" value="${community.url}" onchange="updateCommunitySelectionStyles(); updateSelectionButtonIcons(); validateStep1();">
				<div class="community-info">
					<div class="community-name" title="${community.name}">${community.name}</div>
				</div>
			</div>
		`;
	});
	
	communitiesList.innerHTML = html;
	
	// 初始化按鈕圖標
	updateSelectionButtonIcons();
	
	// 驗證第一步驟
	if (typeof validateStep1 === 'function') {
		validateStep1();
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

// 社團選擇功能
function selectAllCommunities() {
	const checkboxes = document.querySelectorAll('#communitiesList input[type="checkbox"]');
	checkboxes.forEach(checkbox => {
		checkbox.checked = true;
	});
	
	// 更新按鈕圖標
	updateSelectionButtonIcons();
	
	// 更新選中的社團樣式
	updateCommunitySelectionStyles();
	
	// 驗證第一步驟
	if (typeof validateStep1 === 'function') {
		validateStep1();
	}
	
	console.log('已全選所有社團');
}

function deselectAllCommunities() {
	const checkboxes = document.querySelectorAll('#communitiesList input[type="checkbox"]');
	checkboxes.forEach(checkbox => {
		checkbox.checked = false;
	});
	
	// 更新按鈕圖標
	updateSelectionButtonIcons();
	
	// 更新選中的社團樣式
	updateCommunitySelectionStyles();
	
	// 驗證第一步驟
	if (typeof validateStep1 === 'function') {
		validateStep1();
	}
	
	console.log('已取消全選所有社團');
}

function updateSelectionButtonIcons() {
	const selectAllBtn = document.getElementById('selectAllCommunitiesBtn');
	const deselectAllBtn = document.getElementById('deselectAllCommunitiesBtn');
	
	if (!selectAllBtn || !deselectAllBtn) return;
	
	const checkboxes = document.querySelectorAll('#communitiesList input[type="checkbox"]');
	const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
	const totalCount = checkboxes.length;
	
	if (checkedCount === 0) {
		// 沒有選中任何社團
		selectAllBtn.innerHTML = '<i class="fas fa-square"></i> 全選';
		deselectAllBtn.innerHTML = '<i class="fas fa-square"></i> 取消全選';
	} else if (checkedCount === totalCount) {
		// 全選了
		selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> 全選';
		deselectAllBtn.innerHTML = '<i class="fas fa-square"></i> 取消全選';
	} else {
		// 部分選中
		selectAllBtn.innerHTML = '<i class="fas fa-square"></i> 全選';
		deselectAllBtn.innerHTML = '<i class="fas fa-square"></i> 取消全選';
	}
}

function updateCommunitySelectionStyles() {
	const communityItems = document.querySelectorAll('#communitiesList .community-item');
	communityItems.forEach(item => {
		const checkbox = item.querySelector('input[type="checkbox"]');
		if (checkbox.checked) {
			item.classList.add('selected');
		} else {
			item.classList.remove('selected');
		}
	});
	
	// 驗證第一步驟
	if (typeof validateStep1 === 'function') {
		validateStep1();
	}
}

// 獲取 CSRF Token
function getCSRFToken() {
	return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
		   document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
}

// 導出全局函數
window.loadCommunities = loadCommunities;
window.refreshCommunities = refreshCommunities;
window.getFacebookCommunities = getFacebookCommunities;
window.displayCommunities = displayCommunities;
window.loadFacebookCommunitiesFromDatabase = loadFacebookCommunitiesFromDatabase;
window.selectAllCommunities = selectAllCommunities;
window.deselectAllCommunities = deselectAllCommunities;
window.updateSelectionButtonIcons = updateSelectionButtonIcons;
window.updateCommunitySelectionStyles = updateCommunitySelectionStyles;
