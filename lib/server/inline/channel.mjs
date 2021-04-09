import { getDefaultConfig } from '../config.mjs';
import Dispatcher from '../dispatcher.mjs';
import { makeChannel } from './response.mjs';

export default () => makeChannel(new Dispatcher(getDefaultConfig()));
