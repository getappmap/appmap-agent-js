
class Session {
  constructor (id, request) {
    this.id = id;
    this.request = this.request;
  }
  perform (action, data, koreys) {
    return this.request.send({action, session: this.id, data}, );
  }
  performAsync: (action, data, ) {
    return this.request.sendAsync({action, session: this.id, data}, );
  }
  terminateAsync: async (data) {
    const request = this.request;
    this.request = null;
    await request.sendAsync({action: "terminate", session:this.id, data});
    return await request.terminateAsync();
  }
}

exports.initializeSession = (request, data) => new Session(request.send({
  action: "initialize",
  session: null,
  data
}));

exports.initializeSessionAsync = async (request, data) => new Session(await request.sendAsync({
  action: "initialize",
  session: null,
  data
}));
