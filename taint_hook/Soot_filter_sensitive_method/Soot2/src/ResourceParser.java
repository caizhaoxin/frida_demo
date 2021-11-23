import com.sun.corba.se.impl.ior.OldJIDLObjectKeyTemplate;
import org.xmlpull.v1.XmlPullParserException;
import soot.jimple.infoflow.android.axml.AXmlAttribute;
import soot.jimple.infoflow.android.axml.AXmlHandler;
import soot.jimple.infoflow.android.axml.AXmlNode;
import soot.jimple.infoflow.android.axml.parsers.AXML20Parser;
import soot.jimple.infoflow.android.resources.ARSCFileParser;
import soot.jimple.infoflow.android.resources.ARSCFileParser.ResPackage;
import soot.jimple.infoflow.android.resources.ARSCFileParser.ResType;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

public class ResourceParser {

	private static String luanch_activity;

	private String apkFilePath;
	private HashMap<Integer, String> stringResMap;
	private File apkFile;
	private List<String> layoutReserveStr;

	public ResourceParser(String apkFilePath) throws IOException, XmlPullParserException {

		this.apkFile = new File(apkFilePath);
		if (!apkFile.exists())
			throw new RuntimeException(
					String.format("The given APK file %s does not exist", apkFile.getCanonicalPath()));

		this.apkFilePath = apkFilePath;
		this.stringResMap = getStringResourceMap();
		this.layoutReserveStr = FileUtil.readAllLinesFromFile("D:\\shareActionProject\\IoT-FlowDroid-master\\IoT-FlowDroid-master\\textRes\\string_layout_reserve.txt");
	}

	private HashMap<Integer, String> getStringResourceMap(){
		HashMap<Integer, String> stringResMap = new HashMap<Integer, String>();

		ARSCFileParser parser = new ARSCFileParser();

		try {
		    parser.parse(apkFilePath);

		    List<ResPackage> packages = parser.getPackages();

		    // if packages is empty, UI parsing will failed by flowdroid, try to upgrade to a newer version.

		    if(!packages.isEmpty()) {
		    	for (ResType resType : parser.getPackages().get(0).getDeclaredTypes()) {

			        if (resType.getTypeName().equals("string")) {
			            for (ARSCFileParser.AbstractResource resource : resType.getAllResources()) {
							if (resource instanceof ARSCFileParser.StringResource){
								ARSCFileParser.StringResource stringResource = (ARSCFileParser.StringResource) resource;
								stringResMap.put(stringResource.getResourceID(), stringResource.getValue());
							}

			            }
			        }

			        if (resType.getTypeName().equals("id")) {
			            for (ARSCFileParser.AbstractResource resource : resType.getAllResources()) {
			            	stringResMap.put(resource.getResourceID(), resource.getResourceName());
			            }
			        }
			    }
		    }

		} catch (IOException e) {
		    e.printStackTrace();
		}

		return stringResMap;
	}

	private HashMap<Integer, String> getUIResourceMap(){
		HashMap<Integer, String> uiResMap = new HashMap<Integer, String>();
		ARSCFileParser parser = new ARSCFileParser();

		try {
		    parser.parse(apkFilePath);
		    List<ResPackage> packages = parser.getPackages();
		    if(!packages.isEmpty()) {
		    	for (ResType resType : parser.getPackages().get(0).getDeclaredTypes()) {

			        if (resType.getTypeName().equals("layout")) {
			            for (ARSCFileParser.AbstractResource resource : resType.getAllResources()) {
			            	uiResMap.put(resource.getResourceID(), resource.getResourceName());
			            }
			        }
			    }
		    }

		} catch (IOException e) {
		    e.printStackTrace();
		}

		return uiResMap;
	}

