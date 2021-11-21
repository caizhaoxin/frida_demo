//-------------------------util--------------------------------

//分享的内容
var global_shareContent = []

// 打印调用栈
function printStack() {
    Java.perform(function () {
        var Exception = Java.use("java.lang.Exception");
        var ins = Exception.$new("Exception");
        var straces = ins.getStackTrace();
        if (straces != undefined && straces != null) {
            var strace = straces.toString();
            var replaceStr = strace.replace(/,/g, "\r\n");
            console.log("=============================Stack strat=======================");
            console.log(replaceStr);
            console.log("=============================Stack end=======================\r\n");
            Exception.$dispose();
        }
    });
}

function get_share_content(share_content){
    global_shareContent = share_content
    console.log(global_shareContent)
}
// js: string 换 byte数组
function stringToByte(str) {
    var bytes = new Array();
    var len, c;
    len = str.length;
    for (var i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if (c >= 0x010000 && c <= 0x10FFFF) {
            bytes.push(((c >> 18) & 0x07) | 0xF0);
            bytes.push(((c >> 12) & 0x3F) | 0x80);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        } else if (c >= 0x000800 && c <= 0x00FFFF) {
            bytes.push(((c >> 12) & 0x0F) | 0xE0);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
        } else if (c >= 0x000080 && c <= 0x0007FF) {
            bytes.push(((c >> 6) & 0x1F) | 0xC0);
            bytes.push((c & 0x3F) | 0x80);
        } else {
            bytes.push(c & 0xFF);
        }
    }
    return bytes;
}
// js： byte数组转string
function byteToString(arr) {
    if (typeof arr === 'string') {
        return arr;
    }
    var str = '',
        _arr = arr;
    for (var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
            v = one.match(/^1+?(?=0)/);
        if (v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for (var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2);
            }
            str += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1;
        } else {
            str += String.fromCharCode(_arr[i]);
        }
    }
    return str;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 根据overload获取参数字符串
