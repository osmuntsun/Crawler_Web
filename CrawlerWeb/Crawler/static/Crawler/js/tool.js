// tool.js - 主要模組載入器
// 這個檔案現在作為模組載入器，引入所有分離的功能模組

console.log('爬蟲工具模組載入器已啟動');

// 檢查關鍵模組是否已載入
function checkModulesLoaded() {
	const requiredModules = [
		'window.showNotification',
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
		console.log('等待模組載入:', missingModules);
			return false;
		}

	console.log('關鍵模組已載入完成');
		return true;
	}

// 等待模組載入完成後初始化
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


