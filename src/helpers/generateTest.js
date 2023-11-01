import { _uppercaseFirstLetter, capitalizedName } from '../utils.js';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import { readFileSync } from 'node:fs';

export function generateHelperTests(root, name) {
  const traverse = _traverse.default;
  const filePath = `${root}/app/helpers/${name}.js`;

  const helper = readFileSync(filePath, 'utf-8');
  const ast = parse(helper, {
    sourceType: 'module',
    plugins: ['decorators']
  });

  let arity = 0; // starts with zeroth index
  let helperName = '';
  const returnNodes = [];
  // console.log(ast)
  traverse(ast, {
    MemberExpression: function (path) {
      if (path.node.object.name === 'params') {
        if (path.node.property.value > arity) {
          arity = path.node.property.value;
        }
      }
    },

    ExportNamedDeclaration: function (path) {
      helperName = path.node.declaration.id.name;
    },

    ReturnStatement: function (path) {
      returnNodes.push(path.node);
    }
  });

  returnNodes.forEach((node) => {
    switch (node.argument.type) {
      case 'BinaryExpression':
        break;
      case 'Identifier':
        break;
      default:
        console.error('Unknown argument type in return statement');
    }
  });

  console.log('Helper: ', helperName);
  console.log('arity: ', arity + 1);

  const str = `import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { ${capitalizedName(name)} } from 'hotline-frontend/helpers/${name}';

module('Unit | Helper | ${name}', function(hooks) {
  setupTest(hooks);

  test('should return correct value', async function(assert) {
    assert.equal(${capitalizedName(name)}(), '');
  });

});
`;
  return str;
}
