const global_Promise = Promise;
const global_undefined = undefined;
const global_Reflect_apply = Reflect.apply;
const global_Promise_resolve = Promise.resolve;

class Track {
  constructor (session, id) {
    this.id = id;
    this.session = session;
    this.state = PLAY_STATE;
  }
  play () {
    return this.session.perform(this.id, "play");
  }
  playAsync () {
    return this.session.performAsync(this.id, "play");
  }
  pause () {
    return this.session.perform(this.id, "pause");
  }
  pauseAsync () {
    this.session.performAsync(this.id, "pause");
  }
  stop () {
    this.session.perform(this.id, "stop");
  }
  stopAsync () {
    this.session.performAsync(this.id, "stop");
  }
}

exports.makeTrack = (session, options) => new Track(session, session.perform("start", options));

exports.makeTrackAsync = async (session, option) => new Track(session, await session.performAsync("start", options));
