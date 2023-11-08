import { preprocess, Walker, print, traverse } from '@glimmer/syntax';
import { readFileSync, existsSync } from 'node:fs';
import * as R from 'ramda';

function getComponentProps(root) {
  const componentProps = [];
  traverse(root, {
    MustacheStatement: function (node) {
      if (node.path.original.startsWith('@')) {
        // console.log(node.path.original);
        componentProps.push(node.path.original);
      }
    }
  });

  return componentProps;
}

function getDomSelectors(root) {
  const selectors = [];
  traverse(root, {
    ElementNode: function (node) {
      const classAttr = node.attributes.find((a) => a.name === 'class');
      let selector = node.tag;

      // Add class attr value only if it is a TextNode
      if (classAttr && classAttr.value.type === 'TextNode') {
        selector = `${node.tag}.${classAttr.value.chars.replace(' ', '.')}`;
        selectors.push(selector);
      }
    }
  });

  return selectors;
}

function walkAst(ast) {
  const domElements = [];
  let walker = new Walker();
  walker.visit(ast, function (node) {
    if (
      node.type === 'BlockStatement' &&
      (node.path.original === 'if' || node.path.original === 'else')
    ) {
      walkAst(node.program);
      processNode(node.program);

      if (node.inverse) {
        walkAst(node.inverse);
      }
    }

    if (node.type === 'ElementNode') {
      // generate asserts for dom exists
      const classAttr = node.attributes.find((a) => a.name === 'class');
      let selector = node.tag;

      // Add class attr value only if it is a TextNode
      if (classAttr && classAttr.value.type === 'TextNode') {
        selector = `${node.tag}.${classAttr.value.chars.replace(' ', '.')}`;
        domElements.push(selector);
      }

      // generate asserts for data-test elements
      const dataTestAttr = node.attributes.find((a) =>
        a.name.startsWith('data-test')
      );
      // Add data-test-id attr value only if it is a TextNode
      if (dataTestAttr && dataTestAttr.value.type === 'TextNode') {
        selector = `[${dataTestAttr.name}="${dataTestAttr.value.chars}"]`;
        domElements.push(selector);
      }
    }
  });

  return domElements;
}

function generateAssertsForDom(root, componentName) {
  const components = `${root}/app/components`;
  const hbsFile = `${components}/${componentName}/template.hbs`;

  let asserts = [];

  // console.log('Template: ', hbsFile);
  const hbsFound = existsSync(hbsFile);
  if (hbsFound) {
    console.log('Template: ', hbsFile);
    const data = readFileSync(hbsFile, 'utf-8');
    let ast = preprocess(data);

    const domElements = walkAst(ast);

    asserts = R.uniq(domElements).map((el) => `assert.dom('${el}').exists();`);
  }

  return asserts;
}

function captureInfo(root, componentName) {
  const components = `${root}/app/components`;
  const hbsFile = `${components}/${componentName}/template.hbs`;

  let asserts = [];

  const hbsFound = existsSync(hbsFile);
  if (hbsFound) {
    const data = readFileSync(hbsFile, 'utf-8');
    let ast = preprocess(data);

    const variations = [];

    traverse(ast, {
      BlockStatement: {
        enter(node) {
          if (node.path.original === 'if') {
            const componentProps = getComponentProps(node.program);
            const selectors = getDomSelectors(node.program);
            variations.push({ componentProps, selectors });
          }
          if (node.inverse) {
            const componentProps = getComponentProps(node.program);
            const selectors = getDomSelectors(node.program);
            variations.push({ componentProps, selectors });
          }
        },

        exit(node) {}
      }
    });

    console.log(variations);
  }

  return asserts;
}

function generateTests() {
  return astNodes.map((node, i) => {
    const fakes = [];
    node.attributes.forEach((attr) => {
      if (attr.value.type === 'MustacheStatement') {
        const { path, params } = attr.value;
        if (path.type === 'PathExpression') {
          if (path.original === 'action') {
            needSinon = true;
            let actionName = '';
            const [firstParam] = params;
            if (firstParam.type === 'StringLiteral') {
              actionName = `${firstParam.value}Action`;
            }
            if (firstParam.type === 'PathExpression') {
              actionName = `${firstParam.parts[0]}Action`;
            }

            if (actionName) {
              fakes.push(`this.${actionName} =  sinon.fake();`);
              attr.value.path.original = `this.${actionName}`;
              attr.value.this = true;
              attr.value.parts = [actionName];
              attr.value.params = [];
            }
          }
        }
      }
    });

    const asserts = generateAssertsForDom(root, componentName);
    const test = `
test('Should render the ${componentName} component - variant ${i}', async function (assert) {
    ${fakes.join('\n')}
    await render(hbs\`${print(node)}\`);
    assert.ok(true);
    ${asserts.join('\n')}
  });
`;

    return test;
  });
}

export default function (root, componentName, astNodes) {
  let needSinon = false;

  // const tests = generateTests().join('\n');
  const tests = '';

  captureInfo(root, componentName);
  const str = `import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';
import { setupRenderingTest } from "ember-qunit";
import { render } from '@ember/test-helpers';
${needSinon ? "import sinon from 'sinon'" : ''}

module('Integration | Component | ${componentName}', function (hooks) {
  setupRenderingTest(hooks);

 ${tests} 
});
`;

  return str;
}
