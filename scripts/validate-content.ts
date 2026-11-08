import { balance, content } from '../src/content';
import { validateContent } from '../src/content/validate';

const errs = validateContent(content, balance);
if (errs.length) {
  console.error(`❌ ${errs.length} hiba a tartalomban:`);
  for (const e of errs) console.error('  - ' + e);
  process.exit(1);
}
console.log('✅ A tartalom rendben van.');
