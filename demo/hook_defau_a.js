//打印调用栈
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
function traceClass(targetClass) {
    //Java.use是新建一个对象哈，大家还记得么？
    var hook = Java.use(targetClass);
    //利用反射的方式，拿到当前类的所有方法
    var methods = hook.class.getDeclaredMethods();
    //建完对象之后记得将对象释放掉哈
    hook.$dispose;
    //将方法名保存到数组中
    var parsedMethods = [];
    methods.forEach(function (method) {
        parsedMethods.push(method.toString().replace(targetClass + ".", "TOKEN").match(/\sTOKEN(.*)\(/)[1]);
    });
    //去掉一些重复的值
    // var targets = uniqBy(parsedMethods, JSON.stringify);
    //对数组中所有的方法进行hook，traceMethod也就是第一小节的内容
    methods.forEach(function (targetMethod) {
        console.log(targetClass + "." + targetMethod)
        // traceMethod(targetClass + "." + targetMethod);
    });
}
function call_hook() {
    // var application = Java.use("android.app.Application");
    // application.attach.overload("android.content.Context").implementation=function(context){
    //     //先执行原来的attach方法
    //     var reuslt = this.attach(context);
    //     //使用context获取classloader
    //     var classLoader = context.getClassLoader();
    //     //设置Java.classFacotry.loader为我们上面获取到的classLoader
    //     Java.classFactory.loader = classLoader;
    //     //然后使用Java.classFactory.use()方法获取我们的对象
    //     var cls = Java.classFactory.use('cn.sharesdk.wechat.favorite.WechatFavorite');
    //     console.log(cls.toString())
    //     //然后下面就是我们具体的Hook逻辑了。
    //     cls.shareImage.implementation = function () {
    //         printStack()
    //         this.shareText()
    //         // console.log('--------------uri: ', uri.toString())
    //     }
    // }
    Java.use('cn.demo.login.ui.login.LoginActivity').myLoginCheck.implementation = function (a,b) {
        printStack()
        this.myLoginCheck(a,b)
        // console.log('--------------uri: ', uri.toString())
    }

    Java.use("cn.demo.login.ui.login.LoginActivity").myLoginCheck.implementation = function (username, password) {
        printStack()
        this.myLoginCheck(username, password)
    }


    // var DefaultLogsCollector_cls_name = "com.mob.commons.logcollector.DefaultLogsCollector";

    // var DefaultLogsCollector_cls = Java.use('com.jia.zixun.vh1')
    // var DefaultLogsCollector_ins = DefaultLogsCollector_cls.get()

    return 0;
}
// 查找类实例，并调用
function find_and_call_vir() {
    console.log("com.huajiao.share")
    var class_name = 'com.huajiao.share.ShareCommandManager'
    //hook动态函数，找到instance实例，从实例调用函数方法
    Java.choose(class_name, {
        onMatch: function (instance) {
            console.log("find")
            instance.a()
        },
        onComplete: function () {
            console.log("end")
        }
    })
    return 0;
}
// 初始化类实例，并调用
function init_and_call_vir() {
    Java.perform(function () {
        //这里写函数对应的类名

        // var application = Java.use("android.app.Application");
        // application.attach.overload("android.content.Context").implementation=function(context){
        //     //先执行原来的attach方法
        //     var reuslt = this.attach(context);
        //     //使用context获取classloader
        //     var classLoader = context.getClassLoader();
        //     //设置Java.classFacotry.loader为我们上面获取到的classLoader
        //     Java.classFactory.loader = classLoader;
        //     //然后使用Java.classFactory.use()方法获取我们的对象
        //     var cls = Java.classFactory.use('cn.sharesdk.wechat.favorite.WechatFavorite');
        //     // // var cls = Java.use('cn.sharesdk.wechat.friends.Wechat');
        //     cls.$init.implementation=function(){
        //         printStack()
        //         this.$init();
        //     }

        //     console.log(cls.toString())
        //     var ins = cls.$new()
        //     console.log(ins.toString())
        //     //然后下面就是我们具体的Hook逻辑了。
        // }

        // //获取类的引用
        var cls = Java.use('cn.sharesdk.wechat.friends.qq');
        var ins = cls.$new()
        console.log(ins.toString())
        // cls.lR()
        // var companion = cls.$new()
        // console.log(companion.toString())
        // var screenShotListenManager = companion.getInstance()
        // screenShotListenManager.handleMediaRowData("2",0,0,0)

        //调用构造函数 创建新对象  这里注意参数
        // var obj = cls.$new(null);

        // 调用新对象的对象方法 enc
        // obj.obj()
    });
    return 0;
}
// trace a specific Java Method
function traceMethod(targetClassMethod) {
    var delim = targetClassMethod.lastIndexOf(".");
    if (delim === -1) return;

    var targetClass = targetClassMethod.slice(0, delim)
    var targetMethod = targetClassMethod.slice(delim + 1, targetClassMethod.length)

    var hook = Java.use(targetClass);
    var overloadCount = hook[targetMethod].overloads.length;

    console.log("Tracing " + targetClassMethod + " [" + overloadCount + " overload(s)]");

    for (var i = 0; i < overloadCount; i++) {

        hook[targetMethod].overloads[i].implementation = function () {
            console.warn("\n*** entered " + targetClassMethod);

            // print backtrace
            // Java.perform(function() {
            //	var bt = Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new());
            //	console.log("\nBacktrace:\n" + bt);
            // });

            // print args
            if (arguments.length) console.log();
            for (var j = 0; j < arguments.length; j++) {
                console.log("arg[" + j + "]: " + arguments[j]);
            }

            // print retval
            var retval = this[targetMethod].apply(this, arguments); // rare crash (Frida bug?)
            console.log("\nretval: " + retval);
            console.warn("\n*** exiting " + targetClassMethod);
            return retval;
        }
    }
}
// remove duplicates from array
function uniqBy(array, key) {
    var seen = {};
    return array.filter(function (item) {
        var k = key(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
}
function hook_all_methed() {
    var cls_name = 'cn.sharesdk.demo.platform.tencent.qq.QQShare'
    var cls = Java.use(cls_name)
    var methods = cls.class.getDeclaredMethods()
    cls_name.$dispose
    //将方法名保存到数组中
    var parsedMethods = [];
    methods.forEach(function (method) {
        parsedMethods.push(method.toString().replace(cls_name + ".", "TOKEN").match(/\sTOKEN(.*)\(/)[1]);
    });
    //去掉一些重复的值
    var targets = uniqBy(parsedMethods, JSON.stringify);
    //对数组中所有的方法进行hook，traceMethod也就是第一小节的内容
    targets.forEach(function (targetMethod) {
        traceMethod(cls_name + "." + targetMethod);
        // console.log(cls_name + "." + targetMethod)
    });
    // console.log(targets)
}
function force_load(cls_name, method){
    var application = Java.use("android.app.Application");
    application.attach.overload("android.content.Context").implementation=function(context){
        //先执行原来的attach方法
        var reuslt = this.attach(context);
        //使用context获取classloader
        var classLoader = context.getClassLoader();
        //设置Java.classFacotry.loader为我们上面获取到的classLoader
        Java.classFactory.loader = classLoader;
        //然后使用Java.classFactory.use()方法获取我们的对象
        var cls = Java.classFactory.use(cls_name);
        //然后下面具体的Hook逻辑了。
        method(cls)
    }
}
function print_metheds(cls) {
    console.log('-------------------print_metheds-------------------------')
    // var Wechat_cls_name = cls_name;
    // // tmp 
    // var cls = Java.use(Wechat_cls_name);
    var mhd_array = cls.class.getDeclaredMethods();
    //hook 类所有方法 （所有重载方法也要hook)
    for (var i = 0; i < mhd_array.length; i++) {
        var mhd_cur = mhd_array[i]; //当前方法
        var str_mhd_name = mhd_cur.getName(); //当前方法名
        console.log(str_mhd_name);

        // //当前方法重载方法的个数
        var n_overload_cnt = cls[str_mhd_name].overloads.length;
        console.log(n_overload_cnt);

        for (var index = 0; index < n_overload_cnt; index++) {
            cls[str_mhd_name].overloads[index].implementation = function () {
                //参数个数
                var n_arg_cnt = arguments.length;
                /*
                for (var idx_arg = 0; idx_arg < n_arg_cnt; n_arg_cnt++) 
                {
                    console.log(arguments[idx_arg]);   
                }
                */
                console.log(str_mhd_name + '--' + n_arg_cnt);
                return this[str_mhd_name].apply(this, arguments);
            }
        }
    }
}
// setTimeout setImmediate
setTimeout(function () { //prevent timeout
    console.log("[*] Starting script now!!!");
    Java.perform(function () {
        call_hook()
        // init_and_call_vir()
        // print_metheds()
        // traceClass('cn.sharesdk.wechat.favorite.WechatFavorite')
        // hook_all_methed()
        // force_load('cn.demo.login.ui.login.LoginActivity.access$100', print_metheds)
    })
}, 1000)
