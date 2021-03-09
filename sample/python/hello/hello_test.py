import unittest
import appmap.unittest
import hello

class TestHello(unittest.TestCase):
  def setUp(self):
    self.hello = hello.Hello()
  def test_foo(self):
    self.assertEqual(self.hello.foo(), "bar")

unittest.main()