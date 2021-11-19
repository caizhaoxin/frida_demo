import time
import frida
import base64

apk_name = 'com.cns.mc.activity'
js_script = 'hookMutilpleFunction.js'


def my_message_handler(message, payload):
    # print(message)
    # print(payload)
    if message["type"] == "send":
        # print(message["payload"])
        # print( 'message:', message)
        script.post({"my_data": message["payload"] + "gosec"})


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
        "Enter command:\n1: Exit\n2: Call secret function\nchoice:")
    if command == "1":
        break
    elif command == "2":  # 在这里调用
        hook_info = []
        hook_info.append({'targetClass': 'com.mob.tools.utils.Hashon',
                          'targetMethod': 'fromHashMap',
                          'targetArguments': '(java.util.HashMap)'})
        script.exports.hookentry(hook_info)
