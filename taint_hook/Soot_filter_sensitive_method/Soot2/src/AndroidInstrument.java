import jdk.nashorn.internal.codegen.CompilerConstants;
import pxb.android.axml.Axml;
import soot.*;
import soot.javaToJimple.InitialResolver;
import soot.javaToJimple.InnerClassInfo;
import soot.jimple.*;
import soot.jimple.infoflow.InfoflowConfiguration;
import soot.jimple.infoflow.android.InfoflowAndroidConfiguration;
import soot.jimple.infoflow.android.SetupApplication;
import soot.jimple.infoflow.android.axml.AXmlNode;
import soot.jimple.internal.InvokeExprBox;
import soot.jimple.spark.SparkTransformer;
import soot.jimple.toolkits.callgraph.*;
import soot.options.Options;
import soot.tagkit.Tag;
import soot.toolkits.graph.*;
import soot.util.Chain;
import soot.util.queue.QueueReader;

import javax.crypto.Cipher;
import java.io.*;
import java.net.HttpURLConnection;
import java.util.*;


public class AndroidInstrument {
	public static String APK = "E:\\Master\\Project\\test\\MUJIPassport.apk";
	public static String ANDROID_JAR = "E:\\Android\\Sdk\\platforms";
	//public static boolean isFind = false;

	protected static List<String> excludePackagesList = new ArrayList<String>();
	private static Map<String,Boolean> visited = new HashMap<String,Boolean>();
	private static  Vector<String> file_vec =  new Vector<String>();

	private static Map<String,Boolean> visited_node = new HashMap<String,Boolean>();
	//private static CGExporter cge = new CGExporter();
	private static List<String> path = new ArrayList<>();
	private static int count = 0;

	//白名单列表，这里面的类就不会去扫描
	static {
		excludePackagesList.add("java.");
		excludePackagesList.add("android.");
		excludePackagesList.add("javax.");
		excludePackagesList.add("android.support.");
		excludePackagesList.add("sun.");
		//excludePackagesList.add("com.google.");
	}

