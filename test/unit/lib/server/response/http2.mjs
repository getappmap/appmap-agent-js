
import { testHttp } from  "./__fixture__.mjs";
import { makeServer } from '../../../../../lib/server/response/http1.mjs';

testHttp(makeServer);
