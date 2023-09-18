import { print } from '@glimmer/syntax';
export default function(componentName, astNodes) {
  const glimmer = true;
  const capitalized = componentName
    .split('-')
    .map(seg => seg[0].toUpperCase() + seg.slice(1))
    .join('')
  const renderName = glimmer ? `<${capitalized} />` : `{{${componentName}}}`
  let needSinon = false;


  const generateTests = () => {
    return astNodes.map((node, i) => {

      const fakes = [];
      node.attributes.forEach(attr => {
        if (attr.value.type === 'MustacheStatement') {
          const { path, params } = attr.value;
          if (path.type === 'PathExpression') {
            if (path.original === "action") {
              needSinon = true;
              const actionName = `${params[0].value}Action`
              fakes.push(`this.${actionName} =  sinon.fake();`)
              attr.value.path.original = `this.${actionName}`
              attr.value.this = true;
              attr.value.parts = [actionName];
              attr.value.params = []
            }

          }

        }
      })
      const test =  `
test('Should render the ${componentName} component - variant ${i}', async function (assert) {
    ${fakes.join('\n')}
    await render(hbs\`${print(node)}\`);
    assert.ok(true);
  });
`;

      return test;
    })
  }

  const tests = generateTests().join('\n')

  const str = `import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import setupComponentWithMirageTest from '../../helpers/setup-component-with-mirage';
import { render } from '@ember/test-helpers';
${needSinon ? "import sinon from 'sinon'" : ''}

module('Integration | Component | ${componentName}', function (hooks) {
  setupComponentWithMirageTest(hooks);

 ${tests} 
});
`

  return str;
}
