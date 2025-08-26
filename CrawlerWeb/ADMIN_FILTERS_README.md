# Django 管理頁面篩選器使用說明

## 概述

我們已經在 Django 管理頁面的「排程發文設定」部分添加了兩個新的篩選器：

1. **使用者篩選器** - 按使用者篩選排程
2. **執行日期篩選器** - 按禮拜幾篩選排程

## 使用方法

### 1. 進入管理頁面

1. 在瀏覽器中訪問：`http://localhost:8000/admin/`
2. 使用管理員帳號登入
3. 點擊「排程發文設定」部分

### 2. 使用篩選器

#### **使用者篩選器**
- **位置**：在右側篩選面板的頂部
- **功能**：顯示所有有排程的使用者
- **使用方式**：
  - 點擊「使用者」下拉選單
  - 選擇要篩選的使用者
  - 頁面會自動刷新，只顯示該使用者的排程

#### **執行日期篩選器**
- **位置**：在使用者篩選器下方
- **功能**：按禮拜幾篩選排程
- **選項**：
  - 週一 (monday)
  - 週二 (tuesday)
  - 週三 (wednesday)
  - 週四 (thursday)
  - 週五 (friday)
  - 週六 (saturday)
  - 週日 (sunday)
- **使用方式**：
  - 點擊「執行日期」下拉選單
  - 選擇要篩選的禮拜幾
  - 頁面會自動刷新，只顯示在該日期執行的排程

### 3. 組合篩選

您可以同時使用多個篩選器：

1. **先選擇使用者**：例如選擇「osmunt」
2. **再選擇執行日期**：例如選擇「週一」
3. **結果**：只顯示「osmunt」使用者在「週一」執行的排程

### 4. 清除篩選

- 點擊篩選器旁邊的「清除」按鈕
- 或者選擇篩選器的「全部」選項

## 篩選器技術實現

### 使用者篩選器 (UserFilter)
```python
class UserFilter(admin.SimpleListFilter):
    title = '使用者'
    parameter_name = 'user'
    
    def lookups(self, request, model_admin):
        # 動態獲取所有有排程的使用者
        users = model_admin.model.objects.values_list('user__id', 'user__username').distinct()
        return [(str(user_id), username) for user_id, username in users if user_id and username]
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(user__id=self.value())
        return queryset
```

### 執行日期篩選器 (ExecutionDaysFilter)
```python
class ExecutionDaysFilter(admin.SimpleListFilter):
    title = '執行日期'
    parameter_name = 'execution_days'
    
    def lookups(self, request, model_admin):
        return (
            ('monday', '週一'),
            ('tuesday', '週二'),
            ('wednesday', '週三'),
            ('thursday', '週四'),
            ('friday', '週五'),
            ('saturday', '週六'),
            ('sunday', '週日'),
        )
    
    def queryset(self, request, queryset):
        if self.value():
            # 使用字符串查詢，兼容所有數據庫
            return queryset.filter(execution_days__icontains=self.value())
        return queryset
```

## 篩選器特點

### ✅ 優點
1. **動態使用者列表**：自動顯示所有有排程的使用者
2. **中文標籤**：禮拜幾使用中文顯示，更易理解
3. **數據庫兼容**：支持 SQLite、MySQL、PostgreSQL 等
4. **組合篩選**：可以同時使用多個篩選器
5. **即時更新**：篩選結果即時顯示

### 🔧 技術特性
1. **繼承自 SimpleListFilter**：使用 Django 標準篩選器架構
2. **自動查詢優化**：使用 `distinct()` 避免重複用戶
3. **錯誤處理**：篩選器失敗時不會影響頁面顯示
4. **性能優化**：只查詢必要的字段

## 使用場景示例

### 場景 1：查看特定使用者的排程
1. 選擇「使用者」篩選器
2. 選擇「osmunt」
3. 查看該用戶的所有排程設定

### 場景 2：查看週末的排程
1. 選擇「執行日期」篩選器
2. 選擇「週六」或「週日」
3. 查看所有在週末執行的排程

### 場景 3：查看特定用戶的週一排程
1. 選擇「使用者」篩選器，選擇「osmunt」
2. 選擇「執行日期」篩選器，選擇「週一」
3. 查看「osmunt」用戶在週一執行的排程

## 故障排除

### 常見問題

1. **篩選器不顯示**
   - 檢查 Django 版本是否支持 `SimpleListFilter`
   - 確認 `admin.py` 文件已正確保存

2. **篩選結果為空**
   - 檢查數據庫中是否有排程數據
   - 確認篩選條件是否正確

3. **頁面載入緩慢**
   - 檢查數據庫索引
   - 考慮優化查詢邏輯

### 調試方法

1. **檢查 Django 日誌**
2. **使用 Django Debug Toolbar**
3. **運行測試腳本**：`python test_admin_filters.py`

## 總結

新的篩選器為 Django 管理頁面提供了強大的排程管理功能：

- ✅ **使用者篩選**：快速找到特定用戶的排程
- ✅ **日期篩選**：按執行日期組織排程
- ✅ **組合篩選**：靈活的篩選組合
- ✅ **中文界面**：友好的用戶體驗
- ✅ **技術穩定**：兼容各種數據庫

這些篩選器讓管理員能夠更有效地管理和監控排程發文系統！🎯
