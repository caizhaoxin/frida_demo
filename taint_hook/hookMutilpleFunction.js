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
function hook(targetClass, targetMethod, targetArguments) {
    //替换掉所有的空格, 防止写配置的时候不小心
    targetClass = targetClass.replace(/\s+/g, "")
    targetMethod = targetMethod.replace(/\s+/g, "")
    targetArguments = targetArguments.replace(/\s+/g, "")
    // targetClassMethod
    var targetClassMethod = targetClass + ' ' + targetMethod
    //目标类
    var hook = Java.use(targetClass);
    //获取所有重载
    var overloads = hook[targetMethod].overloads
    //重载次数
    var overloadCount = overloads.length;
    //打印日志：追踪的方法有多少个重载
    console.log("Tracing " + targetClass + '.' + targetMethod + " [" + overloadCount + " overload(s)]");
    //每个重载都进入一次
    for (var i = 0; i < overloadCount; i++) {
        //获取参数类型字符串
        var overload = overloads[i]
        var curArguments = getTargetArgumentsByOverload(overload)
        //参数不符合预期， continue！
        if (curArguments != targetArguments) continue
        hook[targetMethod].overloads[i].implementation = function () {
            console.warn("\n*** entered " + targetClassMethod);

            //可以打印每个重载的调用栈，对调试有巨大的帮助，当然，信息也很多，尽量不要打印，除非分析陷入僵局
            // Java.perform(function () {
            //     var bt = Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new());
            //     console.log("\nBacktrace:\n" + bt);
            // });

            // 打印参数
            // if (arguments.length) console.log();
            // for (var j = 0; j < arguments.length; j++) {
            //     console.log("arg[" + j + "]: " + arguments[j]);
            // }

            //打印返回值
            var retval = this[targetMethod].apply(this, arguments); // rare crash (Frida bug?)
            // console.log("\nretval: " + retval);
            // console.warn("\n*** exiting " + targetClassMethod);
            return retval;
        }
    }
    console.log('----------------------------')
}

function hook_entry(hook_info) {
    // targetClass, targetMethod, targetArguments
    // console.log(hook_info[0]['targetClass'])
    Java.perform(function () {
        for (var i = 0; i < hook_info.length; i++) {
            var targetClass = hook_info[i]['targetClass']
            var targetMethod = hook_info[i]['targetMethod']
            var targetArguments = hook_info[i]['targetArguments']
            console.log(targetClass, targetMethod, targetArguments)
            // hook 对应的方法
            hook(targetClass, targetMethod, targetArguments)
        }
    })
    // Java.perform(function () {
    //     hook('com.mob.tools.utils.Hashon', 'fromHashMap', '(java.util.HashMap)')
    //     // Java.use("com.mob.tools.utils.Hashon").fromHashMap.implementation = function (view) {
    //     //     // console.log(view)
    //     //     // printStack()
    //     //     // console.log(text)
    //     //     hook('com.mob.tools.utils.Hashon', 'fromHashMap')
    //     //     //console.log("fromHashMap")
    //     //     result = this.fromHashMap(view)
    //     //     return result
    //     // }
    // })
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
// setTimeout(function () { //prevent timeout
//     console.log("[*] Starting script");
//     Java.perform(function () {})
//     // hook_set_text()
//     // f1hook('123')
// }, 1000)

// export the rpc API
rpc.exports = {
    hookentry: hook_entry //导出名不可以有大写字母或者下划线
};