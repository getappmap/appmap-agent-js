
export class Track {
  constructor (session, id, options) {
    this.session = session;
    this.id = id;
    this.session.controlTrack(this.id, "initialize", options);
  }
  play () {
    this.session.controlTrack(this.id, "play", null);
  }
  pause () {
    this.session.controlTrack(this.id, "pause", null);
  }
  stop () {
    this.session.controlTrack(this.id, "stop", null);
    this.session = null;
  }
}
