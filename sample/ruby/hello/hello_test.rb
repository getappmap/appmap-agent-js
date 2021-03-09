require 'rubygems'
require 'bundler/setup'
require 'appmap/minitest'
require 'minitest/autorun'

require_relative 'hello.rb'

class TestHello < Minitest::Test

  def setup
    @hello = Hello.new
  end

  def test_foo
    assert_equal 'bar', @hello.foo
  end

end