	public Map<String, List<Map<String,String>>> parseLayout() {

		Map<String, List<Map<String,String>>> layoutStrMap = new HashMap<String, List<Map<String,String>>>();

		try {
			ZipFile archive = null;
			try {
				archive = new ZipFile(this.apkFile);
				Enumeration<?> entries = archive.entries();
				//System.out.println(entries);
				while (entries.hasMoreElements()) {
					ZipEntry entry = (ZipEntry) entries.nextElement();
					String entryName = entry.getName();
					//System.out.println(entryName);

					if(entryName.contains("AndroidManifest")) {
						System.out.println(entryName);
						InputStream is = null;
						try {
							is = archive.getInputStream(entry);
							List<Map<String, String>> strInViewList = parseLayoutByView(entryName, is);

							if(strInViewList.size()>0) {
								layoutStrMap.put(entryName, strInViewList);
							}
						}
						finally {
							if (is != null)
								is.close();
						}
					}
				}
			}
			finally {
				if (archive != null)
					archive.close();
			}
		}
		catch (Exception e) {
			System.err.println("Error when looking for XML resource files in apk"
					+ apkFile.getAbsolutePath() + ": " + e);
			e.printStackTrace();
			if (e instanceof RuntimeException)
				throw (RuntimeException) e;
			else
				throw new RuntimeException(e);
		}

		//System.out.println(layoutStrMap);
		return layoutStrMap;
	}

	public List<Map<String, String>> parseLayoutByView(String viewName, InputStream stream) {

		List<Map<String, String>> strInViewList = new ArrayList<>();

		try {
			AXmlHandler handler = new AXmlHandler(stream, new AXML20Parser());
			parseLayoutNode(viewName, handler.getDocument().getRootNode(), strInViewList);

		}
		catch (Exception ex) {
			System.err.println("Could not read binary XML file:  " + ex.getMessage());
			ex.printStackTrace();
		}

		return strInViewList;
	}



	public String findLuanchActivity(){
		try {
			ZipFile archive = null;
			try {
				archive = new ZipFile(this.apkFile);
				Enumeration<?> entries = archive.entries();
				//System.out.println(entries);
				while (entries.hasMoreElements()) {
					ZipEntry entry = (ZipEntry) entries.nextElement();
					String entryName = entry.getName();
					//System.out.println(entryName);

					if(entryName.contains("AndroidManifest.xml")) {
						System.out.println(entryName);
						InputStream is = null;
						try {
							is = archive.getInputStream(entry);
							try {
								AXmlHandler handler = new AXmlHandler(is, new AXML20Parser());
								parseLayoutNode(entryName, handler.getDocument().getRootNode(), null);
							}
							catch (Exception ex) {
								System.err.println("Could not read binary XML file:  " + ex.getMessage());
								ex.printStackTrace();
							}

						}
						finally {
							if (is != null)
								is.close();
						}
					}
				}
			}
			finally {
				if (archive != null)
					archive.close();
			}
		}
		catch (Exception e) {
			System.err.println("Error when looking for XML resource files in apk"
					+ apkFile.getAbsolutePath() + ": " + e);
			e.printStackTrace();
			if (e instanceof RuntimeException)
				throw (RuntimeException) e;
			else
				throw new RuntimeException(e);
		}


		return luanch_activity;
	}
	
