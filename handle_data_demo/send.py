import time
import frida

def my_message_handler(message, payload):
    print(message)
    data = message['payload']
    if message["type"] == "send":
        username = data['username']
        password = data['password']
        print('python: ', username, ' ', password)
        data['username'] = 'xinxin'
        data['password'] = '123456'
    script.post(data)  # 将JSON对象发送回去
    #     print "Modified data sent"

device = frida.get_usb_device()
pid = device.spawn(["cn.demo.login"])
device.resume(pid)
print('--------------sleep 1s to start---------------')
time.sleep(1)
session = device.attach(pid)
with open("send.js",'r',encoding='UTF-8') as f:
    script = session.create_script(f.read())
script.on("message", my_message_handler)  # 注册消息处理函数
script.load()
input()