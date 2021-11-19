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
function trace_hook_onclick() {
    send({ 'method': 'get_cls_met_name' }); // 发送空方法，促发
    var cls_met_name = ''
    var trace_file_name = ''
    recv(function (received_json_object) {
        cls_met_name = received_json_object['cls_met_name']
        trace_file_name = received_json_object['trace_file_name']
        console.log('hook', cls_met_name, 'successfully');
    }).wait(); //收到数据之后，再执行下去
    // hook onclick
    Java.use(cls_met_name).onClick.implementation = function (view) {
        console.log('hooking ', cls_met_name, ' now')
        console.log('-------------------------start trace-----------------------------')
        console.log('hook', trace_file_name, '   trace_file_name');
        debug_start_trace(trace_file_name)
        this.onClick(view)
        debug_stop_trace()
        send({ 'method': 'pull_trace' });
        recv(function (received_json_object) { }).wait(); //同步阻塞
        console.log('-------------------------stop trace-----------------------------')
    }
}
// 停止trace debug的方法  这里暂时简单点硬编码doshare
function stop_trace(cls_name) {
    Java.use(cls_name).a.overload('java.lang.String', 'boolean').implementation = function (str, z) {
        console.log('--------------------------stop trace-----------------------------')
        // debug_stop_trace()
        return this.a(str, z)
    }
}
// 开始Debug的tarce    Debug.startMethodTracing("log-"+MyDate.getDataStr());
function debug_start_trace(trace_file_name) {
    var Debug = Java.use('android.os.Debug')
    var buffsize = 1024000000
    // 单位 -> 字节， 设得太小会无法缓存
    Debug.startMethodTracing(trace_file_name, buffsize)
}
// 停止Debug的tarce    Debug.stopMethodTracing();
function debug_stop_trace() {
    var Debug = Java.use('android.os.Debug')
    Debug.stopMethodTracing()
}
function time_trace() {
    // send({ 'method': 'get_cls_met_name' }); // 发送空方法，促发
    var cls_met_name = ''
    var trace_file_name = ''
    recv(function (received_json_object) {
        cls_met_name = received_json_object['cls_met_name']
        trace_file_name = received_json_object['trace_file_name']
        console.log('hook', cls_met_name, 'successfully');
    }).wait(); //收到数据之后，再执行下去
    debug_start_trace(trace_file_name)
    setTimeout(function () {
        Java.perform(function () {
            debug_stop_trace()
            send({'method': 'pull_trace'});
            console.log('----------结束trace！！！-------------')
        })
    }, 30000)
}
// setTimeout setImmediate
setTimeout(function () { //prevent timeout
    console.log("[*] Starting script");
    Java.perform(function () {
        // time_trace()
        trace_hook_onclick()
        console.log('----------hook成功，可以开始点击！！！-------------')
        // console.log('----------开始trace！！！-------------')
        // var timestamp = (new Date()).valueOf();
        // debug_start_trace('czx'+timestamp)
        // setTimeout(function(){
        //     Java.perform(function(){
        //         debug_stop_trace()
        //         // send({'method': 'pull_trace'});
        //         console.log('----------结束trace！！！-------------')
        //     })
        // },30000)
    })
}, 2000)