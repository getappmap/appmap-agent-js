
require 'uri'
require 'net/http'

class Hello
  def bar
    return 'bar'
  end
  def foo
    puts 'foo'
    return self.bar
  end
  def req
    uri = URI('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY')
    res = Net::HTTP.get_response(uri)
    puts res.body if res.is_a?(Net::HTTPSuccess)
    return 'req'
  end
end
