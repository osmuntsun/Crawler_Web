// Datanalyze App 主要 JavaScript 功能

document.addEventListener('DOMContentLoaded', function() {
    // 初始化應用
    initApp();
    
    // 綁定事件監聽器
    bindEventListeners();
});

// 初始化應用
function initApp() {
    console.log('Datanalyze App 初始化完成');
    
    // 設置導航標籤
    setupNavigationTabs();
    
    // 初始化圖表
    initCharts();
    
    // 載入初始數據
    loadInitialData();
}

// 綁定事件監聽器
function bindEventListeners() {
    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // 篩選按鈕
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', handleFilter);
    });
    
    // 排序按鈕
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(button => {
        button.addEventListener('click', handleSort);
    });
    
    // 導出按鈕
    const exportButtons = document.querySelectorAll('.export-btn');
    exportButtons.forEach(button => {
        button.addEventListener('click', handleExport);
    });
}

// 設置導航標籤
function setupNavigationTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            
            // 移除所有活動狀態
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');
            
            // 設置當前活動狀態
            this.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });
}

// 處理搜索
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const dataRows = document.querySelectorAll('.data-row');
    
    dataRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// 處理篩選
function handleFilter(event) {
    const filterType = event.target.getAttribute('data-filter');
    const filterValue = event.target.getAttribute('data-value');
    
    console.log(`篩選: ${filterType} = ${filterValue}`);
    
    // 這裡可以實現具體的篩選邏輯
    applyFilter(filterType, filterValue);
}

// 應用篩選
function applyFilter(type, value) {
    // 根據篩選類型和值來過濾數據
    // 這裡可以與後端 API 交互或在前端處理數據
    
    // 示例：顯示載入狀態
    showLoadingState();
    
    // 模擬 API 調用
    setTimeout(() => {
        hideLoadingState();
        updateDataDisplay(type, value);
    }, 1000);
}

// 處理排序
function handleSort(event) {
    const sortField = event.target.getAttribute('data-sort');
    const sortDirection = event.target.getAttribute('data-direction') || 'asc';
    
    console.log(`排序: ${sortField} ${sortDirection}`);
    
    // 切換排序方向
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    event.target.setAttribute('data-direction', newDirection);
    
    // 更新排序圖標
    updateSortIcon(event.target, newDirection);
    
    // 應用排序
    applySort(sortField, newDirection);
}

// 應用排序
function applySort(field, direction) {
    // 實現排序邏輯
    const table = document.querySelector('.data-table');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        const aValue = a.querySelector(`[data-${field}]`).textContent;
        const bValue = b.querySelector(`[data-${field}]`).textContent;
        
        if (direction === 'asc') {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });
    
    // 重新排列行
    rows.forEach(row => tbody.appendChild(row));
}

// 更新排序圖標
function updateSortIcon(button, direction) {
    const icon = button.querySelector('.sort-icon');
    if (icon) {
        icon.textContent = direction === 'asc' ? '↑' : '↓';
    }
}

// 處理導出
function handleExport(event) {
    const exportType = event.target.getAttribute('data-export');
    
    console.log(`導出: ${exportType}`);
    
    // 根據導出類型執行相應操作
    switch (exportType) {
        case 'csv':
            exportToCSV();
            break;
        case 'excel':
            exportToExcel();
            break;
        case 'pdf':
            exportToPDF();
            break;
        default:
            console.log('不支援的導出格式');
    }
}

// 導出為 CSV
function exportToCSV() {
    const table = document.querySelector('.data-table');
    if (!table) return;
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = Array.from(cols).map(col => col.textContent);
        csv.push(rowData.join(','));
    });
    
    const csvContent = csv.join('\n');
    downloadFile(csvContent, 'data.csv', 'text/csv');
}

// 導出為 Excel (簡單實現)
function exportToExcel() {
    // 這裡可以使用 SheetJS 等庫來實現真正的 Excel 導出
    console.log('Excel 導出功能需要額外的庫支援');
}

// 導出為 PDF (簡單實現)
function exportToPDF() {
    // 這裡可以使用 jsPDF 等庫來實現真正的 PDF 導出
    console.log('PDF 導出功能需要額外的庫支援');
}

// 下載文件
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// 顯示載入狀態
function showLoadingState() {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

// 隱藏載入狀態
function hideLoadingState() {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// 更新數據顯示
function updateDataDisplay(filterType, filterValue) {
    // 根據篩選結果更新頁面顯示
    console.log(`更新顯示: ${filterType} = ${filterValue}`);
    
    // 這裡可以更新圖表、統計數據等
    updateCharts(filterType, filterValue);
    updateStatistics(filterType, filterValue);
}

// 初始化圖表
function initCharts() {
    // 這裡可以使用 Chart.js 或其他圖表庫來初始化圖表
    console.log('初始化圖表...');
}

// 更新圖表
function updateCharts(filterType, filterValue) {
    // 根據篩選條件更新圖表
    console.log(`更新圖表: ${filterType} = ${filterValue}`);
}

// 更新統計數據
function updateStatistics(filterType, filterValue) {
    // 根據篩選條件更新統計數據
    console.log(`更新統計: ${filterType} = ${filterValue}`);
}

// 載入初始數據
function loadInitialData() {
    // 載入頁面初始數據
    console.log('載入初始數據...');
    
    // 這裡可以從後端 API 獲取數據
    // fetch('/api/datanalyze/initial-data/')
    //     .then(response => response.json())
    //     .then(data => {
    //         updateDataDisplay(data);
    //     })
    //     .catch(error => {
    //         console.error('載入數據失敗:', error);
    //     });
}

// 工具函數：格式化數字
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// 工具函數：格式化日期
function formatDate(date) {
    return new Date(date).toLocaleDateString('zh-TW');
}

// 工具函數：顯示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 自動移除通知
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
