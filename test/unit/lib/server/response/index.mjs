import { getInitialConfiguration } from '../../../../../lib/server/configuration/index.mjs';
import { makeDispatching } from '../../../../../lib/server/dispatching.mjs';
import { makeServer } from '../../../../../lib/server/response/index.mjs';

makeServer('messaging', makeDispatching(getInitialConfiguration()), {});
