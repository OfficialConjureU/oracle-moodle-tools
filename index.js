// ==========================
// FINAL UNIVERSAL ORACLE MOODLE RELAY
// Supports ALL functions, ALL formats
// ==========================

const express = require('express');
const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;

// Moodle API Config
const MOODLE_URL = 'https://conjureuniversity.online/moodle/webservice/rest/server.php';
const MOODLE_TOKEN = '519f754c7dc83533788a2dd5872fe991';
const DOCS_URL = `https://conjureuniversity.online/moodle/admin/webservice/documentation.php?wstoken=${MOODLE_TOKEN}`;

let functionMap = {};

async function updateFunctionMap() {
  try {
    const response = await axios.get(DOCS_URL);
    const $ = cheerio.load(response.data);
    const map = {};
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
        map[functionName] = params;
      }
    });
    functionMap = map;
    fs.writeFileSync('./Moodle_Universal_Functions_Map.json', JSON.stringify(map, null, 2));
    console.log('✅ Moodle function map updated');
  } catch (err) {
    console.error('❌ Failed to update map:', err.message);
    try {
      functionMap = JSON.parse(fs.readFileSync('./Moodle_Universal_Functions_Map.json', 'utf8'));
    } catch (e) {
      console.error('❌ No fallback schema found');
    }
  }
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Universal Oracle Relay Handler
app.post('/oracle_command', async (req, res) => {
  try {
    const { command, ...rest } = req.body;
    if (!command) return res.status(400).json({ error: 'Missing "command" field.' });

    const payload = {
      wstoken: MOODLE_TOKEN,
      wsfunction: command,
      moodlewsrestformat: 'json',
      ...rest
    };

    const response = await axios.post(
      MOODLE_URL,
      qs.stringify(payload, { encode: true }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    res.json({
      status: 'success',
      command,
      moodleResponse: response.data
    });
  } catch (error) {
    console.error('❌ Relay Error:', error.response?.data || error.message);
    res.status(500).json({
      status: 'error',
      error: error.response?.data || error.message
    });
  }
});

updateFunctionMap().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Oracle Universal Moodle Relay running on port ${PORT}`);
  });
});
