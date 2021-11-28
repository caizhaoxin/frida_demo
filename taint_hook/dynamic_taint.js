
//-------------------------util--------------------------------


/* SHA256 logical functions */
function rotateRight(n,x) {
	return ((x >>> n) | (x << (32 - n)));
}
function choice(x,y,z) {
	return ((x & y) ^ (~x & z));
}
function majority(x,y,z) {
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
	return (W[j&0x0f] += sha256_sigma1(W[(j+14)&0x0f]) + W[(j+9)&0x0f] +
sha256_sigma0(W[(j+1)&0x0f]));
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
function safe_add(x, y)
{
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
	for(var i=0; i<16; i++)
		W[i] = ((buffer[(i<<2)+3]) | (buffer[(i<<2)+2] << 8) | (buffer[(i<<2)+1]
<< 16) | (buffer[i<<2] << 24));

        for(var j=0; j<64; j++) {
		T1 = h + sha256_Sigma1(e) + choice(e, f, g) + K256[j];
		if(j < 16) T1 += W[j];
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
	for(i=0; i+63<inputLen; i+=64) {
                for(var j=index; j<64; j++)
			buffer[j] = data.charCodeAt(curpos++);
		sha256_transform();
		index = 0;
	}

	/* Buffer remaining input */
	for(var j=0; j<remainder; j++)
		buffer[j] = data.charCodeAt(curpos++);
}

/* Finish the computation by operations such as padding */
function sha256_final() {
	var index = ((count[0] >> 3) & 0x3f);
        buffer[index++] = 0x80;
        if(index <= 56) {
		for(var i=index; i<56; i++)
			buffer[i] = 0;
        } else {
		for(var i=index; i<64; i++)
			buffer[i] = 0;
                sha256_transform();
                for(var i=0; i<56; i++)
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
        var j=0;
        var output = new Array(32);
	for(var i=0; i<8; i++) {
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
	for(var i=0; i<8; i++) {
		for(var j=28; j>=0; j-=4)
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
var global_shareContent = []
var hash_taint_list = []
var function_trace = []
var input_way = []
var taint_count = -1

function print_taint_list(){
    console.log(hash_taint_list)
    console.log(function_trace)
    console.log(input_way)
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
function get_share_content(share_content){
    var shareContent = share_content
    //将空的参数去除
    for(var i = 1;i < shareContent.length;i++){
        if(shareContent[i] == "null"){
            continue
        }
            

        global_shareContent.push(shareContent[i])
        
    }

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
            //console.log('targetArguments = ' + targetArgumentsArr)
            //console.log("targetReturn = " + targetReturn)
            //照常返回，不对返回值做操作
            var retval = this[targetMethod].apply(this, arguments);

            // console.log(targetClassMethod + "argument is :::")
            // for(var c = 0; c < arguments.length; c++){
            //     console.log(arguments[c])
            // }
            // console.log(targetClassMethod + "return is " + retval)


            var retval_str = ''
            targetReturn = targetReturn.toString()
            if (targetReturn != 'int' && targetReturn != 'double' && targetReturn != 'float' 
            && targetReturn != 'long' && targetReturn != 'boolean' && targetReturn != 'short'
            && targetReturn != 'byte' && targetReturn != 'char' && targetReturn != 'void'){
                if (retval != null){
                    retval_str = retval.toString()
                }
            }
            
            
            //taint_index是用来标记当前参数匹配上了哪个hash_taint
            var taint_index = -1
            var is_find_new_taint = false
            for(var j = 0; j < arguments.length; j++){

                //参数类型
                var tpye_of_argument = targetArgumentsArr[j]

                //console.log("type_of_argument = " + typeof tpye_of_argument)
                //参数值
                var argument = arguments[j]
                //console.log(argument)
                //参数String值
                var argument_str = ''
                if (tpye_of_argument != 'int' && tpye_of_argument != 'double' && tpye_of_argument != 'float' 
                && tpye_of_argument != 'long' && tpye_of_argument != 'boolean' && tpye_of_argument != 'short'
                && tpye_of_argument != 'byte' && tpye_of_argument != 'char'){
                    if (argument != null){
                        argument_str = argument.toString()
                    }
                    
                }


                    //判断当前参数有没有分享内容
                for(var k = 0; k < global_shareContent.length; k++){
                        //如果有，就说明要在列表中新开一个hash_taint，当作是一个新的分支
                    if (argument_str.indexOf(global_shareContent[k]) != -1){

                            //总的分享内容的数量
                        taint_count++
                        is_find_new_taint = true
                            
                            
                        hash_taint_list.push(sha256_digest(argument_str))
                        input_way.push("first")
                            
                            //当前的新的函数路径，开启一条新的分支，每遇到一个分享内容就认为他之前没有出现过
                            //var new_source_list = []
                            //new_source_list.push(targetClassMethod)
                            //function_trace是用来记录所有包含分享内容的分支
                        function_trace.push(targetClassMethod)
                        break
                    }
                }

                //console.log("type_of_argument = " + tpye_of_argument)
                //不是基本的数据类型并且有返回值
                var argu_hash = ''
                if (argument_str != ''){
                    //console.log('进来了！！！！！！！')
                    

                    //就是在这个位置出错了
                    
                    argu_hash = sha256_digest(argument_str)
                    

                    //console.log('出去了！！！！！！！！！')
                    
                }

                //不是新出现的分享内容，说明要在hash_list里面查找有没有taint
                if (argu_hash != '' && !is_find_new_taint){
                    //console.log("开始查找........")
                    for (var k = 0;k < hash_taint_list.length; k++){
                        //找到了说明当前的分享内容进入到了这个函数
                        if (argu_hash == hash_taint_list[k]){
                            //标记一下当前的位置
                            taint_index = k
                            //加入到function_trace中，相当于一个函数调用链
                            function_trace.push(targetClassMethod)
                            //break
                            input_way.push("taint_index")
                            //console.log('找到了.....')
                            break
                        }
                    }
                    //console.log('没有找到对应的污点,说明这个函数没有分享内容...')
                }



                console.log("targetReturn = " + targetReturn)
                if (taint_index != -1){
                    //console.log("111111进来了！！！！！")
                    if(retval_str != ''){

                        
                        var hash_taint = sha256_digest(retval_str)
                        hash_taint_list[taint_index] = hash_taint
                        

                    }else{
                        
                        hash_taint_list[taint_index] = argu_hash

                    }
                }

                
            }

            if (is_find_new_taint){
                if(retval_str != ''){

                    var hash_taint = sha256_digest(retval_str)
                    hash_taint_list[taint_count] = hash_taint
                    

                }else{
                    
                    hash_taint_list[taint_count] = argu_hash

                }
            }

            if (taint_index != -1 || is_find_new_taint){
                //console.log('have share content is' + targetClassMethod)
                //printStack()
                //console.log(argu_hash)
                //console.log(hash_taint)
                //console.log(hash_taint_list)
            }

            //console.log('11111111111111111111111111111')

            return retval;

            //console.log(targetClassMethod)

            //可以打印每个重载的调用栈，对调试有巨大的帮助，当然，信息也很多，尽量不要打印，除非分析陷入僵局
            // Java.perform(function () {
            //     var bt = Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new());
            //     console.log("\nBacktrace:\n" + bt);
            // });

            // if (arguments.length) console.log();
            // var taint
            // var has_taint = false
            // for (var j = 0; j < arguments.length; j++) {
            //     var str = arguments[j].toString()

            //     // String
            //     if (targetArgumentsArr[j] == 'java.lang.String') {
            //         str = arguments[j]
            //     }
            //     // byte[]
            //     else if (targetArgumentsArr[j] == '[B') {
            //         var javaString = Java.use('java.lang.String');
            //         str = javaString.$new(arguments[j]);
            //     }
            //     //HashMap
            //     else if (targetArgumentsArr[j] == 'java.util.HashMap'){
            //         str = arguments[j].toString()
            //     }
            //     //JSONObject
            //     else if (targetArgumentsArr[j] == 'org.json.JSONObject'){
            //         str = arguments[j].toString()
            //     }
            //     //JSONArray
            //     else if (targetArgumentsArr[j] == 'org.json.JSONArray'){
            //         str = arguments[j].toString()
            //     }



            //     // other....

            //     //console.log("2===============================================")
            //     //查看当前传入的参数是否包含了分享的内容，循环便利分享内容数组
            //     if (str != ''){
            //         for(var k = 0;k < global_shareContent.length;k++){
            //             if (str.indexOf(global_shareContent[k]) != -1) {
            //                 taint = global_shareContent[k]
            //                 has_taint = true
            //                 console.log('str = ' + str)
            //             }
            //         }
            //     }
                
            // }

            //console.log("3==========================================")
            //打印返回值
             // rare crash (Frida bug?)

            //console.log("byte to string:" + byteToString(retval))

            // if(has_taint && "http" in targetMethod.toLowerCase() && "post" in targetMethod.toLowerCase()){
            //     console.log("这个app是阳性")
            // }

            //console.log("4==========================================")
            // 处理返回值
            // 有污点
            // console.log(has_taint)
            // if (has_taint) {
            //     if (targetReturn == 'java.lang.String') {
            //         retval += taint
            //     }
            //     if (targetReturn == '[B') {
            //         var javaString = Java.use('java.lang.String')
            //         var str = javaString.$new(retval);
            //         str += taint
            //         console.log('str'+str)
            //         retval = Java.array('byte', stringToByte(str));
            //     }
            //     //如果返回值是HashMap，那么就加多一对key value，key是gosec，value是分享的内容
            //     if (targetReturn == 'java.util.HashMap'){
            //         retval.put('gosec!!', taint)
            //     }

            //     if (targetReturn == 'org.json.JSONObject'){
            //         retval.put('gosec!!', taint)
            //     }

            //     if (targetReturn == 'org.json.JSONArray'){
            //         retval.put(taint)
            //     }


            // }
            //console.log(retval)


            //console.log("5==========================================")
            // console.log("\nretval: " + retval);
            // console.warn("\n*** exiting " + targetClassMethod);
            
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

function test(){
    console.log('==============================')
    hook('com.mob.tools.utils.Data', '[B', 'AES128Encode', '(java.lang.String,java.lang.String)')
}




// setTimeout setImmediate
setTimeout(function () { //prevent timeout
    console.log("[*] Starting script");

    Java.perform(function (){
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


// export the rpc API
rpc.exports = {
    hookentry: hook_entry, //导出名不可以有大写字母或者下划线
    getsharecontent: get_share_content,
    printtaintlist: print_taint_list
    //test:test,
    //sha256:sha256
};
