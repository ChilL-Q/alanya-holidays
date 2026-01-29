
import { en } from '../locales/en';
import { ru } from '../locales/ru';
import { tr } from '../locales/tr';
import { ar } from '../locales/ar';

const languages = { en, ru, tr, ar };
const baseLang = 'en';

function getKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}

const baseKeys = new Set(getKeys(languages[baseLang]));
let hasErrors = false;

Object.entries(languages).forEach(([lang, data]) => {
  if (lang === baseLang) return;
  
  const currentKeys = new Set(getKeys(data));
  const missingInCurrent = [...baseKeys].filter(k => !currentKeys.has(k));
  const extraInCurrent = [...currentKeys].filter(k => !baseKeys.has(k));
  
  if (missingInCurrent.length > 0) {
    console.error(`\n❌ MISSING KEYS in ${lang} (${missingInCurrent.length}):`);
    missingInCurrent.forEach(k => console.error(`   - ${k}`));
    hasErrors = true;
  }
  
  if (extraInCurrent.length > 0) {
    console.warn(`\n⚠️  EXTRA KEYS in ${lang} (not in en) (${extraInCurrent.length}):`);
    extraInCurrent.forEach(k => console.warn(`   - ${k}`));
  }
});

if (!hasErrors) {
  console.log('\n✅ Success: All language files have matching keys!');
} else {
  console.log('\n❌ Verification Failed. Please fix missing keys.');
  process.exit(1);
}
