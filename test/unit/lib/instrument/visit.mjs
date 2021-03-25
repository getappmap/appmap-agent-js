import { strict as Assert } from 'assert';
import {
  getResultNode,
  getResultEntities,
  combineResult,
} from '../../../../lib/instrument/result.mjs';
import {
  visit,
  assignVisitorObject,
} from '../../../../lib/instrument/visit.mjs';

/////////////
// Dummies //
/////////////

{
  const node = { type: 'InvalidNodeType' };
  const location2 = { __proto__: null };
  [
    ['MethodDefinition', 'MethodDefinition'],
    ['ClassBody', 'ClassBody'],
    ['Method', 'FunctionExpression'],
    ['Expression', 'Identifier'],
    ['SpreadableExpression', 'Identifier'],
    ['TemplateElement', 'TemplateElement'],
    ['TemplateLiteral', 'TemplateLiteral'],
    ['NonComputedMemberProperty', 'Identifier'],
    ['NonComputedKey', 'Identifier'],
    ['Property', 'Property'],
    ['PropertyPattern', 'Property'],
    ['RestablePropertyPattern', 'Identifier'],
    ['Pattern', 'Identifier'],
    ['RestablePattern', 'Identifier'],
    ['Program', 'Program'],
    ['SwitchCase', 'SwitchCase'],
    ['BlockStatement', 'BlockStatement'],
    ['CatchClause', 'CatchClause'],
    ['VariableDeclarator', 'VariableDeclarator'],
    ['VariableDeclaration', 'VariableDeclaration'],
    ['ScopingIdentifier', 'Identifier'],
    ['NonScopingIdentifier', 'Identifier'],
    ['ImportSpecifier', 'NamedImportSpecifier'],
    ['ExportSpecifier', 'ExportSpecifier'],
    ['Literal', 'Literal'],
    ['Statement', 'ExpressionStatement'],
  ].forEach(([kind, type]) => {
    const location1 = {
      __proto__: null,
      extend: (...args) => {
        Assert.deepEqual(args, [kind, node]);
        return location2;
      },
    };
    const result = visit(kind, node, location1);
    Assert.equal(getResultNode(result).type, type, kind);
    Assert.deepEqual(getResultEntities(result), [], kind);
  });
}

////////////////////////////////
// shouldBeInstrumented: true //
////////////////////////////////

{
  const node1 = {
    type: 'Program',
    body: [],
    sourceType: 'script',
  };
  const node2 = {
    type: 'Program',
    body: [],
    sourceType: 'script',
  };
  const location2 = {
    __proto__: null,
    shouldBeInstrumented(...args) {
      Assert.equal(this, location2);
      Assert.deepEqual(args, []);
      return true;
    },
  };
  const location1 = {
    __proto__: null,
    extend(...args) {
      Assert.equal(this, location1);
      Assert.deepEqual(args, ['Program', node1]);
      return location2;
    },
  };
  assignVisitorObject('Program', {
    Program: (...args) => {
      Assert.deepEqual(args, [node1, location2]);
      return combineResult((node, location) => node2, args[0], args[1]);
    },
  });
  const result = visit('Program', node1, location1);
  Assert.equal(getResultNode(result), node2);
  Assert.deepEqual(getResultEntities(result), []);
}

/////////////////////////////////
// shouldBeInstrumented: false //
/////////////////////////////////

{
  const node1 = {
    type: 'Program',
    body: [],
    sourceType: 'script',
  };
  const location2 = {
    __proto__: null,
    shouldBeInstrumented(...args) {
      Assert.equal(this, location2);
      Assert.deepEqual(args, []);
      return false;
    },
  };
  const location1 = {
    __proto__: null,
    extend(...args) {
      Assert.equal(this, location1);
      Assert.deepEqual(args, ['Program', node1]);
      return location2;
    },
  };
  assignVisitorObject('Program', {
    Program: () => Assert.fail(),
  });
  const result = visit('Program', node1, location1);
  Assert.equal(getResultNode(result), node1);
  Assert.deepEqual(getResultEntities(result), []);
}
