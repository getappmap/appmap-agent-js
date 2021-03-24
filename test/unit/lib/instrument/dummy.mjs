import { strict as Assert } from 'assert';
import * as Dummy from '../../../../lib/instrumenter/dummy.mjs';

Assert.equal(Dummy.getClassEntity().type, 'class');
Assert.equal(Dummy.getIdentifierNode().type, 'Identifier');
Assert.equal(Dummy.getPropertyNode().type, 'Property');
Assert.equal(Dummy.getObjectExpressionNode().type, 'ObjectExpression');
Assert.equal(Dummy.getMethodDefinitionNode().type, 'MethodDefinition');
