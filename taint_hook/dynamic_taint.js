
//-------------------------util--------------------------------


/* SHA256 logical functions */
function rotateRight(n, x) {
    return ((x >>> n) | (x << (32 - n)));
}
function choice(x, y, z) {
    return ((x & y) ^ (~x & z));
}
function majority(x, y, z) {
    return ((x & y) ^ (x & z) ^ (y & z));
}
function sha256_Sigma0(x) {
    return (rotateRight(2, x) ^ rotateRight(13, x) ^ rotateRight(22, x));
}
function sha256_Sigma1(x) {
    return (rotateRight(6, x) ^ rotateRight(11, x) ^ rotateRight(25, x));
}
function sha256_sigma0(x) {
    return (rotateRight(7, x) ^ rotateRight(18, x) ^ (x >>> 3));
}
function sha256_sigma1(x) {
    return (rotateRight(17, x) ^ rotateRight(19, x) ^ (x >>> 10));
}
function sha256_expand(W, j) {
    return (W[j & 0x0f] += sha256_sigma1(W[(j + 14) & 0x0f]) + W[(j + 9) & 0x0f] +
        sha256_sigma0(W[(j + 1) & 0x0f]));
}

/* Hash constant words K: */
var K256 = new Array(
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
);

/* global arrays */
var ihash, count, buffer;
var sha256_hex_digits = "0123456789abcdef";

/* Add 32-bit integers with 16-bit operations (bug in some JS-interpreters:
overflow) */
function safe_add(x, y) {
    var lsw = (x & 0xffff) + (y & 0xffff);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
}

/* Initialise the SHA256 computation */
function sha256_init() {
    ihash = new Array(8);
    count = new Array(2);
    buffer = new Array(64);
    count[0] = count[1] = 0;
    ihash[0] = 0x6a09e667;
    ihash[1] = 0xbb67ae85;
    ihash[2] = 0x3c6ef372;
    ihash[3] = 0xa54ff53a;
    ihash[4] = 0x510e527f;
    ihash[5] = 0x9b05688c;
    ihash[6] = 0x1f83d9ab;
    ihash[7] = 0x5be0cd19;
}

/* Transform a 512-bit message block */
function sha256_transform() {
    var a, b, c, d, e, f, g, h, T1, T2;
    var W = new Array(16);

    /* Initialize registers with the previous intermediate value */
    a = ihash[0];
    b = ihash[1];
    c = ihash[2];
    d = ihash[3];
    e = ihash[4];
    f = ihash[5];
    g = ihash[6];
    h = ihash[7];

    /* make 32-bit words */
    for (var i = 0; i < 16; i++)
        W[i] = ((buffer[(i << 2) + 3]) | (buffer[(i << 2) + 2] << 8) | (buffer[(i << 2) + 1]
            << 16) | (buffer[i << 2] << 24));

    for (var j = 0; j < 64; j++) {
        T1 = h + sha256_Sigma1(e) + choice(e, f, g) + K256[j];
        if (j < 16) T1 += W[j];
        else T1 += sha256_expand(W, j);
        T2 = sha256_Sigma0(a) + majority(a, b, c);
        h = g;
        g = f;
        f = e;
        e = safe_add(d, T1);
        d = c;
        c = b;
        b = a;
        a = safe_add(T1, T2);
    }

    /* Compute the current intermediate hash value */
    ihash[0] += a;
    ihash[1] += b;
    ihash[2] += c;
    ihash[3] += d;
    ihash[4] += e;
    ihash[5] += f;
    ihash[6] += g;
    ihash[7] += h;
}

/* Read the next chunk of data and update the SHA256 computation */
function sha256_update(data, inputLen) {
    var i, index, curpos = 0;
    /* Compute number of bytes mod 64 */
    index = ((count[0] >> 3) & 0x3f);
    var remainder = (inputLen & 0x3f);

    /* Update number of bits */
    if ((count[0] += (inputLen << 3)) < (inputLen << 3)) count[1]++;
    count[1] += (inputLen >> 29);

    /* Transform as many times as possible */
    for (i = 0; i + 63 < inputLen; i += 64) {
        for (var j = index; j < 64; j++)
            buffer[j] = data.charCodeAt(curpos++);
        sha256_transform();
        index = 0;
    }

    /* Buffer remaining input */
    for (var j = 0; j < remainder; j++)
        buffer[j] = data.charCodeAt(curpos++);
}

/* Finish the computation by operations such as padding */
function sha256_final() {
    var index = ((count[0] >> 3) & 0x3f);
    buffer[index++] = 0x80;
    if (index <= 56) {
        for (var i = index; i < 56; i++)
            buffer[i] = 0;
    } else {
        for (var i = index; i < 64; i++)
            buffer[i] = 0;
        sha256_transform();
        for (var i = 0; i < 56; i++)
            buffer[i] = 0;
    }
    buffer[56] = (count[1] >>> 24) & 0xff;
    buffer[57] = (count[1] >>> 16) & 0xff;
    buffer[58] = (count[1] >>> 8) & 0xff;
    buffer[59] = count[1] & 0xff;
    buffer[60] = (count[0] >>> 24) & 0xff;
    buffer[61] = (count[0] >>> 16) & 0xff;
    buffer[62] = (count[0] >>> 8) & 0xff;
    buffer[63] = count[0] & 0xff;
    sha256_transform();
}

