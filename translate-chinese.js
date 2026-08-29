(async () => {
  const fs = require('fs');
  const path = require('path');
  const translate = require(path.join(__dirname, 'node_modules', 'google-translate-api-x'));

  const enJson = JSON.parse(fs.readFileSync('./messages/en/grammar.json', 'utf-8'));
  
  async function translateText(text, maxRetries = 2) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await translate(text, { to: 'zh' });
        return result.text;
      } catch (e) {
        if (i === maxRetries - 1) {
          console.warn(`Failed to translate: ${text.substring(0, 30)}`);
          return text;
        }
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  console.log('Translating Chinese...\n');
  const zhJson = JSON.parse(JSON.stringify(enJson));

  // Translate lessons
  for (const [key, lesson] of Object.entries(zhJson.lessons)) {
    process.stdout.write(`${key.padEnd(20)}`);

    if (lesson.title) lesson.title = await translateText(lesson.title);
    if (lesson.summary) lesson.summary = await translateText(lesson.summary);

    if (lesson.sections) {
      for (const s of lesson.sections) {
        if (s.heading) s.heading = await translateText(s.heading);
        if (s.explanation) s.explanation = await translateText(s.explanation);
      }
    }

    if (lesson.quiz) {
      for (const q of lesson.quiz) {
        if (q.q) q.q = await translateText(q.q);
        if (q.opts) {
          for (let i = 0; i < q.opts.length; i++) {
            q.opts[i] = await translateText(q.opts[i]);
          }
        }
      }
    }

    console.log('✓');
  }

  // Translate groups
  if (zhJson.groups) {
    for (const [k, g] of Object.entries(zhJson.groups)) {
      if (g.title) g.title = await translateText(g.title);
      if (g.sub) g.sub = await translateText(g.sub);
    }
  }

  fs.writeFileSync('./messages/zh-Hans/grammar.json', JSON.stringify(zhJson, null, 2));
  console.log('\n✓ Saved messages/zh-Hans/grammar.json');
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
