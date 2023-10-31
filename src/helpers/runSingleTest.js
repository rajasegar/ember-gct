import Chance from 'chance';
import { generateHelperTests } from './generateTest.js';
import formatAndWrite from '../formatAndWrite.js';

export default function runSingleHelperTest(unitTests, withoutTests, root) {
  const chance = new Chance();
  const random = chance.pickone(withoutTests);
  console.log('Random helper: ', random);
  const testContent = generateHelperTests(root, random);

  const newTestFile = `${unitTests}/helpers/${random}-test.js`;
  console.log(newTestFile);

  formatAndWrite(newTestFile, testContent);
}
