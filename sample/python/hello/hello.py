
class Hello:
  def bar (self):
    return "bar"
  def foo (self):
    def qux ():
      return "qux"
    print("foo")
    print(self.bar())
    print(qux())
    return "buz"
