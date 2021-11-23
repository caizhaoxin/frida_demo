import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;

public class readFile {
    public static void main(String[] args) {
        try {
            BufferedReader in = new BufferedReader(new FileReader("D:\\shareActionProject\\爱奇艺体育\\aiqiyi.txt"));
            String str;
            boolean start =false;
            while ((str = in.readLine()) != null){

                if (str.startsWith("com.tencent") || str.startsWith("com.android"))
                    continue;

                if (str.contains("---") && str.contains("main")){
                    System.out.println("111111111111111");
                    start = true;
                }

                if (start)
                    System.out.println(str);

            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
