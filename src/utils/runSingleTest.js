async function runSingleUtilTest(unitTests, withoutTests) {
  const random = chance.pickone(withoutTests);
  console.log('Random util: ', random);
  const testContent = generateUtilTests(root, random);

  const newTestFile = `${unitTests}/utils/${random}-test.js`;
  console.log(newTestFile);

  formatAndWrite(newTestFile, testContent);
}
