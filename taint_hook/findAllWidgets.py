import time
from typing import List
import frida
import base64
from xml.dom.minidom import parse
import os
import json

# apk_name = 'com.cns.mc.activity'
apk_name = 'com.tongcheng.android'
js_script = 'hookMutilpleFunction.js'
sink_file = 'my_sink.txt'
share_content_list = []


#这个地方是接受hook微信分享内容的处理函数
def my_message_handler(message, payload):
    
    if message["type"] == "send":
        #传进来的是一个share_json
        share_json = message["payload"]
        share_json = share_json[8:len(share_json) - 2]
        
        isthumbdata = False
        index = 0
        
        share_json_list = []
        for i in range(len(share_json)):
            
            if share_json[i] == '[':
                isthumbdata = True
                
            if share_json[i] == ']':
                isthumbdata = False
                
            
            if share_json[i] == ',' and not isthumbdata:
                key_value = share_json[index: i]
                share_json_list.append(key_value)
                index = i + 2
                
        #通过处理得到share content list
        for item in share_json_list:
            share_content = item.split('=', 1)[1]
            share_content_list.append(share_content)
        
        #print("share_content_list = " + str(share_content_list))
        #print(share_json)
        #script.post({"my_data": share_content_list})
        #share_content = json.loads(share_json)
        #print(share_content)
        
        # print( 'message:', message)
        #script.post({"my_data": message["payload"]})

def read_sink_file() -> List:
    hook_info = []
    with open(sink_file, encoding='utf-8') as f:
        line  = f.readline()
        while line:
            d = dict()
            if line!='' and line[0]=='<':
                items = line.split()
                # ['<net.sourceforge.pebble.domain.Comment:', 'void', 'setAuthenticated(boolean)>', '->', '_SINK_']
                d['targetClass'] = items[0][1:len(items[0])-1]
                left_bracket_index = 0
                while items[2][left_bracket_index]!='(':
                    left_bracket_index+=1 
                d['targetMethod'] = items[2][0:left_bracket_index]
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
first_click = True
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
        if first_click:
            isok = input("please do a share action and input 1 after sharing\n")
            if isok == '1':
                script.exports.getsharecontent(share_content_list)
                first_click = False
            else:
                continue

        else:
            script.exports.getsharecontent(share_content_list)
        
        
    
    print("--------------------------------------------------")
