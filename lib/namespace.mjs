
export class Namespace {
  constructor (prefix) {
    this.prefix = prefix;
  }
  checkIdentifierCollision (name) {
    if (name.startsWith(this.prefix)) {
      logger.error(`Base-level identifier should never start with ${this.prefix}, got: ${name}`);
    }
  }
  // Id //
  getGlobalCounter () {
    return `${this.prefix}_global_counter`;
  }
  getLocalId () {
    return `${this.prefix}_local_id`;
  }
  // Input //
  getLocalError () {
    return `${this.prefix}_local_error`;
  }
  getLocalArguments () {
    return `${this.prefix}_local_arguments`;
  }
  getLocalSerializedArguments () {
    return `${this.prefix}_local_serialized_arguments`;
  }
  // Output //
  getLocalSuccess () {
    return `${this.prefix}_local_success`;
  }
  getLocalFailure () {
    return `${this.prefix}_local_failure`
  }
  getGlobalMarker () {
    return `${this.prefix}_global_marker`;
  }
  // Timing //
  getLocalTimer () {
    return `${this.prefix}_local_timer`;
  }
  getGlobalNow () {
    return `${this.prefix}_global_now`;
  }
}