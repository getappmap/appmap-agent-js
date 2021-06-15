
# Using the Appmap Framework to Represent Event-driven Programs

## Problem Statement

The appmap framework was developed for languages that implement concurrency via threading.
Adapting this model for event-driven programs is challenging.
Next we demonstrate this issue through an example program that perform two sql queries concurrently.

### Ruby Implementation

The ruby program below performs two sql queries concurrently:

```rb
# sql.rb
require 'sqlite3'
class Main
  def main ()
    db = SQLite3::Database.new(':memory:');
    thread = Thread.new {
      x = db.execute('SELECT 2 * 3')[0][0]
      puts(x)
    }
    x = db.execute('SELECT 4 * 5')[0][0];
    puts(x)
    thread.join
    return 0
  end
end
Main.new.main()
```

This program will output `6` and `20` in an non-deterministic order based on thread interleaving.
If we want trace the call stack of this program, we could develop the simplistic library below:

```rb
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
```

All that is needed now is to pass method invocation of interest to the trace function:

```rb
# sql-trace.rb
require 'sqlite3'
require './trace.rb'
class Main
  def main
    db = SQLite3::Database.new(':memory:');
    thread = Thread.new {
      x = trace(db, :execute, 'SELECT 2 * 3')
      trace(self, :puts, x)
    }
    x = trace(db, :execute, 'SELECT 4 * 5')
    trace(self, :puts, x)
    thread.join()
    return 0
  end
end
trace(Main.new, :main)
```

One possible thread interleaving would lead to the following trace:

```
60 call   #1 main []
60 call   #2 execute ["SELECT 4 * 5"]
60 return #2 execute [[20]]
60 call   #4 puts [[[20]]]
60 return #4 puts 
80 call   #3 execute ["SELECT 2 * 3"]
80 return #3 execute [[6]]
80 call   #5 puts [[[6]]]
80 return #5 puts 
60 return #1 main 0
```

To interpret this file, the Appmap framework will separate the call stack trace based on thread ids.

The main thread would contain the `main` function, the second sql query, and the second `puts` function call:

```
60 call   #1 main []
60 call   #2 execute ["SELECT 4 * 5"]
60 return #2 execute [[20]]
60 call   #4 puts [[[20]]]
60 return #4 puts 
60 return #1 main 0
```

The child thread would contain the first sql query the first `puts` function call:

```
80 call   #3 execute ["SELECT 2 * 3"]
80 return #3 execute [[6]]
80 call   #5 puts [[[6]]]
80 return #5 puts
```

We can see that each thread-specific trace is ordered as a fifo which expected as it represents the call stack of its thread.
This fifo ordering is very important for the framework to properly display appmaps.

TLDR: the appmap framework relies on each thread-specific trace to exhibit a fifo ordering.

### JavaScript Implementation

In JavaScript the same requirements could have been implemented as a such:

```js
// db.mjs
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database(':memory:');
export const execute = (sql) => new Promise((resolve, reject) => {
  db.all(sql, (error, result) => {
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  });
});
```

```js
// sql.mjs
import {execute} from './db.mjs';
const main = () => {
  execute('SELECT 2 * 3 as x').then(([{x}]) => {
    console.log(x);
  });
  execute('SELECT 4 * 5 as x').then(([{x}]) => {
    console.log(x);
  });
  return 0;
}
main();
```

Again, this program will output `6` and `20` in an non-deterministic order.
But the order is based on event interleaving rather than thread interleaving.
If we want to trace this program, our simplistic library will have to support two kinds of function: synchronous functions and asynchronous functions.