/* Split the internal hash values into an array of bytes */
function sha256_encode_bytes() {
    var j = 0;
    var output = new Array(32);
    for (var i = 0; i < 8; i++) {
        output[j++] = ((ihash[i] >>> 24) & 0xff);
        output[j++] = ((ihash[i] >>> 16) & 0xff);
        output[j++] = ((ihash[i] >>> 8) & 0xff);
        output[j++] = (ihash[i] & 0xff);
    }
    return output;
}

/* Get the internal hash as a hex string */
function sha256_encode_hex() {
    var output = new String();
    for (var i = 0; i < 8; i++) {
        for (var j = 28; j >= 0; j -= 4)
            output += sha256_hex_digits.charAt((ihash[i] >>> j) & 0x0f);
    }
    return output;
}

/* Main function: returns a hex string representing the SHA256 value of the
given data */
function sha256_digest(data) {
    sha256_init();
    sha256_update(data, data.length);
    sha256_final();
    return sha256_encode_hex();
}

//分享的内容
var globalShareContentSet = new Set()
// 污点表
var hashTaintSet = new Set()
// 基本数据类型列表
var base_types = ['int', 'byte', 'long', 'double', 'float', 'boolean', 'void', 'char']
// var globalShareContentSet = []
// var hashTaintSet = []

