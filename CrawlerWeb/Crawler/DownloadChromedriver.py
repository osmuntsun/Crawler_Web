import sys
import os
import shutil 
import requests
import zipfile



def downloadzip(local,bits,version):
    data = requests.get(f'https://storage.googleapis.com/chrome-for-testing-public/{version}/{local}{bits}/chromedriver-{local}{bits}.zip')

    with open('./chromedriver.zip', 'wb') as file:
        file.write(data.content)
    
    # 針對某些檔案解壓縮
    with zipfile.ZipFile(f'./chromedriver.zip','r') as ZIP:
        list_files = ZIP.namelist()
        for file_name in list_files:
            if file_name.endswith('.exe'):
                ZIP.extract(file_name)
                
    if os.path.exists('./chromedriver.exe'):
        os.remove('./chromedriver.exe')  # 移除檔案
        shutil.move(f"./chromedriver-{local}{bits}/chromedriver.exe","./")
    else:
        shutil.move(f"./chromedriver-{local}{bits}/chromedriver.exe","./")

def judge_bits(local,versions):
    if sys.maxsize > 232:
        downloadzip(local,64,versions)
    else:
        downloadzip(local,32,versions)


def get_chromedriver(versions):
    if  sys.platform.startswith('win32'):
        judge_bits('win',versions)
    elif sys.platform.startswith('darwin'):
        judge_bits('mac-x',versions)
    elif sys.platform.startswith('linux'):
        judge_bits('linux64',versions)
    else:
        print("沒遇過這個作業系統")

