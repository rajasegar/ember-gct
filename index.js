import { readdir, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import templateFunc from './src/template.js';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;
import { readFileSync } from 'node:fs';
import { globSync } from 'glob';
import {
  componentLookupInHbs,
  _convertToAngleBracketsName
} from './src/utils.js';
import { generateHelperTests } from './src/generateTests.js';

import * as prettier from 'prettier';

import generateRouteTests from './src/generateRouteTests.js';
import generateUtilTests from './src/generateUtilTests.js';
import { preprocess, Walker, print } from '@glimmer/syntax';
import Chance from 'chance';
import * as R from 'ramda';
import { homedir } from 'os';
import { resolve, dirname } from 'path';

const chance = new Chance();
const root = resolve(homedir(), 'Code/unity_frontend');
const ignoreFiles = ['.DS_Store', '.gitkeep'];

const components = `${root}/app/components`;
const integrationTests = `${root}/tests/integration/components`;
const unitTests = `${root}/tests/unit`;

function getComponentType(filepath) {
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

function scanProject(component) {
  let hbsFiles = globSync(`${root}/app/**/*.hbs`);
  let sampleAsts = [];
  hbsFiles.forEach((file) => {
    const data = readFileSync(file, 'utf-8');
    const result = componentLookupInHbs(data, component);
    if (result) {
      // console.log('Used in: ', file)

      let ast = preprocess(data);
      let walker = new Walker();

      walker.visit(ast, function (node) {
        let componentName = _convertToAngleBracketsName(component.name);
        if (node.type === 'ElementNode' && node.tag === componentName) {
          sampleAsts.push(node);
        }
      });
    }
  });
  return sampleAsts;
}

function findItemsWithoutUnitTests(item) {
  const withoutTests = [];
  try {
    const itemsLocation = `${root}/app/${item}/`;
    const items = globSync(`${root}/app/${item}/**/*.js`);
    items.forEach((i) => {
      const itemPath = i.replace(itemsLocation, '').replace('.js', '');
      const testFile = `${unitTests}/${item}/${itemPath}-test.js`;
      const testFound = existsSync(testFile);
      if (!testFound) {
        withoutTests.push(itemPath);
      }
    });

    const percentage = Math.round((withoutTests.length / items.length) * 100);

    console.log(
      `Total ${item} without tests: ${withoutTests.length}/${items.length} ==> ${percentage}%`
    );
  } catch (err) {
    console.error(err);
  }
  return withoutTests;
}

async function findHelpersWithoutTests(root) {
  const integrationTestsPath = `${root}/tests/integration`;
  const unitTestsPath = `${root}/tests/unit`;
  const withoutTests = [];
  try {
    const itemsLocation = `${root}/app/helpers/`;
    const items = globSync(`${root}/app/helpers/**/*.js`);
    items.forEach((i) => {
      const itemPath = i.replace(itemsLocation, '').replace('.js', '');
      const unitTestFile = `${unitTestsPath}/helpers/${itemPath}-test.js`;
      const integrationTestFile = `${integrationTestsPath}/helpers/${itemPath}-test.js`;
      const testFound =
        existsSync(unitTestFile) || existsSync(integrationTestFile);
      if (!testFound) {
        withoutTests.push(itemPath);
      }
    });

    const percentage = Math.round((withoutTests.length / items.length) * 100);

    console.log(
      `Total helpers without tests: ${withoutTests.length}/${items.length} ==> ${percentage}%`
    );
    return withoutTests;
  } catch (err) {
    console.error(err);
  }
}

async function findComponentsWithoutTests() {
  const files = await readdir(components);
  const componentsWithoutTests = [];
  files
    .filter((f) => !ignoreFiles.includes(f))
    .forEach((f) => {
      const componentFile = `${components}/${f}/component.js`;
      const hbsFile = `${components}/${f}/template.hbs`;
      const integrationTestFile = `${integrationTests}/${f}-test.js`;
      // console.log(integrationTestFile);
      const unitTestFile = `${unitTests}/${f}-test.js`;
      // console.log(unitTestFile);
      const testFound =
        existsSync(integrationTestFile) || existsSync(unitTestFile);
      const componentJSFound = existsSync(componentFile);
      if (!testFound) {
        componentsWithoutTests.push(f);
      }
    });

  const percentage = Math.round(
    (componentsWithoutTests.length / files.length) * 100
  );

  console.log(
    `Total components without tests: ${componentsWithoutTests.length}/${files.length} ==> ${percentage}%`
  );
  return componentsWithoutTests;
}

async function writeComponentTests() {
  const astNodes = scanProject({ name: random });

  // Generate tests only if there is an existing usage at least once
  if (astNodes.length > 0) {
    const uniqNodes = R.uniqBy(print, astNodes);
    uniqNodes.forEach((n, i) => console.log(`${i} => `, print(n)));

    // console.log(sampleUsage)
    const testContent = templateFunc(random, uniqNodes);
    const newTestFile = `${integrationTests}/${random}-test.js`;
    await Bun.write(newTestFile, testContent);
  }
}

async function main() {
  let withoutTests = [];

  await findComponentsWithoutTests();
  findItemsWithoutUnitTests('routes');
  findItemsWithoutUnitTests('controllers');
  findItemsWithoutUnitTests('mixins');
  findItemsWithoutUnitTests('services');
  await findHelpersWithoutTests(root);
  withoutTests = findItemsWithoutUnitTests('utils');

  try {
    /*
    Bun.write(
      "/Users/rajasegarchandran/Desktop/without-tests.txt",
      withoutTests.join("\n")
    );
    */

    runSingleUtilTest(unitTests, withoutTests);
    // runMultipleRouteTests(unitTests, withoutTests);

    // runEmberTests(random);
  } catch (e) {
    console.error(e);
  }
}

async function runSingleUtilTest(unitTests, withoutTests) {
  const random = chance.pickone(withoutTests);
  console.log('Random util: ', random);
  const testContent = generateUtilTests(root, random);

  const newTestFile = `${unitTests}/utils/${random}-test.js`;
  console.log(newTestFile);

  formatAndWrite(newTestFile, testContent);
}

async function runSingleRouteTest(unitTests, withoutTests) {
  const random = chance.pickone(withoutTests);
  // const random = "web/settings/messenger/web";
  console.log('Random route: ', random);
  const testContent = generateRouteTests(root, random);

  const newTestFile = `${unitTests}/routes/${random}-test.js`;
  console.log(newTestFile);
  // await Bun.write(newTestFile, testContent);

  formatAndWrite(newTestFile, testContent);
}

function formatAndWrite(file, content) {
  mkdir(dirname(file), { recursive: true }).then(async () => {
    const formattedContent = await prettier.format(content, {
      singleQuote: true,
      parser: 'babel'
    });
    writeFile(file, formattedContent);
  });
}

async function runMultipleRouteTests(unitTests, withoutTests) {
  const random = chance.pick(withoutTests, 100);
  random.forEach(async (r) => {
    const testContent = generateRouteTests(r);

    const newTestFile = `${unitTests}/routes/${r}-test.js`;
    console.log(newTestFile);

    mkdir(dirname(newTestFile), { recursive: true }).then(() => {
      writeFile(newTestFile, testContent);
    });
  });
}

async function runEmberTests(filter) {
  const proc = Bun.spawn(['bun', 'run', 'test:ember', `--filter=${filter}`], {
    cwd: root, // specify a working direcory
    env: { ...process.env }, // specify environment variables
    onExit(proc, exitCode, signalCode, error) {
      // exit handler
    }
  });

  const text = await new Response(proc.stdout).text();
  console.log(text);
}

main();
// scanProject({ name: 'ui-x-toggle'})
// scanProject({ name: 'accessible-icon-element'})