function getTargetArgumentsByOverload(overload) {
    var curArguments = "(";
    overload.argumentTypes.forEach(function (type) {
        curArguments += type.className + ",";
    });
    if (curArguments.length > 1) {
        curArguments = curArguments.substr(0, curArguments.length - 1);
    }
    curArguments += ")";
    return curArguments
}
function hook(targetClass, targetReturn, targetMethod, targetArguments) {
    //替换掉所有的空格, 防止写配置的时候不小心
    targetClass = targetClass.replace(/\s+/g, "")
    targetReturn = targetReturn.replace(/\s+/g, "")
    targetMethod = targetMethod.replace(/\s+/g, "")
    targetArguments = targetArguments.replace(/\s+/g, "")
    //生成数组，方便下面的逻辑处理
    var targetArgumentsArr = targetArguments.substr(1, targetArguments.length - 2).split(',')
    // targetClassMethod
    var targetClassMethod = targetClass + ' ' + targetMethod
    //目标类
    var hook = Java.use(targetClass);
    //获取所有重载
    var overloads = hook[targetMethod].overloads
    //重载次数
    var overloadCount = overloads.length;
    //打印日志：追踪的方法有多少个重载
    // console.log("Tracing " + targetClass + '.' + targetMethod + " [" + overloadCount + " overload(s)]");
    // 成功hook的标记
    var hook_succe = false
    //每个重载都进入一次
    for (var i = 0; i < overloadCount; i++) {
        //获取参数类型字符串
        var overload = overloads[i]
        var curArguments = getTargetArgumentsByOverload(overload)
        var curReturnTypeName = overload.returnType.className

        // 查看所有property
        // for(var name in overload){
        //     console.log(name)
        // }
        //参数不符合预期， continue！
        // console.log(curArguments, targetArguments)
        if (curArguments != targetArguments) continue
        if (curReturnTypeName != targetReturn) continue

        // 成功hook到，设置标志，方便循环后处理
        hook_succe = true

        overloads[i].implementation = function () {
            console.warn("\n*** entered " + targetClassMethod);

            //可以打印每个重载的调用栈，对调试有巨大的帮助，当然，信息也很多，尽量不要打印，除非分析陷入僵局
            // Java.perform(function () {
            //     var bt = Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new());
            //     console.log("\nBacktrace:\n" + bt);
            // });

            // 本着宁可杀错可不放过的原则，原参数和返回值我们都加个taint
            // 处理参数
            if (arguments.length) console.log();
            var taint = 'I am taint, destory u!!!'
            var has_taint = false
            for (var j = 0; j < arguments.length; j++) {
                // String
                if (targetArgumentsArr[j] == 'java.lang.String' && arguments[j].indexOf(taint) != -1) {
                    has_taint = true
                    console.log(arguments[j])
                }
                // byte[]
                else if (targetArgumentsArr[j] == '[B') {
                    var javaString = Java.use('java.lang.String');
                    var str = javaString.$new(arguments[j]);
                    if (str.indexOf(taint) != -1)
                        has_taint = true
                    console.log(str)
                }
                // other....
            }
            //打印返回值
            var retval = this[targetMethod].apply(this, arguments); // rare crash (Frida bug?)
            // 处理返回值
            // 有污点
            // console.log(has_taint)
            if (has_taint) {
                if (targetReturn == 'java.lang.String') {
                    retval += taint
                }
                if (targetReturn == '[B') {
                    var javaString = Java.use('java.lang.String')
                    var str = javaString.$new(retval);
                    str += taint
                    console.log('str'+str)
                    retval = Java.array('byte', stringToByte('傻逼！！！'));
                }
            }
            // console.log("\nretval: " + retval);
            // console.warn("\n*** exiting " + targetClassMethod);
            return retval;
        }
        // 找到并成功hook到了，结束当前循环
    }
    // console.log('----------------------------')
    if (!hook_succe)
        throw '找不到指定的方法，无法hook.....'
}
// hook_entry入口
function hook_entry(hook_info) {
    // targetClass, targetMethod, targetArguments
    // console.log(hook_info[0]['targetClass'])
    Java.perform(function () {
        if (!Java.available) {
            console.log('java虚拟机未加载！')
            return
        }
        for (var i = 0; i < hook_info.length; i++) {
            var targetClass = hook_info[i]['targetClass']
            var targetReturn = hook_info[i]['targetReturn']
            var targetMethod = hook_info[i]['targetMethod']
            var targetArguments = hook_info[i]['targetArguments']
            // console.log(targetClass, targetMethod, targetArguments)
            try {
                // hook 对应的方法
                hook(targetClass, targetReturn, targetMethod, targetArguments)
                console.log('hook successfully in: ', targetClass, targetReturn, targetMethod + targetArguments)
            } catch (err) {
                console.error('hook err:', err, 'in: ', targetClass, targetReturn, targetMethod + targetArguments)
            }
        }
        console.log('end!!')
    })
}

function hook_set_text() {
    console.log("Script loaded successfully");
    Java.perform(function () {
        var tv_class = Java.use("android.widget.TextView");
        tv_class.setText.overload("java.lang.CharSequence").implementation = function (x) {
            var string_to_send = x.toString();
            var string_to_recv;
            send(string_to_send); // send data to python code
            recv(function (received_json_object) {
                string_to_recv = received_json_object.my_data
                // console.log("string_to_recv: " + string_to_recv);
            }).wait(); //block execution till the message is received
            var my_string = Java.use("java.lang.String").$new(string_to_recv);
            this.setText(my_string);
        }
    });
}

// setTimeout setImmediate
setTimeout(function () { //prevent timeout
    console.log("[*] Starting script");
    Java.perform(function () {
        // hook('com.mob.tools.utils.Hashon', 'fromHashMap', '(java.util.HashMap)')
        try {
            // hook 对应的方法
            hook('cn.demo.login.ui.login.LoginActivity', '[B', 'click_test', '(java.lang.String,[B)')
        } catch (err) {
            console.log('hook err:', err, 'in: ')
        }
    })
}, 1000)

// export the rpc API
rpc.exports = {
    hookentry: hook_entry, //导出名不可以有大写字母或者下划线
    getsharecontent: get_share_content
};
