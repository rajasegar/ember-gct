import { globSync } from 'glob';
import { existsSync } from 'fs';

export default function findHelpersWithoutTests(root) {
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
