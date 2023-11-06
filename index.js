import { homedir } from 'os';
import { resolve } from 'path';

import findHelpersWithoutTests from './src/helpers/findHelpersWithoutTests.js';
// import runSingleHelperTest from './src/helpers/runSingleTest.js';
import runSingleComponentTest from './src/components/runSingleTest.js';
import { findComponentsWithoutTests } from './src/components/findComponentsWithoutTests.js';
// import runMultipleHelperTests from './src/helpers/runMultipleTests.js';

const root = resolve(homedir(), 'Code/unity_frontend');
// const ignoreFiles = ['.DS_Store', '.gitkeep'];

// const components = `${root}/app/components`;
// const integrationTests = `${root}/tests/integration/components`;
// const unitTests = `${root}/tests/unit`;

async function printStats() {
  await findComponentsWithoutTests();
  findItemsWithoutUnitTests('routes');
  findItemsWithoutUnitTests('controllers');
  findItemsWithoutUnitTests('mixins');
  findItemsWithoutUnitTests('services');
  findHelpersWithoutTests(root);
  findItemsWithoutUnitTests('utils');
}
async function main() {
  let withoutTests = [];

  // withoutTests = findHelpersWithoutTests(root);
  withoutTests = await findComponentsWithoutTests(root);

  runSingleComponentTest(withoutTests, root);
  try {
    /*
    Bun.write(
      "/Users/rajasegarchandran/Desktop/without-tests.txt",
      withoutTests.join("\n")
    );
    */
    // runMultipleHelperTests(unitTests, withoutTests, root);
    // runSingleHelperTest(unitTests, withoutTests, root);
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
