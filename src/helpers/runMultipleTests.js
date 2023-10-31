import Chance from 'chance';
import { generateHelperTests } from './generateTest.js';
import formatAndWrite from '../formatAndWrite.js';

export default function runMultipleTests(unitTests, withoutTests, root) {
  // const random = chance.pick(withoutTests, 10);
  // random.forEach(async (r) => {
  withoutTests.forEach(async (r) => {
    const testContent = generateHelperTests(root, r);

    const newTestFile = `${unitTests}/helpers/${r}-test.js`;
    console.log(newTestFile);

    // formatAndWrite(newTestFile, testContent);
  });
}
