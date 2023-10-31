import { writeFile, mkdir } from 'fs/promises';
import * as prettier from 'prettier';
import { dirname } from 'path';

export default function formatAndWrite(file, content) {
  mkdir(dirname(file), { recursive: true }).then(async () => {
    const formattedContent = await prettier.format(content, {
      singleQuote: true,
      parser: 'babel',
      trailingComma: 'none'
    });
    writeFile(file, formattedContent);
  });
}
