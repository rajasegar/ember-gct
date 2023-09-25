import { readdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs'
import templateFunc from './src/template.js';
import { parse } from '@babel/parser'
import _traverse from "@babel/traverse";
const traverse = _traverse.default;
import { ExportDefaultDeclaration } from '@babel/types'
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
import { componentLookupInHbs, _convertToAngleBracketsName } from './src/utils.js'
import { preprocess, Walker, print } from '@glimmer/syntax';
import Chance from 'chance';
import * as R from 'ramda';

const chance = new Chance();
const root = '/Users/rajasegarchandran/Code/unity_frontend';
const components = `${root}/app/components`;
const integrationTests = `${root}/tests/integration/components`;
const unitTests = `${root}/tests/unit/components`;
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
  let sampleAsts = [];
  hbsFiles.forEach(file => {
    const data = readFileSync(file, 'utf-8')
    const result = componentLookupInHbs(data, component);
    if (result) {
      // console.log('Used in: ', file)

      let ast = preprocess(data);
      let walker = new Walker();

      walker.visit(ast, function(node) {

        let componentName = _convertToAngleBracketsName(component.name);
        if (node.type === 'ElementNode' && node.tag === componentName) {
          sampleAsts.push(node)
        }
      });
    }
  })
  return sampleAsts;
}

async function main() {

  try {
    const files = await readdir(components);
    files
      .filter(f => !ignoreFiles.includes(f))
      .forEach(f => {
        const componentFile = `${components}/${f}/component.js`
        const hbsFile = `${components}/${f}/template.hbs`
        const integrationTestFile = `${integrationTests}/${f}-test.js`;
        const unitTestFile = `${unitTests}/${f}-test.js`;
        const testFound = existsSync(integrationTestFile) || existsSync(unitTestFile)
        const componentJSFound = existsSync(componentFile)
        if (!testFound) {
          withoutTests.push(f);
        }

      })
    // console.log(withoutTests)
    writeFile("/Users/rajasegarchandran/Desktop/without-tests.txt", withoutTests.join('\n'));
    // Pick one random component
    const random = chance.pickone(withoutTests);
    // const random = 'accessible-icon-element'
    console.log('Random component: ', random)

    const astNodes = scanProject({ name: random })

    // Generate tests only if there is an existing usage at least once
    if (astNodes.length > 0) {

      const uniqNodes = R.uniqBy(print, astNodes);
      uniqNodes.forEach((n, i) => console.log(`${i} => `, print(n)))

      // console.log(sampleUsage)
      const testContent = templateFunc(random, uniqNodes);
      const newTestFile = `${integrationTests}/${random}-test.js`;
      writeFile(newTestFile, testContent)
        .catch(err => {
          console.error(err)
        })

      const proc = Bun.spawn(["bun","run", "test:ember", `--filter=${random}`], {
        cwd: root, // specify a working direcory
        env: { ...process.env }, // specify environment variables
        onExit(proc, exitCode, signalCode, error) {
          // exit handler
        },
      });

      const text = await new Response(proc.stdout).text();
      console.log(text); // => "hello"
    }

  } catch (e) {
    console.error(e);
  }

}

main();
// scanProject({ name: 'ui-x-toggle'})
// scanProject({ name: 'accessible-icon-element'})
