const express = require('express');
const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Moodle API config
const MOODLE_URL = 'https://conjureuniversity.online/moodle/webservice/rest/server.php';
const MOODLE_TOKEN = '519f754c7dc83533788a2dd5872fe991';
const MOODLE_FORMAT = 'json';

// Load the universal function map
let functionMap = {};
try {
  functionMap = JSON.parse(fs.readFileSync('./Moodle_Universal_Functions_Map.json', 'utf8'));
} catch (err) {
  console.error('Failed to load Moodle_Universal_Functions_Map.json:', err);
}

// Parse POST body
app.use(express.urlencoded({ extended: true }));

app.post('/oracle_command', async (req, res) => {
  try {
    const { command, parameters } = req.body;

    if (!command || !parameters) {
      return res.status(400).json({ error: 'Missing command or parameters' });
    }

    const functionName = command.trim();
    const payload = typeof parameters === 'string' ? JSON.parse(parameters) : parameters;

    // Validate if command exists in function map (optional)
    if (!functionMap[functionName]) {
      console.warn(`⚠️ Warning: Function '${functionName}' not found in map. Proceeding anyway.`);
    }

    const moodleEndpoint = `${MOODLE_URL}?wstoken=${MOODLE_TOKEN}&wsfunction=${functionName}&moodlewsrestformat=${MOODLE_FORMAT}`;

    const response = await axios.post(moodleEndpoint, qs.stringify(payload), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return res.status(200).json({
      success: true,
      function: functionName,
      moodle_response: response.data
    });

  } catch (error) {
    console.error('Oracle Command Failed:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Oracle Server is running on port ${PORT}`);
});
