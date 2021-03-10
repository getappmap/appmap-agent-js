package hello;

import org.junit.Test;
import static org.junit.Assert.assertEquals;

public class HelloTest {
  Hello hello = new Hello();
  @Test
  public void testFoo () {
    assertEquals(hello.foo(), "bar");
  }
}