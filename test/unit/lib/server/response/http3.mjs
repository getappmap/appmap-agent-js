
import { strict as Assert } from 'assert';
import { makeServer } from '../../../../../lib/server/response/http3.mjs';

Assert.throws(
  () => makeServer(),
  /^Error: Http3 is not yet supported/);
