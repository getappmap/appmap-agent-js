import unittest
import appmap.unittest
import deep

class TestHello(unittest.TestCase):
  def setUp(self):
    self.deep = deep.Deep()
  def test_deep(self):
    self.assertEqual(self.deep.yo(), "yo")

unittest.main()