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

export function generateRouteTests(name) {
  const str = `import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';

module('Unit | Route | ${name}', function(hooks) {
  setupTest(hooks);
  hooks.beforeEach(function () {
    this.store = this.owner.lookup('service:store');
    this.session = this.owner.lookup('service:session');
    this.route = this.owner.lookup('route:${name}');
    this.route.transitionTo = sinon.fake();
    this.route.transition = {
      abort: sinon.fake()
    };


  });

  hooks.afterEach(function() {
    sinon.restore();
  });

  test('it exists', async function (assert) {
    assert.ok(this.route);
  });



});
`;
  return str;
}
