const fs = require('fs');

async function translateText(text, targetLang) {
  try {
    // Use the installed translate library
    const translate = require('google-translate-api-x');
    const result = await translate(text, { to: targetLang });
    return result.text;
  } catch (e) {
    console.warn(`Translation failed: ${text.substring(0, 30)}... (${e.message})`);
    return text;
  }
}

async function main() {
  const enJsonPath = './messages/en/grammar.json';
  const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf-8'));

  const langs = { 'ja': 'Japanese', 'zh-Hans': 'Chinese', 'vi': 'Vietnamese' };

  for (const [lang, langName] of Object.entries(langs)) {
    console.log(`\nTranslating to ${langName}...`);
    const translated = JSON.parse(JSON.stringify(enJson));

    let count = 0;

    // Translate lessons
    for (const [key, lesson] of Object.entries(translated.lessons)) {
      process.stdout.write(`  ${key}... `);
      
      if (lesson.title) {
        lesson.title = await translateText(lesson.title, lang.substring(0, 2));
        count++;
      }
      if (lesson.summary) {
        lesson.summary = await translateText(lesson.summary, lang.substring(0, 2));
        count++;
      }

      if (lesson.sections) {
        for (const section of lesson.sections) {
          if (section.heading) {
            section.heading = await translateText(section.heading, lang.substring(0, 2));
            count++;
          }
          if (section.explanation) {
            section.explanation = await translateText(section.explanation, lang.substring(0, 2));
            count++;
          }
        }
      }

      if (lesson.quiz) {
        for (const q of lesson.quiz) {
          if (q.q) {
            q.q = await translateText(q.q, lang.substring(0, 2));
            count++;
          }
          if (q.opts) {
            for (let i = 0; i < q.opts.length; i++) {
              q.opts[i] = await translateText(q.opts[i], lang.substring(0, 2));
              count++;
            }
          }
        }
      }

      console.log('✓');
    }

    // Translate groups
    if (translated.groups) {
      for (const [gkey, group] of Object.entries(translated.groups)) {
        if (group.title) {
          group.title = await translateText(group.title, lang.substring(0, 2));
          count++;
        }
        if (group.sub) {
          group.sub = await translateText(group.sub, lang.substring(0, 2));
          count++;
        }
      }
    }

    const outputPath = `./messages/${lang}/grammar.json`;
    fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2));
    console.log(`✓ Saved ${lang}/grammar.json (${count} strings translated)`);
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
