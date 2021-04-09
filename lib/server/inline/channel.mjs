import { getDefaultConfig } from '../config.mjs';
import { makeDispatch } from '../dispatch.mjs';
import { makeChannel } from './response.mjs';

export default () => makeChannel(makeDispatch(getDefaultConfig()));
