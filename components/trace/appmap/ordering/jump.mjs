const {
  URL,
  Array: { from: toArray },
  Error,
  Map,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

// Resolve jumps.
// Insert trees starting by an after event next to their corresponding before event.
// Event manufacturing is performed to complete sequences of events.
// After this pass, each begin event will be matched to their end event.
// Also, begin/end event pair can have children but not before/after event pair.

const { assert } = await import(`../../../util/index.mjs${__search}`);
const { manufactureMatchingEvent, isMatchingEvent } = await import(
  `./matching.mjs${__search}`
);

const manufactureBundleEvent = (site, tab) => ({
  type: "event",
  site,
  tab,
  group: 0,
  time: 0,
  payload: {
    type: "bundle",
  },
});

const makeBundleNode = (begin, children, end) => {
  assert(isMatchingEvent(begin, end), "begin/end event mismatch");
  return {
    type: "bundle",
    begin,
    children,
    end,
  };
};

const makeJumpNode = (before, after) => {
  assert(isMatchingEvent(before, after), "before/after event mismatch");
  return {
    type: "jump",
    before,
    after,
  };
};

const makeFrame = (enter, children, leave) => ({ enter, children, leave });

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
      manufactureBundleEvent("begin", 0),
      [
        makeJumpNode(manufactureMatchingEvent(orphan.open), orphan.open),
        ...orphan.children,
        makeJumpNode(orphan.close, manufactureMatchingEvent(orphan.close)),
      ],
      manufactureBundleEvent("end", 0),
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
    throw new Error("invalid enter/leave event site");
  } /* c8 ignore stop */
};

const splitJump = (frames, jumps) => {
  const filtering = (frame) => {
    if (frame.enter.site === "after") {
      assert(!jumps.has(frame.enter.tab), "duplicate jump");
      jumps.set(frame.enter.tab, frame);
      return false;
    } else {
      return true;
    }
  };
  const mapping = (frame) =>
    makeFrame(
      frame.enter,
      frame.children.map(mapping).filter(filtering),
      frame.leave,
    );
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
      if (jumps.has(close.tab)) {
        const frame = jumps.get(close.tab);
        jumps.delete(close.tab);
        nodes.push(makeJumpNode(close, frame.enter));
        nodes.push(...frame.children.map(mapBeginFrame));
        close = frame.leave;
      } else if (orphans.has(close.tab)) {
        const orphan = orphans.get(close.tab);
        orphans.delete(close.tab);
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
  for (const tab of jumps.keys()) {
    const frame = jumps.get(tab);
    jumps.delete(tab);
    orphans.set(tab, mapFrame(frame));
  }
  return [].concat(toArray(orphans.values()).map(manufactureBundleNode), nodes);
};

export const jumpify = (root) => {
  const jumps = new Map();
  return joinJump(splitJump(root, jumps), jumps);
};
