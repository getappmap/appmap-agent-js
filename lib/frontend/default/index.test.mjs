
  {
    const track = createTrack(state, "options");
    assertDeepEqual(track, {
      index: 1,
      state: { value: 0 },
      options: "options",
    });
    assertDeepEqual(controlTrack(state, track, "start"), {
      type: "send",
      session: "uuid",
      data: {
        type: "track",
        data: { type: "start", track: 1, options: "options" },
      },
    });
  }
  assertDeepEqual(declareGroup(state, "group"), {
    type: "send",
    session: "uuid",
    data: { type: "group", data: "group" },
  });
  assertEqual(typeof getInstrumentationIdentifier(state), "string");
  assertDeepEqual(instrument(state, "kind", "path", "code"), {
    message: {
      type: "send",
      session: "uuid",
      data: {
        type: "module",
        data: { kind: "kind", path: "path", code: "code", children: [] },
      },
    },
    code: "code",
  });
  assertDeepEqual(terminateState(state, "reason"), {
    type: "terminate",
    session: "uuid",
    reason: "reason",
  });
};

testAsync();
