import { _uppercaseFirstLetter } from '../utils.js';
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

  let arity = 0;
  let helperName = '';
  // console.log(ast)
  traverse(ast, {
    MemberExpression: function (path) {
      if (path.node.object.name === 'params') {
        arity = path.node.property.value + 1;
      }
    },

    ExportNamedDeclaration: function (path) {
      helperName = path.node.declaration.id.name;
    }
  });

  console.log('Helper: ', helperName);
  console.log('arity: ', arity);

  const [head, ...rest] = name.split('-');

  const tail = rest.map(_uppercaseFirstLetter).join('');

  const capitalizedName = head + tail;

  const str = `import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { ${capitalizedName} } from 'hotline-frontend/helpers/${name}';

module('Unit | Helper | ${name}', function(hooks) {
  setupTest(hooks);

  test('should return correct value', async function(assert) {
    assert.equal(${capitalizedName}(), '');
  });

});
`;
  return str;
}
