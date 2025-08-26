# Crawler 排程執行器使用說明

## 概述

這個排程執行器完全由 Django 管理，不需要依賴 Windows 任務計劃或其他外部系統。它可以自動檢查和執行排程發文任務。

## 功能特點

- ✅ **完全 Django 內建**：不需要外部依賴
- ✅ **自動執行**：根據設定的日期和時間自動發布
- ✅ **智能檢查**：每分鐘檢查一次是否有需要執行的排程
- ✅ **錯誤處理**：自動重試和錯誤記錄
- ✅ **執行記錄**：詳細記錄每次執行的結果
- ✅ **多種運行模式**：支持單次檢查和持續運行

## 使用方法

### 方法 1：直接運行管理命令（推薦用於測試）

```bash
# 進入 Django 專案目錄
cd Crawler

# 執行單次檢查
python manage.py run_scheduler

# 持續運行模式（每分鐘檢查一次）
python manage.py run_scheduler --continuous

# 自定義檢查間隔（每30秒檢查一次）
python manage.py run_scheduler --continuous --interval 30
```

### 方法 2：使用啟動腳本

```bash
# 直接運行啟動腳本
python start_scheduler.py
```

### 方法 3：安裝為 Windows 服務（推薦用於生產環境）

```bash
# 以管理員身份運行命令提示字元

# 安裝服務
python install_scheduler_service.py install

# 檢查服務狀態
python install_scheduler_service.py status

# 卸載服務
python install_scheduler_service.py uninstall
```

## 服務管理

### 使用 Windows 服務管理器

1. 按 `Win + R`，輸入 `services.msc`
2. 找到 "Crawler 排程執行器" 服務
3. 右鍵選擇啟動、停止或重啟

### 使用命令行

```bash
# 啟動服務
sc start CrawlerScheduler

# 停止服務
sc stop CrawlerScheduler

# 重啟服務
sc stop CrawlerScheduler && sc start CrawlerScheduler

# 檢查服務狀態
sc query CrawlerScheduler
```

## 排程設定

### 在 Django 管理介面中

1. 登入 Django 管理介面
2. 進入 "排程發文設定" 部分
3. 創建新的排程：
   - 選擇執行日期（週一到週日）
   - 設定發文時間（24小時制，如 09:00, 14:30）
   - 選擇目標社群
   - 設定發文內容和圖片

### 排程格式

- **執行日期**：`['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']`
- **發文時間**：`['09:00', '14:30', '18:00']`
- **狀態**：`active`（啟用）、`paused`（暫停）、`cancelled`（取消）

## 執行邏輯

### 檢查流程

1. **時間檢查**：每分鐘檢查一次當前時間
2. **日期匹配**：檢查是否為設定的執行日期
3. **時間匹配**：檢查是否為設定的發文時間（容錯5分鐘）
4. **執行發文**：自動向目標社群發布內容

### 執行記錄

每次執行都會創建 `ScheduleExecution` 記錄，包含：
- 執行時間
- 執行狀態（started, completed, failed）
- 成功發布數量
- 失敗數量
- 錯誤信息

## 日誌和監控

### 日誌文件

- **Django 日誌**：在 Django 設定中配置
- **排程執行器日誌**：`scheduler.log`（如果使用啟動腳本）
- **Windows 服務日誌**：在事件檢視器中查看

### 監控建議

1. **定期檢查日誌**：確保沒有錯誤
2. **監控執行記錄**：檢查成功率和失敗原因
3. **檢查服務狀態**：確保服務正常運行

## 故障排除

### 常見問題

1. **服務無法啟動**
   - 檢查 Python 路徑是否正確
   - 確認有管理員權限
   - 檢查 Django 設定是否正確

2. **排程不執行**
   - 檢查排程狀態是否為 `active`
   - 確認執行日期和時間設定正確
   - 檢查用戶是否有有效的 Cookie

3. **發文失敗**
   - 檢查 Facebook Cookie 是否過期
   - 確認社群連結是否有效
   - 檢查網路連接

### 調試模式

```bash
# 啟用詳細日誌
python manage.py run_scheduler --continuous --verbosity 2

# 檢查特定排程
python manage.py shell
>>> from Crawler.models import Schedule
>>> schedule = Schedule.objects.get(id=1)
>>> print(schedule.execution_days, schedule.posting_times)
```

## 性能優化

### 建議設定

- **檢查間隔**：生產環境建議 60 秒
- **並發處理**：目前是順序執行，避免被 Facebook 檢測
- **錯誤重試**：自動重試機制，避免單次失敗

### 資源使用

- **記憶體**：每個 Chrome 實例約 100-200MB
- **CPU**：主要在發文時使用
- **網路**：需要穩定的網路連接

## 安全注意事項

1. **Cookie 安全**：定期更新 Facebook Cookie
2. **權限控制**：只有授權用戶可以創建排程
3. **日誌保護**：避免日誌中暴露敏感信息
4. **網路安全**：確保在安全的網路環境中運行

## 更新和維護

### 定期維護

1. **更新 Cookie**：Facebook Cookie 會過期
2. **檢查日誌**：清理舊的日誌文件
3. **監控性能**：檢查執行效率和成功率
4. **備份設定**：定期備份排程設定

### 版本更新

當更新 Django 專案時：
1. 停止排程服務
2. 更新代碼和依賴
3. 執行資料庫遷移
4. 重啟排程服務

## 聯繫支持

如果遇到問題，請檢查：
1. Django 錯誤日誌
2. 排程執行器日誌
3. Windows 服務日誌
4. 網路連接狀態

---

**注意**：這個排程執行器完全由 Django 管理，不需要外部任務計劃系統。它會自動在背景運行，確保你的排程發文按時執行。
