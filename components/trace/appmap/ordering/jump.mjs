// Resolve jumps.
// Insert trees starting by an after event next to their corresponding before event.
// Event manufacturing is performed to complete sequences of events.
// After this pass, each begin event will be matched to their end event.
// Also, begin/end event pair can have children but not before/after event pair.

import { InternalAppmapError } from "../../../error/index.mjs";
import { assert } from "../../../util/index.mjs";
import { manufactureMatchingEvent, isMatchingEvent } from "./matching.mjs";

const {
  Array: { from: toArray },
  Map,
  String,
} = globalThis;

const makeJumpKey = ({ session, tab }) => `${session}/${String(tab)}`;

const manufactureBundleEvent = (session, site, tab) => ({
  type: "event",
  session,
  site,
  tab,
  group: 0,
  time: 0,
  payload: {
    type: "bundle",
  },
});

const makeBundleNode = (begin, children, end) => {
  assert(
    isMatchingEvent(begin, end),
    "begin/end event mismatch",
    InternalAppmapError,
  );
  return {
    type: "bundle",
    begin,
    children,
    end,
  };
};

const makeJumpNode = (before, after) => {
  assert(
    isMatchingEvent(before, after),
    "before/after event mismatch",
    InternalAppmapError,
  );
  return {
    type: "jump",
    before,
    after,
  };
};

const makeOrphan = (open, children, close) => ({
  open,
  children,
  close,
});

const manufactureBundleNode = (orphan) => {
  if (orphan.open.site === "begin" && orphan.close.site === "end") {
    return makeBundleNode(orphan.open, orphan.children, orphan.close);
  } else if (orphan.open.site === "after" && orphan.close.site === "before") {
    return makeBundleNode(
      manufactureBundleEvent(orphan.open.session, "begin", 0),
      [
        makeJumpNode(manufactureMatchingEvent(orphan.open), orphan.open),
        ...orphan.children,
        makeJumpNode(orphan.close, manufactureMatchingEvent(orphan.close)),
      ],
      manufactureBundleEvent(orphan.close.session, "end", 0),
    );
  } else if (orphan.open.site === "after" && orphan.close.site === "end") {
    return makeBundleNode(
      manufactureMatchingEvent(orphan.close),
      [
        makeJumpNode(manufactureMatchingEvent(orphan.open), orphan.open),
        ...orphan.children,
      ],
      orphan.close,
    );
  } else if (orphan.open.site === "begin" && orphan.close.site === "before") {
    return makeBundleNode(
      orphan.open,
      [
        ...orphan.children,
        makeJumpNode(orphan.close, manufactureMatchingEvent(orphan.close)),
      ],
      manufactureMatchingEvent(orphan.open),
    );
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid enter/leave event site");
  } /* c8 ignore stop */
};

const splitJump = (frames, jumps) => {
  const filtering = (frame) => {
    if (frame.enter.site === "after") {
      const key = makeJumpKey(frame.enter);
      assert(!jumps.has(key), "duplicate jump", InternalAppmapError);
      jumps.set(key, frame);
      return false;
    } else {
      return true;
    }
  };
  const mapping = ({ enter, children, leave }) => ({
    enter,
    children: children.map(mapping).filter(filtering),
    leave,
  });
  return frames.map(mapping).filter(filtering);
};

const joinJump = (frames, jumps) => {
  /* eslint-disable no-use-before-define */
  const mapBeginFrame = (frame) => manufactureBundleNode(mapFrame(frame));
  /* eslint-enable no-use-before-define */
  const orphans = new Map();
  const mapFrame = (frame) => {
    const open = frame.enter;
    const nodes = frame.children.map(mapBeginFrame);
    let close = frame.leave;
    while (close.site === "before") {
      const key = makeJumpKey(close);
      if (jumps.has(key)) {
        const frame = jumps.get(key);
        jumps.delete(key);
        nodes.push(makeJumpNode(close, frame.enter));
        nodes.push(...frame.children.map(mapBeginFrame));
        close = frame.leave;
      } else if (orphans.has(key)) {
        const orphan = orphans.get(key);
        orphans.delete(key);
        nodes.push(makeJumpNode(close, orphan.open));
        nodes.push(...orphan.children);
        close = orphan.close;
      } else {
        return makeOrphan(open, nodes, close);
      }
    }
    return makeOrphan(open, nodes, close);
  };
  const nodes = frames.map(mapBeginFrame);
  for (const key of jumps.keys()) {
    const frame = jumps.get(key);
    jumps.delete(key);
    orphans.set(key, mapFrame(frame));
  }
  return [].concat(toArray(orphans.values()).map(manufactureBundleNode), nodes);
};

export const jumpify = (root) => {
  const jumps = new Map();
  return joinJump(splitJump(root, jumps), jumps);
};
