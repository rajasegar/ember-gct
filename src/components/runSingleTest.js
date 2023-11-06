import Chance from 'chance';
import generateComponentTests from './generateTest.js';
import formatAndWrite from '../formatAndWrite.js';
import scanProject from './scanProject.js';

export default function runSingleHelperTest(withoutTests, root) {
  // const components = `${root}/app/components`;
  const integrationTests = `${root}/tests/integration/components`;
  const chance = new Chance();
  const random = chance.pickone(withoutTests);
  console.log('Random component: ', random);
  const astNodes = scanProject({ name: random }, root);
  const testContent = generateComponentTests(random, astNodes);

  const newTestFile = `${integrationTests}/${random}-test.js`;
  console.log(newTestFile);

  formatAndWrite(newTestFile, testContent);
}