	//这里配置及其的繁琐，而且还没有多少人做，所以找问题特别的麻烦
	private static void init() {
		G.reset();
		//SetupApplication app = new SetupApplication(ANDROID_JAR,APK);
		Options.v().set_ignore_classpath_errors(true);

		Options.v().set_allow_phantom_refs(true);
		Options.v().set_allow_phantom_elms(true);
		Options.v().set_include_all(true);
		Options.v().set_prepend_classpath(true);
		// Options.v().set_validate(true);
		Options.v().set_whole_program(true);
		// Options.v().set_force_overwrite(true);
		// Options.v().set_output_format(Options.output_format_dex);
		Options.v().set_process_dir(Collections.singletonList(APK));

		//解析多个dex文件，这个配置真的太坑了，一定要填上，默认是false，不开启就会只解析第一个dex文件导致源码缺失
		Options.v().set_process_multiple_dex(true);
		// Options.v().set_include_all(true);
//		Options.v().set_search_dex_in_archives(true);

		Options.v().set_ignore_resolution_errors(true);
		Options.v().set_ignore_resolving_levels(true);
		Options.v().set_wrong_staticness(Options.wrong_staticness_ignore);

		// 最重要的是这里的设置要写set_android_jars，如果写set_force_android_jar就会报错，因为他要扫描所有的jar包而不是一个
		Options.v().set_android_jars(ANDROID_JAR);
		Options.v().set_src_prec(Options.src_prec_apk);
		Options.v().set_soot_classpath(ANDROID_JAR);
		// 添加白名单
		Options.v().set_exclude(excludePackagesList);

		// Options.v().setPhaseOption("cg.spark", "off");

		Scene.v().loadNecessaryClasses();


	}

//	protected static boolean isExcludeClass(SootClass sootClass) {
//		if (sootClass.isPhantom()) {
//			return true;
//		}
//
//		String packageName = sootClass.getPackageName();
//		for (String exclude : excludePackagesList) {
//			if (packageName.startsWith(exclude)) {
//				return true;
//			}
//		}
//
//		return false;
//	}
//
//	public static boolean checkWidgetIsInMethod(SootMethod method, List<Map<String, String>> widgets) {
//		Body body = method.getActiveBody();
//		String strBody = body + "";
//		for (Map<String, String> map :
//				widgets) {
//			String id_name = map.get("id_name");
//			if (strBody.contains(id_name))
//				return true;
//		}
//		return false;
//	}
//
//	public static boolean checkLayoutIsInMethod(SootMethod method, String layoutName) {
//		Body body = method.getActiveBody();
//		String strBody = body + "";
//		if (strBody.contains(layoutName))
//			return true;
//
//		return false;
//	}
//
//	public static String parseXmlFileNameToLayoutName(String xmlFileName) {
//		String[] strings = xmlFileName.split("/");
//		String temp = strings[strings.length - 1];
//		String result = temp.substring(0, temp.length() - 4);
//		return result;
//	}
//
//	public static String[] getXmlFileNames(Map<String, List<Map<String, String>>> listMap) {
//		String[] xmlFileNames = new String[listMap.size()];
//		int k = 0;
//		for (Map.Entry<String, List<Map<String, String>>> temp :
//				listMap.entrySet()) {
//			xmlFileNames[k++] = temp.getKey();
//		}
//
//		return xmlFileNames;
//	}
//
//	public static List<Map<String, String>> getWidgetByXmlFileName(String xmlFileName, Map<String, List<Map<String, String>>> listMap) {
//		return listMap.get(xmlFileName);
//	}
//
//
//	//在一堆组件中过滤掉一些没有用的组件，比如说一些非id的东西
//	public static Map<String, List<Map<String, String>>> filterUselessWidgets(Map<String, List<Map<String, String>>> listMap) {
//		Map<String, List<Map<String, String>>> map = new HashMap<>();
//		System.out.println(listMap);
//		for (Map.Entry<String, List<Map<String, String>>> temp :
//				listMap.entrySet()) {
//			String xmlFileName = temp.getKey();
//			List<Map<String, String>> value = temp.getValue();
//			List<Map<String, String>> list = new ArrayList<>();
//			for (Map<String, String> temp1 :
//					value) {
//				String id_name = temp1.get("id_name");
//				String tag = temp1.get("tag");
//				String text = temp1.get("text");
//				String string = temp1.get("string");
//				boolean iswx = false;
//				boolean isqq = false;
//				boolean isweibo = false;
//				boolean isvalid = false;
////				if (tag.toLowerCase().contains("layout"))
////					continue;
//
//				if (id_name.equals(""))
//					continue;
//
//				String s = id_name.toLowerCase();
//
//				if (s.contains("weixin") || s.contains("wx") || s.contains("wechat"))
//					iswx = true;
//
//				if (s.contains("qq"))
//					isqq = true;
//
//				if (s.contains("xinlang") || s.contains("sina") || s.contains("wb") || s.contains("weibo"))
//					isweibo = true;
//
//				if ((text.contains("微信") || text.toLowerCase().contains("qq") || text.contains("微博") || text.contains("朋友圈")))
//					isvalid = true;
//
//
//				if (isqq || isvalid || isweibo || iswx)
//					list.add(temp1);
//			}
//
//			map.put(xmlFileName, list);
//		}
//
//
//		return map;
//	}
//
//	//id_name进行一个变化
//	private static String extractIdOrLayout(SootClass sootclass, String id_name) {
//		SootField file_paths = sootclass.getFieldByName(id_name);
//		System.out.println(file_paths);
//		List<Tag> tags = file_paths.getTags();
//		String[] s = tags.toString().split(" ");
//		return s[1].substring(0, s[1].length() - 1);
//	}
//
//
//	//通过查找Android中自动生成的R.id的文件来找到id_name对应的id_value
//	private static List<IdNode> findIdValue(List<Map<String, String>> origin_id_name) {
//		//System.out.println(origin_id_name);
//		Chain<SootClass> classes = Scene.v().getClasses();
//		List<IdNode> result = new ArrayList<>();
//		Map<String, String> map = new HashMap<>();
//		for (SootClass sootclass :
//				classes) {
//
//			if (result.size() >= origin_id_name.size())
//				break;
//
//			if (isExcludeClass(sootclass))
//				continue;
//
//			if (sootclass.getName().contains("R$id") && result.size() < origin_id_name.size()) {
//				//System.out.println(sootclass.getName());
//				int k = 0;
//				for (Map<String, String> map1 :
//						origin_id_name) {
//					String id_name = map1.get("id_name");
//
//					try {
//						String s = extractIdOrLayout(sootclass, id_name);
//						//System.out.println(id_name + "=" + s);
//						IdNode node = new IdNode(id_name, s);
//						result.add(node);
//					} catch (Exception e) {
//						continue;
//					}
//
//				}
//
//
//			}
//
//		}
//		return result;
//	}
//
//	//通过查找Android中自动生成的R.id的文件来找到id_name对应的id_value
//	private static List<IdNode> findLayoutIdValue(String origin_id_name) {
//		//System.out.println(origin_id_name);
//		Chain<SootClass> classes = Scene.v().getClasses();
//		List<IdNode> result = new ArrayList<>();
//		Map<String, String> map = new HashMap<>();
//		boolean isFind = false;
//		for (SootClass sootclass :
//				classes) {
//
//
//
//			if (isExcludeClass(sootclass))
//				continue;
//
//			if (sootclass.getName().contains("R$layout") && !isFind) {
//				//System.out.println(sootclass.getName());
//				int k = 0;
//
//
//				try {
//					String s = extractIdOrLayout(sootclass, origin_id_name);
//					//System.out.println(id_name + "=" + s);
//					//IdNode node = new IdNode(origin_id_name, s);
//					//result.add(node);
//					isFind = true;
//				} catch (Exception e) {
//					continue;
//				}
//
//
//
//
//			}
//
//		}
//		return result;
//	}
//
//
//
//
//	//通过匹配id来找到对应的class类
//	private static List<ShareLocation> findClassById(List<IdNode> idValue, int type){
//		System.out.println(idValue);
//		List<ShareLocation> list = new ArrayList<>();
//		List<IdNode> newIdValue = new ArrayList<>();
//		Chain<SootClass> classes = Scene.v().getClasses();
//		for (SootClass sootclass :
//				classes) {
//
//			if (isExcludeClass(sootclass))
//				continue;
//
//
//			List<SootMethod> methods = sootclass.getMethods();
//
//			for (SootMethod method :
//					methods) {
//
//				int count = 0;
//
//
//				try{
//					Body body = method.retrieveActiveBody();
//					//System.out.println(body);
//					for (IdNode temp :
//							idValue) {
//						String id_name = temp.getId_name();
//						String id_value = temp.getId_value();
//
//						//System.out.println(temp);
//						String strbody = body + "";
//						if ((strbody.contains(id_name) || strbody.contains(id_value)) && strbody.toLowerCase().contains("findviewbyid") && type == 1){
//							IdNode idNode = new IdNode(id_name, id_value);
//							newIdValue.add(idNode);
//							count++;
//						}
//
//						if ((strbody.contains(id_name) || strbody.contains(id_value)) && type == 2){
//							ShareLocation shareLocation = new ShareLocation(sootclass, method, body, null);
//						}
//					}
//
//					if (count >= 2 && type == 1){
//						ShareLocation shareLocation = new ShareLocation(sootclass, method, body, newIdValue);
//						list.add(shareLocation);
//					}
//
//
//				}catch (Exception e){
//					continue;
//				}
//			}
//		}
//
//		return list;
//
//	}
//
//
//
//	public static Map<SootMethod, SootMethod> getAllReachableMethods(SootMethod initialMethod){
//
//		Options.v().set_main_class(initialMethod.getSignature());
//		Scene.v().setEntryPoints(Collections.singletonList(initialMethod));
//		//System.out.println(entryPoint.getActiveBody());
//
//		//PackManager.v().getPack("cg").apply();
//		PackManager.v().runPacks();
//		//System.out.println("Call graph:");
//		//System.out.println(Scene.v().getCallGraph());
//
//		CallGraph callgraph = Scene.v().getCallGraph();
//		List<SootMethod> queue = new ArrayList<>();
//		queue.add(initialMethod);
//		Map<SootMethod, SootMethod> parentMap = new HashMap<>();
//		parentMap.put(initialMethod, null);
//		for(int i=0; i< queue.size(); i++){
//			SootMethod method = queue.get(i);
//			for (Iterator<Edge> it = callgraph.edgesOutOf(method); it.hasNext(); ) {
//				Edge edge = it.next();
//				SootMethod childMethod = edge.tgt();
//				if(parentMap.containsKey(childMethod))
//					continue;
//				parentMap.put(childMethod, method);
//				queue.add(childMethod);
//			}
//		}
//		return parentMap;
//	}
//
//	public static String getPossiblePath(Map<SootMethod, SootMethod> reachableParentMap, SootMethod it) {
//		String possiblePath = null;
//		while(it != null){
//			String itName = it.getDeclaringClass().getShortName()+"."+it.getName();
//			if(possiblePath == null)
//				possiblePath = itName;
//			else
//				possiblePath = itName + " -> " + possiblePath;
//			it = reachableParentMap.get(it);
//		}
//		return possiblePath;
//	}
//
//	//找到控件对应的OnClick函数的位置
//	public static void findOnclick(ShareLocation shareLocation){
//		List<IdNode> idNameAndValue = shareLocation.getIdNameAndValue();
//		SootClass clazz = shareLocation.getClazz();
//		SootMethod method = shareLocation.getMethod();
//
//		Body body = shareLocation.getBody();
//		UnitPatchingChain units = body.getUnits();
//		boolean isFindValue = false;
//		boolean isFindOnClickListener = false;
//		boolean isFindIdName = false;
//		Value value = null;
//
//		//通过jimple语言的特性来一个个unit遍历对比
//		for (Unit unit :
//				units) {
//
//
//			if (isFindOnClickListener)
//				break;
//
//			String strunit = unit + "";
//
//			for (IdNode node :
//					idNameAndValue) {
//
//				if (isFindValue)
//					break;
//
//				String id_name = node.getId_name();
//				String id_value = node.getId_value();
//				String jimple_id_name = "";
//				if (strunit.contains(id_name) && !isFindIdName){
//
//					List<ValueBox> defBoxes = unit.getDefBoxes();
//					Value value1 = defBoxes.get(0).getValue();
//					jimple_id_name = value1.toString();
//
//					isFindIdName = true;
//
//
//				}
//
//				if (strunit.toLowerCase().contains("findviewbyid") && (strunit.contains(id_value) || strunit.contains(jimple_id_name))){
//					//System.out.println(strunit);
//					List<ValueBox> defBoxes = unit.getDefBoxes();
//					ValueBox button_widget = defBoxes.get(0);
//
//					value = button_widget.getValue();
//					//System.out.println(value);
//					isFindValue = true;
//				}
//			}
//
//			if (isFindValue){
//				if (strunit.toLowerCase().contains("setonclicklistener") && strunit.contains("virtualinvoke") && strunit.contains(value.toString())){
//					isFindOnClickListener = true;
//					List<ValueBox> useBoxes = unit.getUseBoxes();
//					ValueBox valueBox = useBoxes.get(0);
//					String class_name = valueBox.getValue().getType().toString();
//					SootClass onclick_class = Scene.v().getSootClass(class_name);
//					SootMethod onclick_method = onclick_class.getMethodByName("onClick");
//					System.out.println(onclick_class + "...." + onclick_method);
//				}
//			}
//		}
//	}


