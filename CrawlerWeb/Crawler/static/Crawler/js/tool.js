// tool.js - 主要模組載入器
// 這個檔案現在作為模組載入器，引入所有分離的功能模組

// 載入順序很重要，確保依賴關係正確
// 1. 首先載入通用工具函數
// 2. 然後載入認證和帳號管理
// 3. 接著載入社團管理
// 4. 然後載入模板管理
// 5. 接著載入發文設定
// 6. 最後載入初始化模組

// 注意：這些腳本標籤應該在HTML中按順序引入
// 或者使用ES6模組系統來管理依賴關係

console.log('爬蟲工具模組載入器已啟動');

// 檢查所有必要模組是否已載入
function checkModulesLoaded() {
	const requiredModules = [
		'window.showNotification',
		'window.handleAccountLogin',
		'window.loadAccountsStatus',
		'window.loadCommunities',
		'window.loadCopyTemplates',
		'window.handleCopySave',
		'window.validateStep1',
		'window.initCrawlerTools'
	];
	
	const missingModules = requiredModules.filter(module => {
		try {
			return !eval(module);
		} catch (e) {
			return true;
		}
	});
	
	if (missingModules.length > 0) {
		console.warn('缺少以下模組:', missingModules);
		return false;
	}
	
	console.log('所有必要模組已載入完成');
	return true;
}

// 等待所有模組載入完成後初始化
function waitForModules() {
	if (checkModulesLoaded()) {
		console.log('開始初始化爬蟲工具...');
		// 模組已載入，可以開始初始化
		return;
	}
	
	// 如果模組還沒載入完成，等待100ms後再檢查
	setTimeout(waitForModules, 100);
}

// 在DOM載入完成後開始檢查模組
document.addEventListener('DOMContentLoaded', function() {
	console.log('DOM載入完成，開始檢查模組...');
	waitForModules();
});

// 導出檢查函數供外部使用
window.checkModulesLoaded = checkModulesLoaded;
window.waitForModules = waitForModules;


