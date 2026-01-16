const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../locales');
const languages = ['en', 'ru', 'tr', 'ar'];

function extractKeys(content) {
    const keys = new Set();
    const regex = /['"]([\w.]+)['"]\s*:/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        keys.add(match[1]);
    }
    return keys;
}

function verifyLocales() {
    const keys = {};

    // Read all files
    languages.forEach(lang => {
        const filePath = path.join(localesDir, `${lang}.ts`);
        const content = fs.readFileSync(filePath, 'utf8');
        keys[lang] = extractKeys(content);
    });

    const baseKeys = keys['en'];
    let hasMissing = false;

    languages.forEach(lang => {
        if (lang === 'en') return;

        const langKeys = keys[lang];
        const missing = [...baseKeys].filter(k => !langKeys.has(k));

        if (missing.length > 0) {
            hasMissing = true;
            console.log(`\nMissing keys in ${lang.toUpperCase()}:`);
            missing.forEach(k => console.log(`  - ${k}`));
        } else {
            console.log(`\n${lang.toUpperCase()} is complete.`);
        }
    });

    if (!hasMissing) {
        console.log('\nAll locales are in sync!');
    }
}

verifyLocales();
