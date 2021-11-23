public class IdNode {
    private String id_name;
    private String id_value;

    @Override
    public String toString() {
        return "IdNode{" +
                "id_name='" + id_name + '\'' +
                ", id_value='" + id_value + '\'' +
                '}';
    }

    public IdNode(String id_name, String id_value) {
        this.id_name = id_name;
        this.id_value = id_value;
    }

    public String getId_name() {
        return id_name;
    }

    public String getId_value() {
        return id_value;
    }
}
