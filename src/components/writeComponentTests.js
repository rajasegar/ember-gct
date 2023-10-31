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
