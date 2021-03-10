package hello;

public class Hello {
  public String foo () {
    System.out.println("foo");
    return this.bar();
  }
  public String bar () {
    return "bar";
  }
}