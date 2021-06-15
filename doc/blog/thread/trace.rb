# trace.rb
$ctr = 0
def trace (obj, key, *args)
  $ctr += 1
  idx = $ctr
  puts("#{Thread.current.object_id} call   \##{idx} #{key} #{args}")
  res = obj.send(key, *args)
  puts("#{Thread.current.object_id} return \##{idx} #{key} #{res}")
  return res
end