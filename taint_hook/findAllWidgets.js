function patchViewGroupTraverse(ActivityName) {
    Java.use(ActivityName).onCreate.implementation = function (view) {
        console.log("===================================")
    
        var rootView = this.getWindow().getDecorView().getRootView()
        var type = Object.prototype.toString.call(rootView)

        var count = rootView.getChildCount()
        console.log(count)
        // var viewGroup = Java.cast(rootView, Java.use("android.view.ViewGroup"))
        //console.log(viewGroup)
        // let rootView = this.getWindow().getDecorView().getRootView();
        // let viewGroup = Java.cast(rootView, Java.use("android.view.ViewGroup"));
        //traverse(viewGroup);
        this.onCreate(view);
    }
}

function traverse(root) {

    
    // if (Utils.isInstanceof(root, "android.widget.TextView")){
    //     var textView = Java.cast(root, Java.use("android.widget.TextView"))
    //     var text = textView.getText()
    //     console.log(text)
    // }

    LogManager.d(TAG, "traverse click");
    var childCount = root.getChildCount();

    for (var i = 0; i < childCount; i++) {
        var child = root.getChildAt(i);
        // if (Utils.isInstanceOf(child, "android.view.View")) { //判断是否为分享button
        //     var buttonView = Java.cast(child, Java.use("android.view.View"));
        //     buttonView.performClick();
        // }

        // if (Utils.isInstanceOf(child, "android.view.ViewGroup")) {
        //     let view = Java.cast(child, Java.use("android.view.View"));
        //     view.performClick();
        //     let childGroup = Java.cast(child, Java.use("android.view.ViewGroup"));
        //     traverse(childGroup);
        // }

        traverse(child)
    }
}


// setTimeout setImmediate
setImmediate(function () { //prevent timeout
    console.log("[*] Starting script");
    Java.perform(function () {
        patchViewGroupTraverse("cn.shihuo.modulelib.views.zhuanqu.detail.ShoppingDetailActivity")
    })
})