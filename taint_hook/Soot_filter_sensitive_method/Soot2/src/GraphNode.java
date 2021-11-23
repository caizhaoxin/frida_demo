import soot.SootMethod;

public class GraphNode {

    GraphNode previous;
    SootMethod current_method;


    public GraphNode(GraphNode previous, SootMethod current_method) {
        this.previous = previous;
        this.current_method = current_method;
    }

    public GraphNode getPrevious() {
        return previous;
    }

    public void setPrevious(GraphNode previous) {
        this.previous = previous;
    }

    public SootMethod getCurrent_method() {
        return current_method;
    }

    public void setCurrent_method(SootMethod current_method) {
        this.current_method = current_method;
    }
}