	private void parseLayoutNode(String viewName, AXmlNode rootNode, List<Map<String, String>> strInViewList) {

		if (rootNode == null)
			return;

		if (rootNode.toString().contains("android.intent.action.MAIN")){
			List<AXmlNode> brothers = rootNode.getParent().getChildren();
			boolean isFind = false;

			for (AXmlNode brother:
				 brothers) {
				if (brother.toString().contains("android.intent.category.LAUNCHER")){
					isFind = true;
					break;
				}
			}

			if (isFind){
				//System.out.println(rootNode.getParent().getParent());
				AXmlNode parent = rootNode.getParent().getParent();
				AXmlAttribute<?> name = parent.getAttribute("name");
				String name1 = (String) name.getValue();
				//System.out.println(name1);
				luanch_activity = name1;

			}
		}

		for (AXmlNode childNode : rootNode.getChildren()) {

			//System.out.println(childNode);

			
			// Handle Fragment View:
			// if find fragment element, record its ID and find the connecting point between fragment ID and layout ID.
			// Then add all fragment texts to the original UI.
			// System.out.println(childNode.getTag());
			
//			AXmlAttribute<?> idAttr = childNode.getAttribute("id");
//			AXmlAttribute<?> textAttr = childNode.getAttribute("text");
//			AXmlAttribute<?> stringAttr = childNode.getAttribute("string");
//			//System.out.println(childNode.getTag());
//			if(idAttr != null || textAttr != null || stringAttr != null) {
//				Object attrValueId = null;
//				Object attrValueText = null;
//				Object attrValueIdName = null;
//				Object stringValue = null;
//				if (idAttr != null){
//					attrValueId = idAttr.getResourceId();
//					attrValueIdName = idAttr.getValue();
//				}
//
//				if (textAttr != null) {
//					attrValueText = textAttr.getValue();
//				}
//
//				if (stringAttr != null){
//					stringValue = stringAttr.getValue();
//				}
//
//				//int resourceId = idAttr.getResourceId();
//				String realAttrValueId = "";
//				String realAttrValueText = "";
//				String realAttrValueName = "";
//				String realStringValue = "";
//				if(attrValueId instanceof Integer) {
//					if(stringResMap.containsKey(attrValueId)) {
//						realAttrValueId = stringResMap.get(attrValueId);
//					}else {
//						realAttrValueId = attrValueId.toString();
//					}
//				}else {
//					if (attrValueId != null){
//						realAttrValueId = attrValueId.toString();
//					}
//				}
//
//				if(attrValueText instanceof Integer) {
//					if(stringResMap.containsKey(attrValueText)) {
//						realAttrValueText = stringResMap.get(attrValueText);
//					}else {
//						realAttrValueText = attrValueText.toString();
//					}
//				}else {
//					if (attrValueText != null){
//						realAttrValueText = attrValueText.toString();
//					}
//				}
//
//				if(attrValueIdName instanceof Integer) {
//					if(stringResMap.containsKey(attrValueIdName)) {
//						realAttrValueName = stringResMap.get(attrValueIdName);
//					}else {
//						realAttrValueName = attrValueIdName.toString();
//					}
//				}else {
//					if (attrValueIdName != null){
//						realAttrValueName = attrValueIdName.toString();
//					}
//				}
//
//				if(stringValue instanceof Integer) {
//					if(stringResMap.containsKey(stringValue)) {
//						realStringValue = stringResMap.get(stringValue);
//					}else {
//						realStringValue = stringValue.toString();
//					}
//				}else {
//					if (stringValue != null){
//						realStringValue = stringValue.toString();
//					}
//				}
//				// add strings to strViewList
//				HashMap<String, String> map = new HashMap<>();
//				//map.put(realAttrValueId, realAttrValueText);
//				map.put("id", realAttrValueId);
//				map.put("id_name", realAttrValueName);
//				map.put("text", realAttrValueText);
//				map.put("tag", childNode.getTag());
//				map.put("string", realStringValue);
//				strInViewList.add(map);
//			}
			
			// If there's no string in text attribute, we parse semantics in ID strings
//			else {
//				if(idAttr != null) {
//					Object attrValue = idAttr.getValue();
//					if(stringResMap.containsKey(attrValue)) {
//						String realAttrValue = this.filterReserveStrForIdAttr(stringResMap.get(attrValue));
//						strInViewList.add(realAttrValue);
//					}
//				}
//			}
			//recursively analyze child nodes
			this.parseLayoutNode(viewName, childNode, strInViewList);
		}


		
	}
	
	private String filterReserveStrForIdAttr(String origStr) {
		String transformedStr = origStr;
		for(String item : this.layoutReserveStr) {
			if(origStr.toLowerCase().contains(item)) {
				
				int beginIndex = origStr.toLowerCase().indexOf(item);
				int endIndex = beginIndex + item.length();
				String subStr = origStr.substring(beginIndex, endIndex);
				//System.out.println(subStr);
				transformedStr = origStr.replace(subStr, "");
				//System.out.println("[Orig]: " + origStr +" [Transform]:" + transformedStr);
				return transformedStr;
			}
		}
		return transformedStr;
	}
	
}
