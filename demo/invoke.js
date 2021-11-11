function find(cls_name) {
    Java.choose(cls_name, {
        onMatch: function (instance) {
            //onMatch回调会在找到类的实例后调用，也就是说内存中有多少实例，就会调用多少次
            console.log('instance:    ', instance)
            var cls_name = 'cn.sharesdk.demo.platform.wechat.friends.WechatShare'
            var cls = Java.use(cls_name)
            var ins = cls.$new()
            ins.overload().shareText()
        },
        onComplete: function () {
            //onComplete回调会在所有onMatch完成后调用
            console.log('match complete')
        }
    })
}
setTimeout(function () { //prevent timeout
    console.log("[*] Starting script");
    Java.perform(function () {
        // var trace_start_cls_name = 'cn.sharesdk.wechat.friends.Wechat'
        // start_trace(trace_start_cls_name)
        // var trace_start_ins = get_instance(trace_start_cls_name)
        // var trace_stop_cls_name = 'cn.sharesdk.framework.b.c'
        // stop_trace(trace_stop_cls_name)

        // var shareParams_cls_name = 'cn.sharesdk.framework.Platform$ShareParams'
        // var shareParams_ins = get_instance(shareParams_cls_name)

        // console.log('----------开始trace！！！-------------')
        // trace_start_ins.doShare(shareParams_ins)

        // call_hook()

        // var listener_cls_name = 'cn.sharesdk.demo.manager.share$'
        // var cls_name = 'cn.sharesdk.demo.platform.wechat.friends.WechatShare'
        // var cls = Java.use(cls_name)
        // var ins = cls.$new()
        // ins.overload().shareText()
        find('cn.sharesdk.demo.manager.share.ShareTypeManager')
    })
}, 1000)