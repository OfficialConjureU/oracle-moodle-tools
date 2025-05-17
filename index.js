// ==========================
// UNIVERSAL ORACLE MOODLE RELAY - FINAL VERSION
// Supports ALL Moodle API functions and enforces full payload passthrough
// ==========================

const express = require('express');
const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;

// Moodle Config
const MOODLE_URL = 'https://conjureuniversity.online/moodle/webservice/rest/server.php';
const MOODLE_TOKEN = '519f754c7dc83533788a2dd5872fe991';
const DOCS_URL = `https://conjureuniversity.online/moodle/admin/webservice/documentation.php?wstoken=${MOODLE_TOKEN}`;

let functionMap = {};

// Auto-map all valid Moodle WS functions and parameters
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
    console.log('✅ Moodle function map updated and saved');
  } catch (err) {
    console.error('❌ Failed to scrape Moodle docs:', err.message);
    try {
      functionMap = JSON.parse(fs.readFileSync('./Moodle_Universal_Functions_Map.json', 'utf8'));
      console.log('✅ Loaded fallback Moodle function map');
    } catch (e) {
      console.error('❌ No fallback map found');
    }
  }
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Core Oracle Relay
app.post('/oracle_command', async (req, res) => {
  try {
    const { command, ...params } = req.body;
    if (!command) return res.status(400).json({ error: 'Missing required field: "command"' });

    const fullPayload = {
      wstoken: MOODLE_TOKEN,
      wsfunction: command,
      moodlewsrestformat: 'json',
      ...params
    };

    const moodleResponse = await axios.post(
      MOODLE_URL,
      qs.stringify(fullPayload, { encode: true }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    console.log('✅ RAW Moodle Response:', JSON.stringify(moodleResponse.data, null, 2));

    res.json({
      ok: true,
      endpoint: MOODLE_URL,
      invoked: command,
      response: moodleResponse.data
    });
  } catch (err) {
    console.error('❌ Moodle relay error:', err.response?.data || err.message);
    res.status(500).json({
      ok: false,
      message: 'Oracle relay error',
      error: err.response?.data || err.message
    });
  }
});

updateFunctionMap().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Oracle Moodle Relay listening at http://localhost:${PORT}`);
  });
});
