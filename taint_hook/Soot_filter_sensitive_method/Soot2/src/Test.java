import java.lang.reflect.Constructor;
import java.lang.reflect.Method;

public class Test {

    public static void main(String[] args) {
        Test1 test1 = new Test1() {
            @Override
            public void test() {
                System.out.println("test1");
            }
        };

        test1.test();
        try {
            Class<?> test$1 = Class.forName("Test$1");
            Constructor<?> constructor = test$1.getDeclaredConstructor();
            constructor.setAccessible(true);
            Object instance = constructor.newInstance();
            Method test = test$1.getDeclaredMethod("test");
            test.setAccessible(true);
            test.invoke(instance);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
