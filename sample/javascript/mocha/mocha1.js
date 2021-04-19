console.log("being load fs.readFile");
const fs = require("fs");
describe('timer', function() {

  it('should return its own code', function (done) {
    console.log("setTimeout");
    setTimeout(() => {
      console.log("setTimeout fired");
      done();
    }, 0);
  });

  it('should return its own code', function (done) {
    console.log("setImmediate");
    setImmediate(() => {
      console.log("setImmediate fired");
      done();
    }, 0);
  });

  //   fs.readFile(__filename, "utf8", (error, content) => {
  //     console.log("begin callback fs.readFile");
  //     if (error) {
  //       done(error);
  //     } else {
  //       done();
  //     }
  //     console.log("end callback fs.readFile");
  //   });
  //   console.log("end it fs.readFile");
  // });

  // it('should return its own code', function (done) {
  //   console.log("begin it fs.readFile");
  //   fs.readFile(__filename, "utf8", (error, content) => {
  //     console.log("begin callback fs.readFile");
  //     if (error) {
  //       done(error);
  //     } else {
  //       done();
  //     }
  //     console.log("end callback fs.readFile");
  //   });
  //   console.log("end it fs.readFile");
  // });

  console.log("begin describe fs.readFile");
});
console.log("end load fs.readFile");