function print_taint_list() {
    console.log(hashTaintSet)
}

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
function get_share_content(share_content) {
    var shareContent = share_content
    //将空的参数去除
    for (var i = 1; i < shareContent.length; i++) {
        if (shareContent[i] == "null") {
            continue
        }
        globalShareContentSet.add(shareContent[i])
    }
    console.log('分享内容：', globalShareContentSet)
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
// 参数转化
function argument_handle(argumentVal, returnType) {
    // string
    if (returnType == 'java.lang.String') {
        argumentVal = argumentVal.toString()
    }
    // byte[]
    else if (returnType == '[B') {
        argumentVal = Java.use('java.lang.String').$new(argumentVal).toString();
    }
    // other
    else {
        argumentVal = argumentVal.toString()
    }
    return argumentVal
}
// 判断是否是我们关心的参数类型
// 1、基本类型不关心
// 2、基本类型数组中我们只关心 []byte, 其他的什么[]int,[]float，丢弃掉
// 3、我们关心其他所有的类
function is_interest_type(returnType) {
    // 含有点.  那就是类 我们关心 不管是类还是类数组
    if (returnType.indexOf('.') != -1) return true
    // 基本类型数组中我们只关心 []byte, 其他的什么[]int,[]float，丢弃掉
    if (returnType == '[B') return true
    // 其他的都不关心
    return false
}
// 检测是否是污点
function checkIsTaint(targetMethod, argumentVal, argumentsType, logInfo) {
    //处理参数
    // 包括了分享内容 || 判断hashcode是否在set里面
    // 参数为空 或 基本数据类型  肯定不是污点 return false
    // console.log(targetMethod, ' -> argumentValStr: ', is_interest_type(argumentsType))
    if (argumentVal == null || !is_interest_type(argumentsType))
        return false
    // 根据argumentVal的类型argumentsType，转化成string
    var argumentValStr = argument_handle(argumentVal, argumentsType)
    // 取argumentValStr的hash，这里暂时用加密去做
    var argumentValCode = sha256_digest(argumentValStr)
    // 是否有share content的标记
    var hasShareContent = false
    // 是否有在污点table里面的标记
    var hasInTaintTable = false
    if (hashTaintSet.has(argumentValCode)) {
        hasInTaintTable = true
    }
    if (globalShareContentSet.has(argumentValStr)) {
        hasShareContent = true
        hashTaintSet.add(argumentValCode)
    }

    console.log('---------------------------------------------------')
    console.log(logInfo)
    console.log(targetMethod, ' -> hashTaintSet: ', hashTaintSet.size)
    console.log(targetMethod, ' -> argumentsType: ', argumentsType)
    console.log(targetMethod, ' -> argument_val_str: ', argumentValStr)
    console.log(targetMethod, ' -> has_in_taint_table: ', hasInTaintTable)
    console.log(targetMethod, ' -> has_share_content: ', hasShareContent)

    return hasInTaintTable || hasShareContent
}
function hook(targetClass, targetReturn, targetMethod, targetArguments) {
    //替换掉所有的空格, 防止写配置的时候不小心
    targetClass = targetClass.replace(/\s+/g, "")
    targetReturn = targetReturn.replace(/\s+/g, "")
    targetMethod = targetMethod.replace(/\s+/g, "")
    targetArguments = targetArguments.replace(/\s+/g, "")
    // 静态构造函数在frida层hook不到，暂时不处理
    if (targetMethod == '<clinit>')
        throw '静态构造函数在frida层hook不到，暂时不处理'
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
    var hookSucce = false
    //每个重载都进入一次
    for (var i = 0; i < overloadCount; i++) {
        //获取参数类型字符串
        var overload = overloads[i]
        var curArguments = getTargetArgumentsByOverload(overload)
        var curReturnTypeName = overload.returnType.className
        // 是否添加return的值到污点table的标志
        var addReturnValToTaintSet = false
        //参数不符合预期， continue！
        if (curArguments != targetArguments) continue
        if (curReturnTypeName != targetReturn) continue
        // 成功hook到，设置标志，方便循环后处理
        hookSucce = true
        overloads[i].implementation = function () {
            try {
                console.log("\n*** entered " + targetClassMethod);
                // console.log('----------------------')
                //console.log('targetArguments = ' + targetArgumentsArr)
                //console.log("targetReturn = " + targetReturn)
                for (var j = 0; j < arguments.length; j++) {
                    //处理参数
                    // 包括了分享内容 || 判断hashcode是否在set里面
                    var argumentVal = arguments[j]
                    var argumentsType = targetArgumentsArr[j]
                    if (checkIsTaint(targetMethod, argumentVal, argumentsType, '检查参数：')) {
                        addReturnValToTaintSet = true
                        // todo...泄露后的逻辑
                        if (targetMethod.toLowerCase().indexOf('http') != -1
                            || targetMethod.toLowerCase().indexOf('https') != -1
                            || targetMethod.toLowerCase().indexOf('post') != -1) {
                            console.log(targetMethod, ' 泄露了！！！')
                        }
                        // 只处理一个参数，虽然其他参数也有可能被污染，但是肯定会传到其他方法里面，因此只处理一个，避免重复处理
                        break
                    }
                }
                // 处理返回值
                var returnVal = this[targetMethod].apply(this, arguments);
                if (checkIsTaint(targetMethod, returnVal, targetReturn, '检查返回值：') || addReturnValToTaintSet) {
                    // todo...泄露后的逻辑
                    if (targetMethod.toLowerCase().indexOf('http') != -1
                        || targetMethod.toLowerCase().indexOf('https') != -1
                        || targetMethod.toLowerCase().indexOf('post') != -1) {
                        console.log(targetMethod, ' 泄露了！！！')
                    }
                }
                return returnVal
            } catch (err) {
                console.error('hook err:', err)
            }
        }
        // 找到并成功hook到了，结束当前循环
    }
    if (!hookSucce)
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
        // temp
        var l = 500
        var r = 1000
        globalShareContentSet.add('My location is SYSU_SOSE')
        ///////////////////////
        for (var i = 0; i < hook_info.length; i++) {
            // if(i<l || r<i)  continue
            var targetClass = hook_info[i]['targetClass']
            var targetReturn = hook_info[i]['targetReturn']
            var targetMethod = hook_info[i]['targetMethod']
            var targetArguments = hook_info[i]['targetArguments']
            console.log(targetClass, targetMethod, targetArguments)
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
function hook_shareSDK_wx() {
    var wx = Java.use("cn.sharesdk.wechat.utils.WXMediaMessage$a")
    wx.a.overload('cn.sharesdk.wechat.utils.WXMediaMessage').implementation = function (wxObject) {
        var bundle = this.a(wxObject)
        var identifier = bundle.getString("_wxobject_identifier_")
        var share_json = bundle.toString()
        send(share_json)
        return bundle
    }
}

//hook 微信自己的WXMediaMesssage
function hook_normal_wx() {
    var wx = Java.use("com.tencent.mm.opensdk.modelmsg.WXMediaMessage$Builder")
    wx.toBundle.implementation = function (wxObject) {
        var bundle = this.toBundle(wxObject)
        var share_json = bundle.toString()
        send(share_json)
        return bundle
    }
}

function hook_wechat_content() {
    Java.perform(function () {
        hook_shareSDK_wx()
    })

    Java.perform(function () {
        hook_normal_wx()
    })
}
// setTimeout setImmediate
setTimeout(function () { //prevent timeout
    console.log("[*] Starting script");

    Java.perform(function () {
        hook_wechat_content()
    })
    // Java.perform(function (){
    //     Java.use('javax.crypto.spec.SecretKeySpec').getFormat.implementation = function(){
    //         var result = this.getFormat()
    //         printStack()

    //         console.log(result)

    //         return result
    //     }
    // })
}, 1000)

function add() {
    console.log('1+1: ', 1 + 1)
}

// export the rpc API
rpc.exports = {
    hookentry: hook_entry, //导出名不可以有大写字母或者下划线
    getsharecontent: get_share_content,
    printtaintlist: print_taint_list,
    //test:test,
    //sha256:sha256
};
