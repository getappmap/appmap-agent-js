import { testExpression } from './__fixture__.mjs';
import '../../../../lib/instrument/visit-common-class.mjs';

Error.stackTraceLimit = Infinity;

testExpression(`class { m () { } } `);

testExpression(`class f extends null { static get [m] () { } } `);