```js
// trace.mjs
let ctr = 0;
export const trace = (fct, ...args) => {
  ctr += 1;
  const idx = ctr;
  console.log(`${process.pid} call   #${idx} ${fct.name} ${JSON.stringify(args)}`);
  const res = fct(...args);
  console.log(`${process.pid} return #${idx} ${fct.name} ${JSON.stringify(res)}`);
  return res;
};
export const traceAsync = async (fct, ...args) => {
  ctr += 1;
  const idx = ctr;
  console.log(`${process.pid} call   #${idx} ${fct.name} ${JSON.stringify(args)}`);
  const res = await fct(...args);
  console.log(`${process.pid} return #${idx} ${fct.name} ${JSON.stringify(res)}`);
  return res;
};
```

We can now instrument the original program to trace it:

```js
// sql-trace.mjs
import {execute} from './db.mjs'
import {trace, traceAsync} from './trace.mjs'
const logTrace = (x) => trace(log, x);
const main = () => {
  traceAsync(execute, 'SELECT 2 * 3 as x').then(([{x}]) => {
    trace(console.log, x);
  });
  traceAsync(execute, 'SELECT 4 * 5 as x').then(([{x}]) => {
    trace(console.log, x);
  });
  return 0;
}
trace(main);
```

One possible event interleaving would lead to the following trace:

```
93124 call   #1 main []
93124 call   #2 execute ["SELECT 2 * 3 as x"]
93124 call   #3 execute ["SELECT 4 * 5 as x"]
93124 return #1 main 0
93124 return #3 execute [{"x":6}]
93124 call   #4 log [[{"x":6}]]
93124 return #4 log undefined
93124 return #4 execute [{"x":20}]
93124 call   #5 log [[{"x":20}]]
93124 return #5 log undefined
```

We can observe two problems.
* JavaScript being single-threaded we are missing an out-of-the-box data to de-interleave this call stack.
* There exists no partitioning of this call stack trace whose lines are fifos.
  Indeed, the main function will always return before the second sql query.

## Desiderata

What do we even want?
Let's set aside the "how" for the moment and focus on the "what".

### First Option: Cheating

The first option consists in replicating what was observed in ruby by "cheating".

The first fifo should contain the first sql query and the first `console.log` function call:

```
93232 call   #2 execute ["SELECT 2 * 3 as x"]
93232 return #2 execute [{"x":6}]
93232 call   #4 log [6]
93232 return #4 log undefined
```

The second fifo should contain the `main` function call, the second sql query, and the second `console.log` function call:

```
93232 call   #1 main []
93232 call   #3 execute ["SELECT 4 * 5 as x"]
93232 return #3 execute [{"x":20}]
93232 call   #5 log [20]
93232 return #5 log undefined
93232 return #1 main 0
```

Note that to obtain a fifo we had to "cheat" and move the return of the `main` function call to the last position.
Rearranging call stack lines is dangerous and can lead to logical inconsistencies.
For instance we could end up displaying `DROP TABLE user` before `SELECT * from user`.
Even if it resembles the closest the ruby trace, I really don't like this option.

### Second Option: One Fifo per Event 

The second option consists in embracing the event-based nature of JavaScript and creating one fifo for every event processing.

The first fifo represents the initial phase:

```
call   #1 main []
call   #2 execute ["SELECT 2 * 3 as x"]
return #2 execute Promise#1
call   #3 execute ["SELECT 4 * 5 as x"]
return #3 execute Promise#2
return #1 main 0
```

The second fifo represents the handling attached to the first sql query:

```
call   #4 resolve Promise#1 [{"x":6}]
call   #5 log [6]
return #5 log undefined
return #4 resolve
```

The third fifo represents the handling attached to the second sql query:

```
return #3 resolve Promise#2 [{"x":20}]
call   #5 log [20]
return #5 log undefined
return #3 resolve
```

This option reflects best the reality of the execution of the program.
And more importantly we do not have to cheat.
The drawback of this option is that the causality link between the first fifo and two others is lost.
Indeed, the appmap framework being language-agnostic it cannot use promise ids to recover that causality link.

### Third Options: Linear Model

We can attempt to step closer to the ruby trace and bundle the first two fifos together and that would still make a fifo.
Technically this might be achievable by using (asynchronous hooks)[https://nodejs.org/api/async_hooks.html] and register the first promise made during each event handling.

### Fourth Options: Tree Model

Similarly to the third option, we could bundle the three fifos togethers.
Again, we would have to use (asynchronous hooks)[https://nodejs.org/api/async_hooks.html] but we would register every promises made during each event handling.
This solution would have to additional difficulty of deciding when to cut off a fifo.
Indeed if we leave this unchecked, we might end up with a single fifo for the entire run of a server.

The criteria could be based on the nature of the event being handled.
For instance, handling an http server request should definitely be represented by a dedicated fifo.
And handling the result of reading from a file should be bundled with the fifo of the parent event.

I think this fourth option is the best.
