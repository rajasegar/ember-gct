function scanProject(component) {
  let hbsFiles = globSync(`${root}/app/**/*.hbs`);
  let sampleAsts = [];
  hbsFiles.forEach((file) => {
    const data = readFileSync(file, 'utf-8');
    const result = componentLookupInHbs(data, component);
    if (result) {
      // console.log('Used in: ', file)

      let ast = preprocess(data);
      let walker = new Walker();

      walker.visit(ast, function (node) {
        let componentName = _convertToAngleBracketsName(component.name);
        if (node.type === 'ElementNode' && node.tag === componentName) {
          sampleAsts.push(node);
        }
      });
    }
  });
  return sampleAsts;
}
