



setTimeout(function () {
    Java.perform(function () {
        console.log('go hooking!')
        Java.use('cn.demo.login.data.model.Student$Pencil').GetPencil.implementation = function(){
            var new_str = "I don't have pencil!"
            return new_str
        }
    })
}, 1000)






