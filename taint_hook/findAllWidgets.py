import time
from typing import List
import frida
import base64
from xml.dom.minidom import parse
import os

# apk_name = 'com.cns.mc.activity'
apk_name = 'cn.demo.login'
js_script = 'hookMutilpleFunction.js'
sink_file = 'my_sink.txt'


def my_message_handler(message, payload):
    # print(message)
    # print(payload)
    if message["type"] == "send":
        # print(message["payload"])
        # print( 'message:', message)
        script.post({"my_data": message["payload"] + "gosec"})

def read_sink_file() -> List:
    hook_info = []
    with open(sink_file, encoding='utf-8') as f:
        line  = f.readline()
        while line:
            d = dict()
            if line!='' and line[0]=='<':
                items = line.split()
                # ['<net.sourceforge.pebble.domain.Comment:', 'void', 'setAuthenticated(boolean)>', '->', '_SINK_'
                left_bracket_index = 0
                while items[2][left_bracket_index]!='(':
                    left_bracket_index+=1 
                # targetClass
                d['targetClass'] = items[0][1:len(items[0])-1]
                # targetMethod
                d['targetMethod'] = items[2][0:left_bracket_index]
                # targetReturn
                d['targetReturn'] = items[1]
                # targetArguments
                d['targetArguments'] = items[2][left_bracket_index:len(items[2])-1]
                hook_info.append(d)
            line = f.readline()
    return hook_info

# hook_info = read_sink_file()
# print(hook_info)

device = frida.get_usb_device()
pid = device.spawn([apk_name])
device.resume(pid)
time.sleep(1)
session = device.attach(pid)
with open(js_script, encoding='utf-8') as f:
    script = session.create_script(f.read())
script.on("message", my_message_handler)
script.load()

command = ""
while 1 == 1:
    command = input(
        "Enter command:\n1: Exit\n2: Call secret function\n3: get share content\nchoice:")
    if command == "1":
        break
    elif command == "2":  # 在这里调用
        hook_info = []
        hook_info.append({'targetClass': 'com.mob.tools.utils.Hashon',
                          'targetMethod': 'fromHashMap',
                          'targetArguments': '(java.util.HashMap)'})
        script.exports.hookentry(hook_info)
    elif command == "3":
        #这个是将当前的页面的内容全部获取，并解析分享的内容
        cmd1 = "adb shell uiautomator dump /sdcard/ui1.xml"
        os.system(cmd1)

        cmd2 = "adb pull /sdcard/ui1.xml ."
        os.system(cmd2)

        # 读取文件
        dom = parse('ui1.xml')
        # 获取文档元素对象
        data = dom.documentElement


        share_content = []
        # 获取 node
        nodes = data.getElementsByTagName('node')

        for node_i in nodes:
            node_text = node_i.getAttribute('text')
            if node_text != "":
                share_content.append(node_text)

        script.exports.getsharecontent(share_content)
    
    print("--------------------------------------------------")
