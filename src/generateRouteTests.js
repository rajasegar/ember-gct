import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import { readFileSync } from 'node:fs';
import * as R from 'ramda';
import { camelToSnakeCase, capitalizedName } from './utils.js';

export default function generateRouteTests(root, name) {
  const traverse = _traverse.default;
  const filePath = `${root}/app/routes/${name}.js`;
  const serviceInjections = [];
  const modelHooks = [];

  const hooks = ['model', 'beforeModel', 'afterModel'];
  let insideModelHook = false;
  let insideBeforeModelHook = false;
  let insideAfterModelHook = false;

  const modelHookStoreApis = [];
  const afterModelHookStoreApis = [];
  const beforeModelHookStoreApis = [];

  const component = readFileSync(filePath, 'utf-8');
  const ast = parse(component, {
    sourceType: 'module',
    plugins: ['decorators']
  });
  // console.log(ast)
  traverse(ast, {
    enter(path) {
      if (path.isObjectMethod() && path.node.key.name === 'model') {
        insideModelHook = true;
      }
      if (path.isObjectMethod() && path.node.key.name === 'afterModel') {
        insideAfterModelHook = true;
      }
      if (path.isObjectMethod() && path.node.key.name === 'beforeModel') {
        insideBeforeModelHook = true;
      }
    },
    exit(path) {
      if (path.isObjectMethod() && path.node.key.name === 'model') {
        insideModelHook = false;
      }
      if (path.isObjectMethod() && path.node.key.name === 'afterModel') {
        insideAfterModelHook = false;
      }
      if (path.isObjectMethod() && path.node.key.name === 'beforeModel') {
        insideBeforeModelHook = false;
      }
    },
    ExportDefaultDeclaration: function (path) {
      // console.log(path.node.declaration.type);
    },

    ObjectProperty: function (path) {
      if (path.node.value && path.node.value.type === 'CallExpression') {
        const name = path.node.value.callee.name;
        if (name === 'service') {
          let serviceName = path.node.value.arguments[0];
          if (!serviceName) {
            serviceName = camelToSnakeCase(path.node.key.name);
          }
          console.log('service: ', serviceName);
          serviceInjections.push(serviceName);
        }
      }
    },

    ObjectMethod: function (path) {
      const name = path.node.key.name;
      console.log(name);
      if (hooks.includes(name)) {
        modelHooks.push(name);
      }
    },

    MemberExpression: function (path) {
      if (
        path.node.object.type === 'ThisExpression' &&
        path.node.property.name === 'store' &&
        path.parent.property
      ) {
        const storeApi = path.parent.property.name;
        if (insideModelHook) {
          console.log('model hook store call: ', storeApi);
          modelHookStoreApis.push(storeApi);
        }
        if (insideBeforeModelHook) {
          console.log('beforeModel hook store call: ', storeApi);
          beforeModelHookStoreApis.push(storeApi);
        }
        if (insideAfterModelHook) {
          console.log('afterModel hook store call: ', storeApi);
          afterModelHookStoreApis.push(storeApi);
        }
      }
    }
  });

  function testsForModelHooks() {
    return modelHooks
      .map((hook) => {
        return `test('check if ${hook}() hook is working properly', async function (assert) {
        await this.route.${hook}();
        assert.ok(this.route);
        ${
          hook === 'model'
            ? R.uniq(modelHookStoreApis)
                .map((api) => {
                  return `assert.ok(this.store.${api}.called);`;
                })
                .join('\n')
            : ''
        }

        ${
          hook === 'afterModel'
            ? R.uniq(afterModelHookStoreApis)
                .map((api) => {
                  return `assert.ok(this.store.${api}.called);`;
                })
                .join('\n')
            : ''
        }

        ${
          hook === 'beforeModel'
            ? R.uniq(beforeModelHookStoreApis)
                .map((api) => {
                  return `assert.ok(this.store.${api}.called);`;
                })
                .join('\n')
            : ''
        }
        });`;
      })
      .join('\n');
  }

  const uniqStoreApis = R.uniq([
    ...modelHookStoreApis,
    ...afterModelHookStoreApis,
    ...beforeModelHookStoreApis
  ]);

  function mockStoreApis() {
    return uniqStoreApis
      .map((api) => {
        return `this.route.store.${api} = sinon.fake();`;
      })
      .join('\n');
  }

  const str = `import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';

module('Unit | Route | ${name}', function(hooks) {
  setupTest(hooks);
  hooks.beforeEach(function () {
    this.route = this.owner.lookup('route:${name}');
    this.store = this.owner.lookup('service:store');
    this.session = this.owner.lookup('service:session');

    ${serviceInjections
      .map((service) => {
        if (typeof service === 'string') {
          return `this.${capitalizedName(
            service
          )} = this.owner.lookup('service:${service}');`;
        } else {
          return '';
        }
      })
      .join('\n')}

    this.route.transitionTo = sinon.fake();
    this.route.transition = {
      abort: sinon.fake()
    };

   ${mockStoreApis()}


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
