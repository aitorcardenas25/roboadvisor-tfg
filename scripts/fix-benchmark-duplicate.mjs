import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), 'app/page.tsx');
let text = fs.readFileSync(file, 'utf8');

text = text.replace(/BenchmarkCompostBox/g, 'BenchmarkCompositionPanel');

function removeDuplicateFunction(source, fnName) {
  const marker = `function ${fnName}(`;
  let first = source.indexOf(marker);
  if (first === -1) return source;
  let second = source.indexOf(marker, first + marker.length);
  while (second !== -1) {
    let i = second;
    while (i < source.length && source[i] !== '{') i++;
    if (i >= source.length) break;
    let depth = 0;
    let end = i;
    for (; end < source.length; end++) {
      if (source[end] === '{') depth++;
      else if (source[end] === '}') {
        depth--;
        if (depth === 0) {
          end++;
          break;
        }
      }
    }
    source = source.slice(0, second) + source.slice(end);
    second = source.indexOf(marker, first + marker.length);
  }
  return source;
}

text = removeDuplicateFunction(text, 'BenchmarkCompositionPanel');

fs.writeFileSync(file, text);
console.log('✅ benchmark component names normalized and duplicate definitions removed');
