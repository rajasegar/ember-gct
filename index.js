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

import generateRouteTests from './src/generateRouteTests.js';
import generateUtilTests from './src/generateUtilTests.js';
import { preprocess, Walker, print } from '@glimmer/syntax';
import Chance from 'chance';
import * as R from 'ramda';
import { homedir } from 'os';
import { resolve, dirname } from 'path';

import findHelpersWithoutTests from './src/helpers/findHelpersWithoutTests.js';
import runSingleHelperTest from './src/helpers/runSingleTest.js';
import runMultipleHelperTests from './src/helpers/runMultipleTests.js';

const chance = new Chance();
const root = resolve(homedir(), 'Code/unity_frontend');
const ignoreFiles = ['.DS_Store', '.gitkeep'];

const components = `${root}/app/components`;
const integrationTests = `${root}/tests/integration/components`;
const unitTests = `${root}/tests/unit`;

async function printStats() {
  await findComponentsWithoutTests();
  findItemsWithoutUnitTests('routes');
  findItemsWithoutUnitTests('controllers');
  findItemsWithoutUnitTests('mixins');
  findItemsWithoutUnitTests('services');
  await findHelpersWithoutTests(root);
  findItemsWithoutUnitTests('utils');
}
async function main() {
  let withoutTests = [];

  withoutTests = findHelpersWithoutTests(root);
  try {
    /*
    Bun.write(
      "/Users/rajasegarchandran/Desktop/without-tests.txt",
      withoutTests.join("\n")
    );
    */
    // runMultipleHelperTests(unitTests, withoutTests, root);
    runSingleHelperTest(unitTests, withoutTests, root);
    // runSingleUtilTest(unitTests, withoutTests);
    // runMultipleRouteTests(unitTests, withoutTests);
    // runEmberTests(random);
  } catch (e) {
    console.error(e);
  }
}

main();
// scanProject({ name: 'ui-x-toggle'})
// scanProject({ name: 'accessible-icon-element'})
