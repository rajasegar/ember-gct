import { _uppercaseFirstLetter } from './utils.js';
export function generateHelperTests(name) {
  const [head, ...rest] = name.split('-');

  const tail = rest.map(_uppercaseFirstLetter).join('');

  const capitalizedName = head + tail;

  const str = `import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { ${capitalizedName} } from 'hotline-frontend/helpers/${name}';

module('Unit | Helper | ${name}', function(hooks) {
  setupTest(hooks);

  test('should return correct value', async function(assert) {
    assert.equal(${capitalizedName}(), '');
  });

});
`;
  return str;
}