	public static void main(String[] args) throws IOException, InterruptedException {
		if (args.length != 5) {
			System.out.println("Usage: ");
			System.out.println("Args[0] <- Please input the path of your ANDROID_JAR, (for example, E:\\Android\\Sdk\\platforms): ");
			System.out.println("Args[1] <- Please input the path of your apks: ");
			System.out.println("Args[2] <- Please input the path where you want to store method_body's txt: ");
			System.out.println("Args[3] <- Please input the path where you want to store the final result: ");
			System.out.println("Args[4] <- Please input the path where the python script located: ");
		}
		ANDROID_JAR = args[0];
		APK = args[1];
		String bodyOutPath = args[2];
		String resPath = args[3];
		String pythonPath = args[4];

		init();
		Chain<SootClass> classes = Scene.v().getClasses();

		PrintStream out = new PrintStream(bodyOutPath);
		System.setOut(out);
		for (SootClass clazz : classes) {
			List<SootMethod> methods = clazz.getMethods();
			for (SootMethod method : methods) {
				String signature = method.getSignature();

				try {
					Body body = method.retrieveActiveBody();
					String writeSignature = "the_signature_of_the_method: " + signature + "signature_done";
					System.out.print(writeSignature);
					System.out.println(body);
				}
				catch (Exception e) {
//					System.out.println(e);
				}

			}
		}

		Process p = Runtime.getRuntime().exec("python " + pythonPath + " " + bodyOutPath
				+ " " + resPath);
		int ret = p.waitFor();
		if (ret == 0) {
			System.out.println("Done!");
		}
		else {
			System.out.println("Something wrong with pythonScript.");
		}

	}
}