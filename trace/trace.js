function traceClass(targetClass) {
    //Java.use是新建一个对象
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
    Java.use("cn.sharesdk.demo.platform.wechat.friends.WechatShare").shareText.overload().implementation = function () {
        printStack()
        this.shareText()
    }
    return 0;
}
// 获取类的实例
function get_instance(cls_name) {
    var cls = Java.classFactory.use(cls_name);
    //构造出这个类实例
    var ins = cls.$new()
    console.log('class: ', cls_name, 'has been ins. by code:', ins)
    return ins
}
// 开始trace debug的方法  这里暂时简单点硬编码doshare
function trace_hook_onclick(cls_name) {
    // hook onclick
    Java.use(cls_name).onClick.implementation = function (view) {
        console.log('-------------------------start trace-----------------------------')
        debug_start_trace('czx_test')
        this.onClick(view)
        debug_stop_trace()
        console.log('-------------------------stop trace-----------------------------')
    }
}
// 停止trace debug的方法  这里暂时简单点硬编码doshare
function stop_trace(cls_name) {
    Java.use(cls_name).a.overload('java.lang.String', 'boolean').implementation = function (str, z) {
        console.log('-------------------------stop trace-----------------------------')
        // debug_stop_trace()
        return this.a(str, z)
    }
}
// 开始Debug的tarce    Debug.startMethodTracing("log-"+MyDate.getDataStr());
function debug_start_trace(file_name) {
    var timestamp = Date.parse(new Date());
    var Debug = Java.use('android.os.Debug')
    // 单位 -> 字节， 设得太小会无法缓存
    var buffsize = 102400000
    if (file_name == '')
        Debug.startMethodTracing('default_trace-' + timestamp, buffsize)
    else
        Debug.startMethodTracing(file_name + '-' + timestamp, buffsize)
}
// 停止Debug的tarce    Debug.stopMethodTracing();
function debug_stop_trace() {
    var Debug = Java.use('android.os.Debug')
    Debug.stopMethodTracing()
}
// setTimeout setImmediate
setTimeout(function () { //prevent timeout
    console.log("[*] Starting script");
    var onclick_cls_name = 'com.ssports.mobile.video.share.-$$Lambda$ShareDialog$ozr0h1Q2S_Y5_ihq7DdwElE4Oy0'
    Java.perform(function () {
        var trace_start_cls_name = onclick_cls_name
        trace_hook_onclick(trace_start_cls_name)
        console.log('----------hook成功，可以开始点击！！！-------------')
    })
}, 3000)