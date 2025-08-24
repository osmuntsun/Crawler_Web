# Datanalyze App 前端文件說明

## 文件結構

```
Datanalyze/
├── static/
│   └── Datanalyze/
│       ├── css/
│       │   ├── main.css          # 主要樣式文件
│       │   └── reports.css       # 報表頁面專用樣式
│       └── js/
│           └── main.js           # 主要 JavaScript 功能
└── templates/
    └── Datanalyze/
        ├── dashboard.html         # 數據分析儀表板
        ├── data_analysis.html    # 數據分析頁面
        └── reports.html          # 報表生成頁面
```

## 功能特色

### 1. 響應式設計
- 支援桌面和移動設備
- 使用 CSS Grid 和 Flexbox 佈局
- 自適應網格系統

### 2. 現代化 UI 組件
- 卡片式設計
- 漸變色彩和陰影效果
- 平滑的動畫過渡
- 懸停效果

### 3. 互動功能
- 標籤頁切換
- 數據篩選和排序
- 搜索功能
- 導出功能（CSV、Excel、PDF）

### 4. 數據可視化
- 圖表容器預留
- 統計數據展示
- 響應式圖表佈局

## 使用方法

### 1. 引入 CSS 文件
在 HTML 模板中使用：
```html
{% load static %}
<link rel="stylesheet" href="{% static 'Datanalyze/css/main.css' %}">
<link rel="stylesheet" href="{% static 'Datanalyze/css/reports.css' %}">
```

### 2. 引入 JavaScript 文件
在 HTML 模板中使用：
```html
<script src="{% static 'Datanalyze/js/main.js' %}"></script>
```

### 3. 使用 CSS 類別

#### 佈局類別
- `.container` - 主要容器
- `.row` - 行容器
- `.col`, `.col-md-6`, `.col-md-4`, `.col-md-3` - 列容器

#### 組件類別
- `.card` - 卡片組件
- `.btn` - 按鈕組件
- `.form-group` - 表單組
- `.data-display` - 數據展示組件

#### 狀態類別
- `.btn-primary`, `.btn-success`, `.btn-warning`, `.btn-danger`
- `.status-completed`, `.status-processing`, `.status-error`

### 4. 使用 JavaScript 功能

#### 初始化
```javascript
// 頁面載入完成後自動初始化
document.addEventListener('DOMContentLoaded', function() {
    // 應用已自動初始化
});
```

#### 自定義事件處理
```javascript
// 綁定篩選事件
document.querySelector('.filter-btn').addEventListener('click', function() {
    const filterType = this.getAttribute('data-filter');
    const filterValue = this.getAttribute('data-value');
    // 處理篩選邏輯
});

// 綁定排序事件
document.querySelector('.sort-btn').addEventListener('click', function() {
    const sortField = this.getAttribute('data-sort');
    // 處理排序邏輯
});
```

## 自定義樣式

### 1. 修改主題色彩
在 `main.css` 中修改 CSS 變數：
```css
:root {
    --primary-color: #3498db;
    --success-color: #27ae60;
    --warning-color: #f39c12;
    --danger-color: #e74c3c;
}
```

### 2. 添加新的組件樣式
在對應的 CSS 文件中添加新的樣式規則：
```css
.custom-component {
    background: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

## 瀏覽器支援

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 注意事項

1. 確保 Django 的 `static` 標籤正確載入
2. 檢查 `settings.py` 中的靜態文件配置
3. 在生產環境中運行 `python manage.py collectstatic`
4. JavaScript 功能需要現代瀏覽器支援

## 擴展建議

1. 集成 Chart.js 或 D3.js 實現圖表功能
2. 添加更多導出格式支援
3. 實現實時數據更新
4. 添加用戶偏好設定
5. 實現報表模板系統

## 技術棧

- **CSS**: 原生 CSS3，支援 Grid 和 Flexbox
- **JavaScript**: 原生 ES6+ JavaScript
- **圖表**: 預留 Canvas 元素，可集成第三方圖表庫
- **響應式**: 使用 CSS Media Queries
- **動畫**: CSS3 Transitions 和 Animations
