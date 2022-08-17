export const fromMaybe = (maybe, recovery, transform) =>
  maybe === null ? recovery : transform(maybe);

export const mapMaybe = (maybe, transform) =>
  maybe === null ? null : transform(maybe);

export const mapMaybeAsync = async (maybe, transformAsync) =>
  maybe === null ? null : await transformAsync(maybe);

export const recoverMaybe = (maybe, recovery) =>
  maybe === null ? recovery : maybe;
