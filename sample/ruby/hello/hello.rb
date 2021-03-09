
class Hello
  def bar
    return 'bar'
  end
  def foo
    puts 'foo'
    return self.bar
  end
end
