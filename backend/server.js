const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.skyvern.com/api/v1/tasks';
const PORT = process.env.PORT || 3000;

app.post('/initiate-widget-check-task', async (req, res) => {
  const { url } = req.body;

  const data_extraction_goal = 'Check if an accessibility widget exists on the homepage by identifying common accessibility widget elements or their distinctive features.';

  const extracted_information_schema = {
    type: "object",
    properties: {
      has_widget: { type: "boolean" }
    },
    required: ["has_widget"]
  };

  try {
    const response = await axios.post(BASE_URL, {
      url,
      data_extraction_goal,
      proxy_location: 'RESIDENTIAL',
      extracted_information_schema
    }, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error initiating widget check task:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/initiate-extract-links-task', async (req, res) => {
  const { url } = req.body;

  const data_extraction_goal = 'Extract all of the links available on the homepage.';

  const extracted_information_schema = {
    type: "object",
    properties: {
      links: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["links"]
  };

  try {
    const response = await axios.post(BASE_URL, {
      url,
      data_extraction_goal,
      proxy_location: 'RESIDENTIAL',
      extracted_information_schema
    }, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error initiating extract links task:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/initiate-evaluation-task', async (req, res) => {
  const { url, evaluation_criteria } = req.body;

  const data_extraction_goal = `Evaluate the website based on the following criteria: ${evaluation_criteria.join(', ')}.`;

  const extracted_information_schema = {
    type: "object",
    properties: {
      compliance: { type: "boolean" },
      issues: { type: "array", items: { type: "string" } }
    },
    required: ["compliance", "issues"]
  };

  try {
    const response = await axios.post(BASE_URL, {
      url,
      data_extraction_goal,
      proxy_location: 'RESIDENTIAL',
      extracted_information_schema
    }, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error initiating evaluation task:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/task-status/:taskId', async (req, res) => {
  const { taskId } = req.params;
  try {
    const response = await axios.get(`${BASE_URL}/${taskId}`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error checking task status:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});