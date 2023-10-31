export async function runMultipleRouteTests(unitTests, withoutTests) {
  // const random = chance.pick(withoutTests, 10);
  // random.forEach(async (r) => {
  withoutTests.forEach(async (r) => {
    const testContent = generateRouteTests(root, r);

    const newTestFile = `${unitTests}/routes/${r}-test.js`;
    console.log(newTestFile);

    formatAndWrite(newTestFile, testContent);
  });
}

export async function runSingleRouteTest(unitTests, withoutTests) {
  const random = chance.pickone(withoutTests);
  // const random = "web/settings/messenger/web";
  console.log('Random route: ', random);
  const testContent = generateRouteTests(root, random);

  const newTestFile = `${unitTests}/routes/${random}-test.js`;
  console.log(newTestFile);
  // await Bun.write(newTestFile, testContent);

  formatAndWrite(newTestFile, testContent);
}
