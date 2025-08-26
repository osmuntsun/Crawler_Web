# Selenium Headless 模式使用說明

## 🎯 概述

我們已經成功將排程發文設定為使用 **Headless 模式**，這意味著排程發文時不會彈出瀏覽器視窗，會在背景默默執行，不會打擾您的工作。

## 🔧 技術實現

### **修改的文件**
- `Crawler/views.py` - 添加了 headless 參數支持
- `Crawler/management/commands/run_scheduler.py` - 排程發文使用 headless 模式

### **Headless 模式設定**
```python
def _setup_driver(self, headless=False):
    """設置 Chrome 驅動程式"""
    
    options = Options()
    
    if headless:
        # Headless 模式設定（背景執行，不顯示視窗）
        options.add_argument("--headless=new")  # 使用新的 headless 模式
        options.add_argument("--disable-gpu")  # 禁用 GPU 加速
        options.add_argument("--no-sandbox")  # 禁用沙盒模式
        options.add_argument("--disable-dev-shm-usage")  # 禁用共享內存
        options.add_argument("--window-size=1920,1080")  # 設定視窗大小
        options.add_argument("--user-agent=Mozilla/5.0...")  # 設定用戶代理
    else:
        # 正常模式設定
        options.add_argument("--start-maximized")  # 最大化視窗
```

## 📋 使用方法

### **1. 排程發文（自動使用 Headless 模式）**
```python
# 在 run_scheduler.py 中
driver = facebook_view._setup_driver(headless=True)  # 排程發文使用 headless 模式
```

**特點：**
- ✅ **不會彈出瀏覽器視窗**
- ✅ **在背景默默執行**
- ✅ **不會打擾您工作**
- ✅ **適合自動化運行**

### **2. 立即發文（可選擇模式）**
```python
# 在 views.py 中，可以選擇是否使用 headless
driver = self._setup_driver(headless=False)  # 顯示視窗，方便調試
# 或
driver = self._setup_driver(headless=True)   # 背景執行，不干擾
```

## 🎯 使用場景

### **場景 1：上班時間排程發文**
- **使用模式**：Headless 模式
- **效果**：不會彈出瀏覽器視窗
- **優點**：同事不會發現您在自動發文
- **適合**：需要隱密性的場合

### **場景 2：測試和調試**
- **使用模式**：正常模式（非 headless）
- **效果**：可以看到瀏覽器操作過程
- **優點**：方便找出問題所在
- **適合**：開發和測試階段

### **場景 3：服務器環境**
- **使用模式**：必須使用 Headless 模式
- **原因**：服務器通常沒有圖形界面
- **適合**：24/7 自動運行

## 🚀 性能對比

| 模式 | 記憶體使用 | CPU 使用 | 執行速度 | 視覺反饋 | 隱密性 |
|------|------------|----------|----------|----------|--------|
| **正常模式** | 高 | 高 | 中等 | ✅ 完整 | ❌ 低 |
| **Headless 模式** | 低 | 低 | 快 | ❌ 無 | ✅ 高 |

## 🔍 測試 Headless 模式

### **運行測試腳本**
```bash
python test_headless_mode.py
```

**測試內容：**
1. **正常模式測試**：會打開瀏覽器視窗
2. **Headless 模式測試**：不會顯示視窗，背景執行
3. **排程檢查**：驗證排程設定
4. **執行記錄檢查**：查看歷史執行情況

### **手動測試**
```python
# 在 Django shell 中測試
python manage.py shell

from Crawler.views import FacebookAutomationView
facebook_view = FacebookAutomationView()

# 測試 headless 模式
driver = facebook_view._setup_driver(headless=True)
driver.get("https://www.google.com")
print(f"頁面標題: {driver.title}")
driver.quit()
```

## ⚠️ 注意事項

### **1. 調試困難**
- Headless 模式下無法看到瀏覽器操作過程
- 出現問題時較難診斷
- 建議開發階段使用正常模式

### **2. 某些網站可能檢測**
- 部分網站會檢測 headless 模式
- 可能被識別為機器人
- 需要額外的反檢測措施

### **3. 圖片和 JavaScript**
- Headless 模式下某些視覺效果可能不完整
- 複雜的 JavaScript 可能無法正常執行
- 建議根據需要調整設定

## 🎯 最佳實踐

### **開發階段**
```python
# 使用正常模式，方便調試
driver = self._setup_driver(headless=False)
```

### **生產環境**
```python
# 使用 headless 模式，提高效率
driver = self._setup_driver(headless=True)
```

### **混合使用**
```python
# 根據環境變數決定
import os
headless = os.getenv('HEADLESS_MODE', 'false').lower() == 'true'
driver = self._setup_driver(headless=headless)
```

## 📚 相關文檔

- [SCHEDULER_README.md](./SCHEDULER_README.md) - 排程執行器說明
- [ADMIN_FILTERS_README.md](./ADMIN_FILTERS_README.md) - 管理頁面篩選器說明

## 🎉 總結

現在您的排程發文系統已經完全支援 Headless 模式：

- ✅ **排程發文**：自動使用 Headless 模式，不會打擾您工作
- ✅ **立即發文**：可以選擇是否使用 Headless 模式
- ✅ **靈活配置**：根據需要調整執行模式
- ✅ **性能優化**：Headless 模式節省資源，提高效率

享受無干擾的自動化發文體驗！🎯
