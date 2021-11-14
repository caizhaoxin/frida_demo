import time
import frida
from datetime import datetime
import os

apk_name = 'com.ssports.mobile.video'
cls_met_name = 'com.ssports.mobile.video.share.-$$Lambda$ShareDialog$ozr0h1Q2S_Y5_ihq7DdwElE4Oy0'

# 运行时参数，别动！
dt_ms = ''
#############

def set_dt_ms():
    global dt_ms
    dt_ms = "{}_{}".format(apk_name, datetime.now().strftime('%Y_%m_%d_%H_%M_%S_%f')) # 含微秒的日期时间，来源 比特量化
    dt_ms = dt_ms.replace('.', '_')
    print(dt_ms)

def method_select(message, payload):
    data = message['payload']
    type = data['method']
    if type=='get_cls_met_name':
        get_cls_met_name()
    elif type=='pull_trace':
        pull_trace()

def get_cls_met_name():
    # print(message)
    data = {'cls_met_name': cls_met_name,
            'trace_file_name': dt_ms}
    script.post(data)  # 将JSON对象发送回去

def pull_trace():
    print('pulling trace file')
    os.system('adb pull /sdcard/Android/data/{}/files/{}.trace .'.format(apk_name, dt_ms))
    print('creating trace txt')
    os.system('java -jar trace2txt.jar -s {}.trace -t {}.txt -f'.format(dt_ms, dt_ms))
    print('done!')
    # print('adb pull /sdcard/Android/data/{}/files/{}.trace .'.format(apk_name, dt_ms))
    script.post({})  # 将JSON对象发送回去
    # trace_file_name = str.replace('.', '_')

set_dt_ms()
device = frida.get_usb_device()
pid = device.spawn([apk_name])
device.resume(pid)
print('--------------sleep 1s to start---------------')
time.sleep(1)
session = device.attach(pid)
with open("trace.js",'r',encoding='UTF-8') as f:
    script = session.create_script(f.read())
script.on("message", method_select)  # 注册消息处理函数
script.load()


# os.system('adb pull /sdcard/Android/data/com.ssports.mobile.video/files/aaa.trace .')
input()





