package hello;

import org.junit.Test;
import static org.junit.Assert.assertEquals;

public class HelloTest {
  @Test
  public void testYolo () {
    assertEquals(Hello.yolo(), "Yolo");
  }
  @Test
  public void testSwag () {
    assertEquals(Hello.swag(), "Swag");
  }
}