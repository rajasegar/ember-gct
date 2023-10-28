export function componentLookupInHbs(data, component) {
  let curlyBracesInvocation = curlyBraces(data, component);
  let angleBracketsInvocation = angleBrackets(data, component);
  let usesComponentHelper = componentHelper(data, component);

  if (curlyBracesInvocation.match) {
    return {
      fileType: "hbs",
      type: "curly",
    };
  }

  if (angleBracketsInvocation.match) {
    return {
      fileType: "hbs",
      type: "angle",
    };
  }

  if (usesComponentHelper.match) {
    return {
      fileType: "hbs",
      type: "componentHelper",
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
  let nestedParts = componentName.split("/");

  nestedParts = nestedParts.map((nestedPart) => {
    let hasHyphenAsFirstCharacter = nestedPart.charAt(0) === "-";
    let localParts = nestedPart.split("-");

    localParts = localParts.map(_uppercaseFirstLetter);

    let localName = localParts.join("");

    return hasHyphenAsFirstCharacter ? `-${localName}` : localName;
  });

  return nestedParts.join("::");
}

function componentHelper(data, component) {
  let regex = `component\\s('|")${component.name}('|")`;
  return _prepareResult(data, regex);
}

function _prepareResult(data, regex) {
  let re = new RegExp(regex, "gi");
  let matches = data.match(re);

  let result = { regex };

  if (matches && matches.length > 0) {
    result.match = matches;
  }

  return result;
}

export function _uppercaseFirstLetter(string) {
  let stringArr = string.split("");

  for (let i = 0; i < stringArr.length; i++) {
    if (/^[a-zA-Z]+$/.test(stringArr[i])) {
      stringArr[i] = stringArr[i].toUpperCase();
      break;
    }
  }
  return stringArr.join("");
}
