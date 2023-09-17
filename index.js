import { readdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs'
import templateFunc from './template.js';
import { parse } from '@babel/parser'
import _traverse from "@babel/traverse";
const traverse = _traverse.default;
import { ExportDefaultDeclaration } from '@babel/types'
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
import { componentLookupInHbs, _convertToAngleBracketsName } from './src/utils.js'
import { preprocess, Walker, print } from '@glimmer/syntax';
import Chance from 'chance';

const chance = new Chance();
const root = '/Users/rajasegarchandran/Code/unity_frontend';
const components = `${root}/app/components`;
const integrationTests = `${root}/tests/integration/components`;
const ignoreFiles = [
  '.DS_Store',
  '.gitkeep'
]

const withoutTests = [];

function getComponentType(filepath) {
  let ctype = 'glimmer'
  if (existsSync(filepath)) {

    const component = readFileSync(filepath, 'utf-8')
    const ast = parse(component, {
      sourceType: 'module',
      plugins: ['decorators']
    })
    // console.log(ast)
    traverse(ast, {
      ExportDefaultDeclaration: function(path) {
        console.log(path.node.declaration.type)
        if (path.node.declaration.type === 'CallExpression') {
          ctype = 'classic'
        }

      }
    })
  }
  return ctype;
}


function scanProject(component) {
  let hbsFiles = globSync(`${root}/app/**/*.hbs`)
  let sampleRenders = [];
  hbsFiles.forEach(file => {
    const data = readFileSync(file, 'utf-8')
    const result = componentLookupInHbs(data, component);
    if (result) {
      console.log('Used in: ', file)

      let ast = preprocess(data);
      let walker = new Walker();

      walker.visit(ast, function(node) {

        let componentName = _convertToAngleBracketsName(component.name);
        if (node.type === 'ElementNode' && node.tag === componentName) {
          sampleRenders.push(print(node))
        }
      });



    }
  })
  return sampleRenders;
}

async function main() {

  try {
    const files = await readdir(components);
    files
      .filter(f => !ignoreFiles.includes(f))
      .forEach(f => {
        const componentFile = `${components}/${f}/component.js`
        const hbsFile = `${components}/${f}/template.hbs`
        const testFile = `${integrationTests}/${f}-test.js`;
        const testFound = existsSync(testFile)
        const componentJSFound = existsSync(componentFile)
        const hbsFound = existsSync(hbsFile)
        if (!testFound) {
          withoutTests.push(f);
          // const ctype = getComponentType(componentFile)
          // console.log(f, ctype)
          // console.log('-----------------------------------')

        }

      })
    // console.log(withoutTests)
    // Pick one random component
    const random = chance.pickone(withoutTests);
    console.log('Random component: ', random)

    const sampleUsage = scanProject({ name: random })
    console.log(sampleUsage)
    const testContent = templateFunc(random, sampleUsage);
    const newTestFile = `${integrationTests}/${random}-test.js`;
    writeFile(newTestFile, testContent)
      .catch(err => {
        console.error(err)
      })

  } catch (e) {
    console.error(e);
  }

}

main();
// scanProject({ name: 'ui-x-toggle'})
// scanProject({ name: 'accessible-icon-element'})