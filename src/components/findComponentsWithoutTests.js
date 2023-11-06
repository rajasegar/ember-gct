import { existsSync } from 'fs';
import { readdir } from 'node:fs/promises';

export async function findComponentsWithoutTests(root) {
  const ignoreFiles = ['.DS_Store', '.gitkeep'];

  const components = `${root}/app/components`;
  const integrationTests = `${root}/tests/integration/components`;
  const unitTests = `${root}/tests/unit`;

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
