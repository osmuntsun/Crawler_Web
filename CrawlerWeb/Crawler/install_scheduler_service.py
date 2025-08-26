#!/usr/bin/env python
"""
安裝排程執行器為 Windows 服務
需要管理員權限運行
"""

import os
import sys
import winreg
import subprocess
from pathlib import Path

def install_windows_service():
    """安裝排程執行器為 Windows 服務"""
    
    # 獲取腳本路徑
    script_path = Path(__file__).resolve()
    scheduler_script = script_path.parent / 'start_scheduler.py'
    
    # 檢查腳本是否存在
    if not scheduler_script.exists():
        print(f'錯誤：找不到排程執行器腳本 {scheduler_script}')
        return False
    
    # 服務名稱和描述
    service_name = "CrawlerScheduler"
    service_display_name = "Crawler 排程執行器"
    service_description = "自動執行排程發文的 Django 服務"
    
    try:
        # 使用 sc 命令創建服務
        cmd = [
            'sc', 'create', service_name,
            'binPath=', f'python "{scheduler_script}"',
            'DisplayName=', service_display_name,
            'start=', 'auto'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f'服務 {service_name} 創建成功')
            
            # 設置服務描述
            desc_cmd = ['sc', 'description', service_name, service_description]
            subprocess.run(desc_cmd, capture_output=True)
            
            # 啟動服務
            start_cmd = ['sc', 'start', service_name]
            start_result = subprocess.run(start_cmd, capture_output=True, text=True)
            
            if start_result.returncode == 0:
                print(f'服務 {service_name} 啟動成功')
            else:
                print(f'服務啟動失敗: {start_result.stderr}')
            
            return True
        else:
            print(f'服務創建失敗: {result.stderr}')
            return False
            
    except Exception as e:
        print(f'安裝服務時發生錯誤: {str(e)}')
        return False

def uninstall_windows_service():
    """卸載 Windows 服務"""
    
    service_name = "CrawlerScheduler"
    
    try:
        # 停止服務
        stop_cmd = ['sc', 'stop', service_name]
        subprocess.run(stop_cmd, capture_output=True)
        
        # 刪除服務
        delete_cmd = ['sc', 'delete', service_name]
        result = subprocess.run(delete_cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f'服務 {service_name} 卸載成功')
            return True
        else:
            print(f'服務卸載失敗: {result.stderr}')
            return False
            
    except Exception as e:
        print(f'卸載服務時發生錯誤: {str(e)}')
        return False

def check_service_status():
    """檢查服務狀態"""
    
    service_name = "CrawlerScheduler"
    
    try:
        cmd = ['sc', 'query', service_name]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f'服務狀態:\n{result.stdout}')
        else:
            print(f'無法查詢服務狀態: {result.stderr}')
            
    except Exception as e:
        print(f'檢查服務狀態時發生錯誤: {str(e)}')

def main():
    """主函數"""
    
    print("Crawler 排程執行器 Windows 服務安裝工具")
    print("=" * 50)
    
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  python install_scheduler_service.py install    # 安裝服務")
        print("  python install_scheduler_service.py uninstall  # 卸載服務")
        print("  python install_scheduler_service.py status     # 檢查服務狀態")
        return
    
    action = sys.argv[1].lower()
    
    if action == 'install':
        print("正在安裝排程執行器服務...")
        if install_windows_service():
            print("安裝完成！")
        else:
            print("安裝失敗！")
    
    elif action == 'uninstall':
        print("正在卸載排程執行器服務...")
        if uninstall_windows_service():
            print("卸載完成！")
        else:
            print("卸載失敗！")
    
    elif action == 'status':
        print("檢查服務狀態...")
        check_service_status()
    
    else:
        print(f"無效的操作: {action}")

if __name__ == '__main__':
    main()
