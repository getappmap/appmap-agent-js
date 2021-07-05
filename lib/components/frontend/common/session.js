
const global_Date_now = Date.now;

class Session {
  constructor (getCurrentGroupID, client, options) {
    client.send({
      action: "initialize",
      data: options
    });
    this.getCurrentGroupID = getCurrentGroupID;
    this.client = client;
    this.id = id;
    this.event_counter = 0;
  }
  terminate (data) {
    this.client.send({
      action: "terminate",
      data,
    });
    this.client.close();
    this.client = null;
  }
  registerEntity (path, entity) {
    this.client.send({
      action: "register",
      data: {
        path,
        entity
      }
    });
  }
  controlTrack (track, type, data) {
    this.client.send({
      action: "control",
      data: {
        track,
        type,
        data
      }
    });
  }
  linkGroup (parent, child) => {
    this.client.send({
      action: "link",
      data: {
        parent,
        child
      }
    });
  }
  recordBefore (type, data) {
    const id = this.event_counter += 2;
    this.client.send({
      action: "record",
      data: {
        group: this.getCurrentGroupID(),
        type,
        id,
        data,
        time: global_Date_now(),
      }
    });
    return id + 1;
  }
  recordAfter (id, data) {
    this.client.send({
      action: "record",
      data: {
        group: this.platform.getCurrentGroupID(),
        type: null,
        id,
        data,
        time: global_Date_now(),
      }
    });
  }
}
