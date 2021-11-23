import soot.Body;
import soot.SootClass;
import soot.SootMethod;

import java.util.List;
import java.util.Map;
import java.util.Set;

public class ShareLocation {
    private SootClass clazz;
    private SootMethod method;
    private List<IdNode> idNameAndValue;
    private Body body;

    public ShareLocation(SootClass clazz, SootMethod method, Body body, List<IdNode> idNameAndValue) {
        this.clazz = clazz;
        this.method = method;
        this.idNameAndValue = idNameAndValue;
        this.body = body;
    }



    public Body getBody(){
        return body;
    }

    public SootClass getClazz() {
        return clazz;
    }

    public SootMethod getMethod() {
        return method;
    }


    public List<IdNode> getIdNameAndValue() {
        return idNameAndValue;
    }

    @Override
    public String toString() {
        return "ShareLocation{" +
                "clazz=" + clazz +
                ", method=" + method +
                '}';
    }
}
