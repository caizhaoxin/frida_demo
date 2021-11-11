import time
import frida

apk_name = 'com.ssports.mobile.video'

device = frida.get_usb_device()
pid = device.spawn([apk_name])
device.resume(pid)
print('--------------sleep 1s to start---------------')
time.sleep(1)
session = device.attach(pid)
with open("trace.js",'r',encoding='UTF-8') as f:
    script = session.create_script(f.read())
script.load()
input()