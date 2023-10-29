import { capitalizedName } from './utils.js';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import { readFileSync } from 'node:fs';

export default function generateUtilTests(root, utilName) {
  const traverse = _traverse.default;
  const capName = capitalizedName(utilName);

  const filePath = `${root}/app/utils/${utilName}.js`;

  const utilFunctions = [];

  const util = readFileSync(filePath, 'utf-8');
  const ast = parse(util, {
    sourceType: 'module',
    plugins: ['decorators']
  });
  traverse(ast, {
    ExportNamedDeclaration: function (path) {
      if (path.node.declaration.id) {
        const name = path.node.declaration.id.name;
        utilFunctions.push(name);
        console.log('util function: ', name);
      }

      if (path.node.declaration.declarations) {
        const declarations = path.node.declaration.declarations;
        declarations.forEach((decl) => {
          utilFunctions.push(decl.id.name);
          console.log('util function: ', decl.id.name);
        });
      }
    },

    ExportDefaultDeclaration: function (path) {
      if (path.node.declaration.properties) {
        const properties = path.node.declaration.properties;
        properties.forEach((prop) => {
          utilFunctions.push(prop.key.name);
          console.log('util function: ', prop.key.name);
        });
      }
    }
  });

  return `import { module, test } from 'qunit';
import ${capName} from 'hotline-frontend/utils/${utilName}';

module('Unit | Utility | ${utilName}', function() {

${utilFunctions.forEach((util) => {
  return `test('test ${util}()', function(assert) {})`;
})}

})
 `;
}
