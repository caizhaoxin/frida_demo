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


//获取到发送到微信的分享内容
function get_share_content(share_content){
    var shareContent = share_content
    //将空的参数去除
    for(var i = 1;i < shareContent.length;i++){
        if(shareContent[i] == "null"){
            continue
        }
            

        global_shareContent.push(shareContent[i])
        
    }

    //console.log(global_shareContent)

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

            if (arguments.length) console.log();
            var taint
            var has_taint = false
            for (var j = 0; j < arguments.length; j++) {

                var str

                // String
                if (targetArgumentsArr[j] == 'java.lang.String') {
                    str = arguments[j]
                }
                // byte[]
                else if (targetArgumentsArr[j] == '[B') {
                    var javaString = Java.use('java.lang.String');
                    str = javaString.$new(arguments[j]);
                }
                //HashMap
                else if (targetArgumentsArr[j] == 'java.util.HashMap'){
                    str = arguments[j].toString()
                }
                //JSONObject
                else if (targetArgumentsArr[j] == 'org.json.JSONObject'){
                    str = arguments[j].toString()
                }
                //JSONArray
                else if (targetArgumentsArr[j] == 'org.json.JSONArray'){
                    str = arguments[j].toString()
                }



                // other....

                
                //查看当前传入的参数是否包含了分享的内容，循环便利分享内容数组
                for(var k = 0;k < global_shareContent.length;k++){
                    if (str.indexOf(global_shareContent[k]) != -1) {
                        taint = global_shareContent[k]
                        has_taint = true
                        console.log(str)
                    }
                }
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
                    retval = Java.array('byte', stringToByte(str));
                }
                //如果返回值是HashMap，那么就加多一对key value，key是gosec，value是分享的内容
                if (targetReturn == 'java.util.HashMap'){
                    retval.put('gosec!!', taint)
                }

                if (targetReturn == 'org.json.JSONObject'){
                    retval.put('gosec!!', taint)
                }

                if (targetReturn == 'org.json.JSONArray'){
                    retval.put(taint)
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



//hook shareSDK自己做的WXMediaMesssage
function hook_shareSDK_wx(){
    var wx = Java.use("cn.sharesdk.wechat.utils.WXMediaMessage$a")
    wx.a.overload('cn.sharesdk.wechat.utils.WXMediaMessage').implementation = function(wxObject){

        var bundle = this.a(wxObject)

        var identifier = bundle.getString("_wxobject_identifier_")
        var share_json = bundle.toString()

        send(share_json)
        

        return bundle
    }
}

//hook 微信自己的WXMediaMesssage
function hook_normal_wx(){
    var wx = Java.use("com.tencent.mm.opensdk.modelmsg.WXMediaMessage$Builder")
    wx.toBundle.implementation = function(wxObject){
        var bundle = this.toBundle(wxObject)
        
        var share_json = bundle.toString()

        send(share_json)

        return bundle
    }
}

function hook_wechat_content(){
    Java.perform(function (){
        hook_shareSDK_wx()
    })

    Java.perform(function (){
        hook_normal_wx()
    })
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

    Java.perform(function (){
        hook_wechat_content()
    })
}, 1000)

// export the rpc API
rpc.exports = {
    hookentry: hook_entry, //导出名不可以有大写字母或者下划线
    getsharecontent: get_share_content,
};
