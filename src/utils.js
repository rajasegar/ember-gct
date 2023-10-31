export function componentLookupInHbs(data, component) {
  let curlyBracesInvocation = curlyBraces(data, component);
  let angleBracketsInvocation = angleBrackets(data, component);
  let usesComponentHelper = componentHelper(data, component);

  if (curlyBracesInvocation.match) {
    return {
      fileType: 'hbs',
      type: 'curly'
    };
  }

  if (angleBracketsInvocation.match) {
    return {
      fileType: 'hbs',
      type: 'angle'
    };
  }

  if (usesComponentHelper.match) {
    return {
      fileType: 'hbs',
      type: 'componentHelper'
    };
  }
}

function curlyBraces(data, component) {
  let regex = `({{|{{#)${component.name}($|\\s|\\r|/|}}|'|"|\`)`;
  return _prepareResult(data, regex);
}

function angleBrackets(data, component) {
  let componentName = _convertToAngleBracketsName(component.name);

  let regex = `<${componentName}($|\\s|\\r|/>|>)`;
  return _prepareResult(data, regex);
}

export function _convertToAngleBracketsName(componentName) {
  let nestedParts = componentName.split('/');

  nestedParts = nestedParts.map((nestedPart) => {
    let hasHyphenAsFirstCharacter = nestedPart.charAt(0) === '-';
    let localParts = nestedPart.split('-');

    localParts = localParts.map(_uppercaseFirstLetter);

    let localName = localParts.join('');

    return hasHyphenAsFirstCharacter ? `-${localName}` : localName;
  });

  return nestedParts.join('::');
}

function componentHelper(data, component) {
  let regex = `component\\s('|")${component.name}('|")`;
  return _prepareResult(data, regex);
}

function _prepareResult(data, regex) {
  let re = new RegExp(regex, 'gi');
  let matches = data.match(re);

  let result = { regex };

  if (matches && matches.length > 0) {
    result.match = matches;
  }

  return result;
}

export function _uppercaseFirstLetter(string) {
  let stringArr = string.split('');

  for (let i = 0; i < stringArr.length; i++) {
    if (/^[a-zA-Z]+$/.test(stringArr[i])) {
      stringArr[i] = stringArr[i].toUpperCase();
      break;
    }
  }
  return stringArr.join('');
}

export function camelToSnakeCase(inputString) {
  return inputString.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function capitalizedName(str) {
  if (typeof str === 'string' && str.includes('-')) {
    const [head, ...rest] = str.split('-');

    const tail = rest.map(_uppercaseFirstLetter).join('');

    const capitalizedName = head + tail;
    return capitalizedName;
  } else {
    return str;
  }
}

export async function runEmberTests(filter) {
  const proc = Bun.spawn(['bun', 'run', 'test:ember', `--filter=${filter}`], {
    cwd: root, // specify a working direcory
    env: { ...process.env }, // specify environment variables
    onExit(proc, exitCode, signalCode, error) {
      // exit handler
    }
  });

  const text = await new Response(proc.stdout).text();
  console.log(text);
}

function findItemsWithoutUnitTests(item) {
  const withoutTests = [];
  try {
    const itemsLocation = `${root}/app/${item}/`;
    const items = globSync(`${root}/app/${item}/**/*.js`);
    items.forEach((i) => {
      const itemPath = i.replace(itemsLocation, '').replace('.js', '');
      const testFile = `${unitTests}/${item}/${itemPath}-test.js`;
      const testFound = existsSync(testFile);
      if (!testFound) {
        withoutTests.push(itemPath);
      }
    });

    const percentage = Math.round((withoutTests.length / items.length) * 100);

    console.log(
      `Total ${item} without tests: ${withoutTests.length}/${items.length} ==> ${percentage}%`
    );
  } catch (err) {
    console.error(err);
  }
  return withoutTests;
}
