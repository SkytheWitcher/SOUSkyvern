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

app.post('/initiate-check-and-extract-task', async (req, res) => {
  const { url } = req.body;

  const data_extraction_goal = `
    Check if an accessibility widget exists on the homepage by identifying common accessibility widget elements or their distinctive features.
    If there is no clear and immediate indication of an accessibility widget upon entering the site, extract all of the links available on the homepage.
  `;

  const extracted_information_schema = {
    type: "object",
    properties: {
      has_widget: { type: "boolean" },
      reasoning: { type: "string" },
      links: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["has_widget", "reasoning"]
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

    res.json({ task_id: response.data.task_id });
  } catch (error) {
    console.error('Error initiating check and extract task:', error.message);
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

app.post('/initiate-evaluation-task-batch', async (req, res) => {
  const { urls, evaluation_criteria } = req.body;

  const data_extraction_goal = `Evaluate the website based on the following criteria: ${evaluation_criteria.join(', ')}.`;

  const extracted_information_schema = {
    type: "object",
    properties: {
      compliance: { type: "boolean" },
      issues: { type: "array", items: { type: "string" } },
      passed: { type: "array", items: { type: "string" } }
    },
    required: ["compliance", "issues", "passed"]
  };

  try {
    const batchResponses = await Promise.all(urls.map(async (url) => {
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
      return { url, task_id: response.data.task_id };
    }));

    res.json({ batchResponses });
  } catch (error) {
    console.error('Error initiating evaluation task batch:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});