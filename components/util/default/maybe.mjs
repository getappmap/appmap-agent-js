export const fromMaybe = (maybe, recovery, transform) =>
  maybe === null ? recovery : transform(maybe);

export const mapMaybe = (maybe, transform) =>
  maybe === null ? null : transform(maybe);

export const recoverMaybe = (maybe, recovery) =>
  maybe === null ? recovery : maybe;
