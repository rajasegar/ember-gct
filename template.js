export default function(componentName, usages) {
  const glimmer = true;
  const capitalized = componentName
    .split('-')
    .map(seg => seg[0].toUpperCase() + seg.slice(1))
    .join('')
  const renderName = glimmer ? `<${capitalized} />` : `{{${componentName}}}`


  const generateTests = () => {
    return usages.map(usage => {
      return `
test('Should render the ${componentName} component', async function (assert) {
    await render(hbs\`${usage}\`);
    assert.ok(true);
  });
`
    })
  }


  const str = `import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import setupComponentWithMirageTest from '../../helpers/setup-component-with-mirage';
import { render } from '@ember/test-helpers';

module('Integration | Component | ${componentName}', function (hooks) {
  setupComponentWithMirageTest(hooks);

 ${generateTests().join('\n')} 
});
`

  return str;
}
