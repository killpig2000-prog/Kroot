(async () => {
  const fs = require('fs');
  const path = require('path');

  // Add node_modules to the path
  const moduleDir = path.join(__dirname, 'node_modules');
  
  let translate;
  try {
    translate = require(path.join(moduleDir, 'google-translate-api-x'));
  } catch (e) {
    console.error('Could not load translation module:', e.message);
    console.log('Creating JSON files with English content...');
    
    const enJson = JSON.parse(fs.readFileSync('./messages/en/grammar.json', 'utf-8'));
    ['ja', 'zh-Hans', 'vi'].forEach(lang => {
      fs.writeFileSync(`./messages/${lang}/grammar.json`, JSON.stringify(enJson, null, 2));
    });
    return;
  }

  async function translateText(text, lang, maxRetries = 2) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await translate(text, { to: lang.substring(0, 2) });
        return result.text;
      } catch (e) {
        if (i === maxRetries - 1) return text;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    return text;
  }

  const enJson = JSON.parse(fs.readFileSync('./messages/en/grammar.json', 'utf-8'));
  const langs = { 'ja': 'Japanese', 'zh-Hans': 'Chinese', 'vi': 'Vietnamese' };

  for (const [lang, name] of Object.entries(langs)) {
    console.log(`\n=== Translating to ${name} ===`);
    const json = JSON.parse(JSON.stringify(enJson));

    // Translate lessons
    for (const [key, lesson] of Object.entries(json.lessons)) {
      process.stdout.write(`${key.padEnd(20)} `);

      if (lesson.title) lesson.title = await translateText(lesson.title, lang);
      if (lesson.summary) lesson.summary = await translateText(lesson.summary, lang);

      if (lesson.sections) {
        for (const s of lesson.sections) {
          if (s.heading) s.heading = await translateText(s.heading, lang);
          if (s.explanation) s.explanation = await translateText(s.explanation, lang);
        }
      }

      if (lesson.quiz) {
        for (const q of lesson.quiz) {
          if (q.q) q.q = await translateText(q.q, lang);
          if (q.opts) {
            for (let i = 0; i < q.opts.length; i++) {
              q.opts[i] = await translateText(q.opts[i], lang);
            }
          }
        }
      }

      console.log('✓');
    }

    // Translate groups
    if (json.groups) {
      for (const [k, g] of Object.entries(json.groups)) {
        if (g.title) g.title = await translateText(g.title, lang);
        if (g.sub) g.sub = await translateText(g.sub, lang);
      }
    }

    fs.writeFileSync(`./messages/${lang}/grammar.json`, JSON.stringify(json, null, 2));
    console.log(`✓ Saved messages/${lang}/grammar.json`);
  }

  console.log('\n✓ Complete!');
})().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
