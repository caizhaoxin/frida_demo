import time
from typing import List
import frida
import base64
from xml.dom.minidom import parse
import os
import json

# apk_name = 'com.cns.mc.activity'
apk_name = 'com.ssports.mobile.video'
js_script = 'dynamic_taint.js'
sink_file = 'my_sink.txt'
share_content_list = []

# Mac
# android_sdk = '/Users/wujiangrong/Library/Android/sdk/platforms'


# window
android_sdk = r'C:\Users\xinxin\AppData\Local\Android\Sdk\platforms'


# 这个地方是接受hook微信分享内容的处理函数
def my_message_handler(message, payload):
    if message["type"] == "send":
        # 传进来的是一个share_json
        share_json = message["payload"]
        # print(share_json)
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

        # 通过处理得到share content list
        for item in share_json_list:
            share_content = item.split('=', 1)[1]
            share_content_list.append(share_content)
            

        # print("share_content_list = " + str(share_content_list))
        # print(share_json)
        # script.post({"my_data": share_content_list})
        # share_content = json.loads(share_json)
        # print(share_content)

        # print( 'message:', message)
        # script.post({"my_data": message["payload"]})


# ([B,[[B,[Ljava.lang.String;,[[Ljava.lang.String;)

# 用于转化单个参数
# if 方法名是构造方法，则  <init> -> $init 
# if 类型不是数组类型： 直接返回
# else 基本类型：[特殊标志
#      类类型：[L类名;
def trans_standard_to_smail_form(str: str) -> str:
    str = ''.join(str.split())
    # 构造函数，直接转换并返回
    if str == '<init>':
        return '$init'
    if '[' not in str:
        return str
    # 左括号的数量
    left_bracket_num = 0
    # 数左括号的数量
    for c in str:
        if c == '[':
            left_bracket_num +=1
    # 清除所有左右括号
    str = str.replace('[','')
    str = str.replace(']','')
    # 类类型
    if '.' in str:
        str = 'L' + str + ';'
    # 基本类型
    else:
        tran_dic = {
            'boolean': 'Z',
            'byte': 'B',
            'char': 'C',
            'double': 'D',
            'float': 'F',
            'int': 'I',
            'long': 'J',
            'short': 'S',
        }
        for key,val in tran_dic.items():
            if key in str:
                str = str.replace(key, val)
    # 添加左括号到左边
    for time in range(left_bracket_num):
        str = '[' + str
    return str

# 处理全部
def transform(str: str) -> str:
    str = ''.join(str.split())
    # 返回值类型，有(开头
    if '(' in str:
        arr = []
        arr = str[1:len(str)-1].split(',')
        for i in range(len(arr)):
            arr[i] = trans_standard_to_smail_form(arr[i])
        str = ','.join(arr)
        str = '('+str+')'
    else:
        str = trans_standard_to_smail_form(str)
    return str

def read_sink_file() -> List:
    hook_info = []
    with open(sink_file, encoding='utf-8') as f:
        line = f.readline()
        while line:
            d = dict()
            if line != '' and line[0] == '<':
                items = line.split()
                # ['<net.sourceforge.pebble.domain.Comment:', 'void', 'setAuthenticated(boolean)>', '->', '_SINK_']
                d['targetClass'] = transform(items[0][1:len(items[0]) - 1])
                left_bracket_index = 0
                while items[2][left_bracket_index] != '(':
                    left_bracket_index += 1
                d['targetReturn'] = transform(items[1])
                d['targetMethod'] = transform(items[2][0:left_bracket_index])
                d['targetArguments'] = transform(items[2][left_bracket_index:len(items[2]) - 1])
                hook_info.append(d)
            line = f.readline()
    return hook_info

command = ""
first_click = True

system_code = input(
    "please input your operating System\n 1:Mac Os \n 2:Window Os \n")

while 1 == 1:
    isok = input(
        "please open the app you want to check and input any key to continue...")
    script_assigned = False
    while True:
        command = input(
            "Enter command:\n \
                    1: Exit\n \
                    2: start hook and hook sensitive function\n \
                    3: get share content\n \
                    4: get package name and get sensitive function\n \
                    5: start frida\n \
                    choice:")
        if command == "1":
            break
        elif command == "2":  # 在这里调用
            hook_info = []
            hook_info = read_sink_file()
            print(script.exports)
            script.exports.hookentry(hook_info)
            # print("please do a share again")
        elif command == "3":
            if first_click:
                isok = input(
                    "please do a share action and input 1 after sharing\n")
                if isok == '1':
                    script.exports.getsharecontent(share_content_list)
                    first_click = False
                else:
                    continue
            else:
                script.exports.getsharecontent(share_content_list)
        elif command == "4":
            print("reading the apk...")
            if system_code == "1":
                command_line = "adb shell dumpsys activity top | grep ACTIVITY > ./activity.txt"
                os.system(command_line)
            else:
                command_line = "adb shell dumpsys activity top | findstr ACTIVITY > ./activity.txt"
                os.system(command_line)
            
            f = open('./activity.txt', 'r')
            line = f.readline()
            last_line = line
            while line:
                last_line = line
                line = f.readline()
            f.close()

            split_list = last_line.split(" ")
            package_activity = split_list[3]
            package = package_activity.split("/")[0]
            apk_name = package
            print(apk_name)

            command_line1 = "adb shell pm path " + package + " > ./app_location.txt"
            os.system(command_line1)

            f = open('./app_location.txt', 'r')
            line = f.readline()
            f.close()

            location = line[8:len(line)]
            print(location)

            command_line2 = "adb pull " + location
            os.system(command_line2)

            excute_command = "java -Djava.ext.dirs=libs/ AndroidInstrument " + android_sdk + \
                             " base.apk method_body.txt my_sink.txt static_filter_sensitive_function.py"
            os.system(excute_command)

            execute_match = "python static_filter_sensitive_function.py method_body.txt my_sink1.txt"
            os.system(execute_match)

            filter_execute = "python filter_useless_method.py " + package
            os.system(filter_execute)

        elif command == "5":
            device = frida.get_usb_device()
            pid = device.spawn([apk_name])
            device.resume(pid)
            time.sleep(1)
            session = device.attach(pid)
            with open(js_script, encoding='utf-8') as f:
                script = session.create_script(f.read(), runtime = "v8")
            script.on("message", my_message_handler)
            script.load()
        elif command == "6":
            script.exports.printtaintlist()

        print("--------------------------------------------------")
