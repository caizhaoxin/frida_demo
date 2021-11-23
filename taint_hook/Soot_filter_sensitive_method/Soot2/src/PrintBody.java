import soot.*;
import soot.options.Options;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.util.Collections;
import java.util.List;

public class PrintBody {
    public static String APK;
    public static String ANDROID_JAR;


    public static void init(){
        G.reset();
        //SetupApplication app = new SetupApplication(ANDROID_JAR,APK);


        Options.v().set_allow_phantom_refs(true);
//		Options.v().set_include_all(true);
		Options.v().set_allow_phantom_elms(true);
        Options.v().set_prepend_classpath(true);
        Options.v().set_validate(true);
        Options.v().set_whole_program(true);
        //Options.v().set_force_overwrite(true);
        //Options.v().set_output_format(Options.output_format_dex);
        Options.v().set_process_dir(Collections.singletonList(APK));

        //解析多个dex文件，这个配置真的太坑了，一定要填上，默认是false，不开启就会只解析第一个dex文件导致源码缺失
        Options.v().set_process_multiple_dex(true);
        Options.v().set_include_all(true);
//		Options.v().set_search_dex_in_archives(true);
//		Options.v().set_ignore_classpath_errors(true);
//		Options.v().set_ignore_resolution_errors(true);
//		Options.v().set_ignore_resolving_levels(true);
//		Options.v().set_wrong_staticness(Options.wrong_staticness_ignore);

        //最重要的是这里的设置要写set_android_jars，如果写set_force_android_jar就会报错，因为他要扫描所有的jar包而不是一个
        Options.v().set_android_jars(ANDROID_JAR);
        Options.v().set_src_prec(Options.src_prec_apk);
        Options.v().set_soot_classpath(ANDROID_JAR);


        Options.v().setPhaseOption("cg.spark", "off");

        Scene.v().loadNecessaryClasses();
    }

    public static void main(String[] args) {

        APK = args[0];
        ANDROID_JAR = args[1];

        init();
        try{
            BufferedReader reader = new BufferedReader(new FileReader("D:\\shareActionProject\\res.txt"));
            String[] strings = APK.split("/");
            String path = strings[strings.length - 1];
            path = path.substring(0, path.length() - 3);
            path += "txt";

            System.out.println(path);
            File file = new File(path);
            if (!file.exists())
                file.createNewFile();

            FileWriter writer = new FileWriter(file.getName(), false);
            String str = reader.readLine();
            boolean find = false;
            while (str != null){




                if (str.startsWith("#ThreadName:::")){
                    //System.out.println(str);
                    writer.write(str + "\r\n");
                    find = true;
                }



                if (str.startsWith("---------")){
                    writer.write("\r\n");
                    writer.write("\r\n");
                    writer.write("\r\n");
                    find = false;
                }




//                if (!str.contains("com.ssports")){
//                    str = reader.readLine();
//                    continue;
//                }




                if (find && !str.startsWith("#ThreadName:::")){
                    //System.out.println(str);
                    String[] s = str.split(" ");
                    String class_method = s[0];
                    int index = 0;
                    for (int i = class_method.length() - 1; i >= 0 ; i--) {
                        if (class_method.charAt(i) == '.'){
                            index = i;
                            break;
                        }
                    }

                    String clazz = class_method.substring(0, index);
                    String method = class_method.substring(index + 1, class_method.length());
                    //System.out.println(method);
                    //System.out.println(str);
                    String parms = s[1];
                    String[] split;
                    String returnType = s[2];
                    if (parms.length() > 2){
                        parms = parms.substring(1, parms.length() - 1);
                        split = parms.split(";");
                        for (int i = 0; i < split.length; i++) {
                            split[i] = split[i].substring(1, split[i].length());
                            split[i] = split[i].replace('/', '.');
                        }

                        String k = "";
                        for (int i = 0; i < split.length; i++) {
                            if (i == 0 || i == split.length - 1){
                                k += split[i];
                            }else{
                                k += split[i] + ",";
                            }
                        }

                        parms = k;
                    }

                    if (returnType.length() > 1){
                        returnType = returnType.substring(1, returnType.length() - 1).replace('/', '.');
                    }


                    try{
                        SootClass sootClass = Scene.v().getSootClass(clazz);
                        List<SootMethod> methods = sootClass.getMethods();
                        SootMethod method1 = null;
                        for (SootMethod temp :
                                methods) {
                            if (temp.getSignature().contains(method) && temp.getSignature().contains(returnType) && temp.getSignature().contains(parms)){
                                method1 = temp;
                            }
                        }


                        if (method1 != null){
                            Body body = method1.retrieveActiveBody();
                            writer.write(method1.getDeclaringClass() + "..." + method1.getName() + "\r\n");
                            //System.out.println(body);
                            writer.write(body.toString());
                        }



                    }catch (Exception e){
                        str = reader.readLine();
                        continue;
                    }



//                    SootClass sootClass = Scene.v().getSootClass("com.ssports.mobile.video.share.-$$Lambda$ShareDialog$ozr0h1Q2S_Y5_ihq7DdwElE4Oy0");
//                    List<SootMethod> methods = sootClass.getMethods();
//                    System.out.println(methods);
//                    int i = 0;
//                    System.out.println(sootClass);


                    //System.out.println(sootClass + ".........." + method1);


                    //System.out.println(clazz + "..." + method);
                }

                str = reader.readLine();

            }
        }catch (Exception e){
            e.printStackTrace();
        }

    }
}
