import os
import sys
import requests
import appmap


r = appmap.Recording()

with r:
  # r = requests.get('https://xkcd.com/1906/')
  # print(r.status_code)
  import hello
  h = hello.Hello()
  h.foo()

print(appmap.generation.dump(r))

# with os.fdopen(sys.stdout.fileno(), "wb", closefd=False) as stdout:
#   stdout.write(appmap.generation.dump(r))
#   stdout.flush()
