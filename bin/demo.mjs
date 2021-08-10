#!/usr/bin/env node

import Violation from "../lib/violation/alert";
import Assert from "../lib/assert/default";
import Util from "../lib/util/default";
import Log from "../lib/log/warning";
import Specifier from "../lib/specific/default";
import Repository from "../lib/repository/dead";
import Configuration from "../lib/configuration/default";
import Storage from "../lib/storage/demo";
import Trace from "../lib/trace/default";
import Backend from "../lib/backend/default";
import Naming from "../lib/naming/default";
import Instrumentation from "../lib/instrumentation/default";
import Interpretation from "../lib/interpretation/browser";
import Serialization from "../lib/serialization/default";
import Frontend from "../lib/frontend/default";
import HookApply from "../lib/hook-apply/default";
import HookModule from "../lib/hook-apply/dead";
import HookGroup from "../lib/hook-apply/dead";
import HookQuery from "../lib/hook-apply/dead";
import Client from "../lib/client/inline";
import Agent from "../lib/agent/default";
import Main from "../lib/main/demo";

const ordering = [
  ["violation", Violation],
  ["assert", Assert],
  ["util", Util],
  ["log", Log],
  ["specifier", Specifier],
  ["repository", Repository],
  ["configuration", Configuration],
  ["storage", Storage],
  ["trace", Trace],
  ["backend", Backend],
  ["naming", Naming],
  ["instrumentation", Instrumentation],
  ["interpretation", Interpretation],
  ["serialization", Serialization],
  ["frontend", Frontend],
  ["hook-apply", HookApply],
  ["hook-module", HookModule],
  ["hook-group", HookGroup],
  ["hook-query", HookQuery],
  ["hook-client", Client],
  ["agent", Agent],
  ["main", Main],
];

const dependencies = {__proto__:null};

for (let [name, build] of ordering) {
  dependencies[name] = build(dependencies);
}

const {main} = dependencies;
main();
