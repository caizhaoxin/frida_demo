Java.perform(function () {
    var tv_class = Java.use("cn.demo.login.ui.login.LoginActivity");
    tv_class.myLoginCheck.implementation = function (username, password) {
        var username_str = username.toString();
        var password_str = password.toString(); 
        // console.log(username_str, ' ', password_str)
        var string_to_recv;
        send({'username':username_str, 'password':password_str}); // 将数据发送给kali主机的python代码
        var handle_usernamem, handle_password
        recv(function (received_json_object) {
            handle_usernamem = received_json_object['username']
            handle_password = received_json_object['password']
            console.log("string_to_recv: " + handle_usernamem + ' ' + handle_password);
        }).wait(); //收到数据之后，再执行下去
        return this.myLoginCheck(handle_usernamem, handle_password);
    }
});