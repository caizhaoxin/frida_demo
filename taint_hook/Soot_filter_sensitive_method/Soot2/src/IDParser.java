import soot.G;
import soot.PackManager;
import soot.Scene;
import soot.SootClass;
import soot.jimple.infoflow.android.axml.AXmlAttribute;
import soot.jimple.infoflow.android.axml.AXmlNode;
import soot.jimple.infoflow.android.manifest.ProcessManifest;
import soot.options.Options;
import soot.util.Chain;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class IDParser {


    private ResourceParser parser = null;

    public IDParser(String apkPath){
        try {
            parser = new ResourceParser(apkPath);
        } catch (Exception e) {
            System.out.println("读取文件失败");
            return;
        }
    }

    public Map<String, List<Map<String, String>>> selectShareIdFromApk(){
        return layoutMap(parser);
    }




    //解析layout的控件
    private Map<String, List<Map<String, String>>> layoutMap(ResourceParser parser) {
        //parseLayout返回的类型是一个map,key是xml文件，value是里面所有的控件
        Map<String, List<Map<String, String>>> parseLayout = parser.parseLayout();
        Map<String, List<Map<String, String>>> result = new HashMap<>();

        for (Map.Entry<String, List<Map<String, String>>> entry :
                parseLayout.entrySet()) {
            boolean iswx = false;
            boolean isqq = false;
            boolean iscircle = false;
            boolean isShare = false;
            List<Map<String, String>> value = entry.getValue();
            //System.out.println(value);
            for (Map<String, String> temp :
                    value) {
                String id_name = temp.get("id_name");
                String text = temp.get("text");
                String tag = temp.get("tag");
                String string = temp.get("string");


                //当一个xml布局文件中同时有微信，qq，朋友圈三个text的时候，就可以形成一个主键来识别是不是分享的页面
                if (text.contains("微信"))
                    iswx = true;

                if (text.toLowerCase().contains("qq"))
                    isqq = true;

                if (text.contains("朋友圈"))
                    iscircle = true;

                if (id_name.toLowerCase().contains("share") || (!string.equals("") && string.toLowerCase().contains("share")))
                    isShare = true;


            }

            if (iswx && isqq && iscircle && isShare)
                result.put(entry.getKey(), value);


        }

        return result;
    }

    public String find_luanch_activity(){
        return parser.findLuanchActivity();
    }


}

