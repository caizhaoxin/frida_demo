//定义RPC
rpc.exports = {
    //这里定义了一个给外部调用的方法：sms
    sms: function () {
        var result = "";
        //嵌入HOOK代码
        Java.perform(function () {
            var main_activity = Java.use("cn.demo.login.ui.login.LoginActivity");
            main_activity.myLoginCheck.implementation = function(a,b){
                this.myLoginCheck("xinxin", "123456")
            }
            //拿到class类
            var onclick_listener = Java.use("cn.demo.login.ui.login.LoginActivity$5");
            //最终rpc的sms方法会返回add(1,3)的结果！
            onclick_listener.onClick
        });
        return result;
    },
};