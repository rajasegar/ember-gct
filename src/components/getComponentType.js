import { existsSync, readFileSync } from 'fs';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

export function getComponentType(filepath) {
  let ctype = 'glimmer';
  if (existsSync(filepath)) {
    const component = readFileSync(filepath, 'utf-8');
    const ast = parse(component, {
      sourceType: 'module',
      plugins: ['decorators']
    });
    // console.log(ast)
    traverse(ast, {
      ExportDefaultDeclaration: function (path) {
        console.log(path.node.declaration.type);
        if (path.node.declaration.type === 'CallExpression') {
          ctype = 'classic';
        }
      }
    });
  }
  return ctype;
}
