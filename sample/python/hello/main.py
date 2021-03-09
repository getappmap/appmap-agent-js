import os
import sys

import appmap

r = appmap.Recording()

with r:
  import hello
  h = hello.Hello()
  h.foo()

print(appmap.generation.dump(r))

# with os.fdopen(sys.stdout.fileno(), "wb", closefd=False) as stdout:
#   stdout.write(appmap.generation.dump(r))
#   stdout.flush()
