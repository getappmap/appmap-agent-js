import { getDefaultConfig } from './config.mjs';
import { makeDispatch } from './dispatch.mjs';
import { makeChannel } from './response/inline.mjs';

export default () => makeChannel(makeDispatch(getDefaultConfig()));
