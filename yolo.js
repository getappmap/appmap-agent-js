var express = require('express')
var app = express()

const log = (req) => {
  console.log(`${req.baseUrl}${req.route.path}`, req.params);
}

// const save = express.Route.prototype.dispatch;
// express.Route.prototype.dispatch = function dispatch (req, res, next) {
//   console.log('oy');
//   debugger;
//   return Reflect.apply(save, this, [req, res, next]);
// };

// app.use('/', function (req, res, next) {
//   res.on('finish', () => {
//     log(req);
//   });
//   next();
// });
//
// app.get('/:foo', function (req, res) {
//   res.send('foo');
// });

// app.get('/foo/bar', function (req, res, next) {
//   debugger;
//   log(req);
//   next();
// });
//
// app.get('/foo/:bar', function (req, res) {
//   debugger;
//   log(req);
//   res.send('foo2');
// });
//
app.listen(8080)
