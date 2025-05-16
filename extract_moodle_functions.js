const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

(async () => {
  try {
    const url = 'https://conjureuniversity.online/moodle/admin/webservice/documentation.php?wstoken=519f754c7dc83533788a2dd5872fe991';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const functionMap = {};
    $('h3').each((_, el) => {
      const functionName = $(el).text().replace('Function name: ', '').trim();
      const ul = $(el).nextAll('ul').first();
      if (ul.length) {
        const params = [];
        ul.find('li').each((_, li) => {
          const text = $(li).text();
          const param = text.split('=')[0].trim();
          if (param) params.push(param);
        });
        functionMap[functionName] = params;
      }
    });

    fs.writeFileSync('Moodle_Universal_Functions_Map.json', JSON.stringify(functionMap, null, 2));
    console.log('✅ Extracted using token — schema saved to Moodle_Universal_Functions_Map.json');
  } catch (error) {
    console.error('❌ Failed to extract:', error);
  }
})();
