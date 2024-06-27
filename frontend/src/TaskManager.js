import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const tasks = {
  mobilityImpairments: [
    'Specify areas with level access.',
    'Specify areas without level access.',
    'Detail wheelchair-accessible routes.',
    'Identify inclusive dwell spaces.',
    'List the number and location of accessible toilets.',
    'Provide information on the nearest Changing Places facility.',
    'Describe any wheelchair-accessible viewing platforms for events.',
    'Provide information on wheelchairs, scooters, or tramper hire and charging points.'
  ],
  blindOrPartiallySighted: [
    'Check the availability of audio tours or guides.',
    'Check the availability of large print documentation.',
    'Check the availability of Braille documentation.',
    'Check the availability of tactile maps and signage.',
    'Describe the visual contrast available around the site.',
    'Check the availability of touch tours or tactile objects.',
    'Identify facilities for aid dogs, including water and relief areas.'
  ],
  deafOrHearingLoss: [
    'Check the availability and locations of hearing loops.',
    'Check the provision of captions on videos and TV screens.',
    'Check the availability of flashing, visual fire alarms or pagers.',
    'Check the availability of American Sign Language (ASL) tours.'
  ],
  autisticCustomers: [
    'Check the availability of fast-track queue opportunities.',
    'Check the availability of quiet spaces and/or sensory rooms.',
    'Provide information on quieter times to visit.',
    'Check the availability of sensory stories and maps.',
    'Check the availability of sensory equipment like ear defenders, fidget spinners, and weighted blankets.',
    'Check the availability and booking process for familiarization visits.'
  ],
  customersWithDementia: [
    'Check the availability of dementia-friendly sessions.',
    'Check for dementia-friendly facilities such as inclusive signage and accessible toilets.',
    'Check for products like ‘easy hold’ cutlery.',
    'Verify specific awareness training for staff relating to dementia.'
  ],
  digitalAccessibility: [
    'Verify the availability of transcripts and captions on audio content.',
    'Ensure content is clear, concise, and in plain language.',
    'Ensure content is broken up with sub-headings.',
    'Verify alternative contact methods like email or online text-based chat.',
    'Ensure compatibility with ergonomic or specialized hardware and software.',
    'Check if the website is designed for use with mouse, speech, or keyboard only.',
    'Provide visual indicators of current focus.',
    'Verify customization options for text size, fonts, colors, contrast levels, and spacing.',
    'Ensure alt text for images and transcripts or audio descriptions for videos.',
    'Check for a linear, logical layout.',
    'Ensure keyboard-only navigation.',
    'Verify the use of descriptive links instead of ‘click here’.',
    'Ensure content does not auto-play unless the user expects it.',
    'Use simple, muted colors.',
    'Ensure text is left-aligned.',
    'Use bullet points and clear, consistent labels.'
  ]
};

function TaskManager() {
  const [url, setUrl] = useState('');
  const [extractedLinks, setExtractedLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [taskResults, setTaskResults] = useState({});

  const initiateCheckAndExtractTask = async () => {
    setLoading(true);
    try {
      console.log('Initiating check and extract task...');
      const response = await axios.post('http://localhost:3000/initiate-check-and-extract-task', { url });
      const { task_id } = response.data;

      // Poll for task completion
      const taskStatus = await pollTaskStatus(task_id);
      const { has_widget, reasoning, links } = taskStatus.extracted_information;

      const filteredLinks = filterLinks(links);

      setExtractedLinks(filteredLinks || []);
      setLoading(false);

      if (!has_widget) {
        alert('No accessibility widget found.');
      } else {
        alert('Accessibility widget found!');
      }
    } catch (error) {
      console.error('Error initiating check and extract task:', error);
      setLoading(false);
    }
  };

  const pollTaskStatus = async (task_id) => {
    let status = 'queued';
    let result = null;

    while (status === 'queued' || status === 'running') {
      try {
        console.log(`Polling task status for task ID: ${task_id}`);
        const response = await axios.get(`http://localhost:3000/task-status/${task_id}`);
        result = response.data;
        status = result.status;

        if (status === 'complete') {
          console.log(`Task ID: ${task_id} completed.`);
          return result;
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // wait for 2 seconds before polling again
      } catch (error) {
        console.error('Error checking task status:', error);
        break;
      }
    }

    return result;
  };

  const isIgnoredLink = (link) => {
    const phoneRegex = /^tel:/;
    const emailRegex = /^mailto:/;
    const socialMediaRegex = /facebook\.com|instagram\.com|twitter\.com|youtube\.com|flickr\.com|foursquare\.com/;
    const imageFileRegex = /\.(png|jpe?g|gif|bmp|svg)$/i;
    return phoneRegex.test(link) || emailRegex.test(link) || socialMediaRegex.test(link) || imageFileRegex.test(link);
  };

  const filterLinks = (links) => {
    const uniqueLinks = [...new Set(links)];
    return uniqueLinks.filter(link => !isIgnoredLink(link));
  };

  const handleIgnoreLink = (link) => {
    setExtractedLinks(prevLinks => prevLinks.filter(l => l !== link));
  };

  const initiateEvaluationTaskBatch = async (links, criteria) => {
    try {
      console.log(`Initiating evaluation task batch for links: ${links.join(', ')}`);
      const response = await axios.post('http://localhost:3000/initiate-evaluation-task-batch', {
        urls: links,
        evaluation_criteria: criteria
      });
      const batchResponses = response.data.batchResponses;

      // Poll for task completion
      const batchResults = await Promise.all(batchResponses.map(async ({ url, task_id }) => {
        const taskStatus = await pollTaskStatus(task_id);
        const result = taskStatus.extracted_information;
        return { url, result };
      }));

      const results = batchResults.reduce((acc, { url, result }) => {
        acc[url] = result;
        return acc;
      }, {});

      setTaskResults(prevResults => ({
        ...prevResults,
        ...results
      }));
    } catch (error) {
      console.error('Error initiating evaluation task batch:', error);
    }
  };

  const initiateEvaluationTasks = async (criteria) => {
    setLoading(true);
    const batchSize = 5; // Number of links to evaluate in each batch
    console.log(`Total links to evaluate: ${extractedLinks.length}`);
    console.log(`Batch size: ${batchSize}`);
    const batches = [];

    for (let i = 0; i < extractedLinks.length; i += batchSize) {
      const batch = extractedLinks.slice(i, i + batchSize);
      batches.push(batch);
    }

    try {
      await Promise.all(batches.map(batch => initiateEvaluationTaskBatch(batch, criteria)));
    } catch (error) {
      console.error('Error processing batches:', error);
    }

    setLoading(false);
  };

  return (
    <div className="App">
      <h1>SOU-Skyvern WCAG Criteria Checker</h1>
      <input
        type="text"
        placeholder="Enter website URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={initiateCheckAndExtractTask} disabled={loading}>
        {loading ? 'Checking...' : 'Check Website'}
      </button>
      {extractedLinks.length > 0 && (
        <div>
          <div className="task-buttons">
            <h2>Evaluate Sections</h2>
            <button onClick={() => initiateEvaluationTasks(tasks.mobilityImpairments)} disabled={loading}>
              {loading ? 'Evaluating...' : 'Evaluate Mobility Impairments'}
            </button>
            <button onClick={() => initiateEvaluationTasks(tasks.blindOrPartiallySighted)} disabled={loading}>
              {loading ? 'Evaluating...' : 'Evaluate Blind or Partially Sighted'}
            </button>
            <button onClick={() => initiateEvaluationTasks(tasks.deafOrHearingLoss)} disabled={loading}>
              {loading ? 'Evaluating...' : 'Evaluate Deaf or Hearing Loss'}
            </button>
            <button onClick={() => initiateEvaluationTasks(tasks.autisticCustomers)} disabled={loading}>
              {loading ? 'Evaluating...' : 'Evaluate Customers with Autism'}
            </button>
            <button onClick={() => initiateEvaluationTasks(tasks.customersWithDementia)} disabled={loading}>
              {loading ? 'Evaluating...' : 'Evaluate Customers with Dementia'}
            </button>
            <button onClick={() => initiateEvaluationTasks(tasks.digitalAccessibility)} disabled={loading}>
              {loading ? 'Evaluating...' : 'Evaluate Digital Accessibility'}
            </button>
          </div>
          <div>
            <h2>Extracted Links</h2>
            <ul>
              {extractedLinks.map((link, index) => (
                <li key={index}>
                  {link}
                  <button onClick={() => handleIgnoreLink(link)}>Ignore</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {Object.keys(taskResults).length > 0 && (
        <div className="results">
          <h2>Task Results</h2>
          <ul>
            {Object.keys(taskResults).map((link, index) => {
              const result = taskResults[link];
              if (!result) return null;
              const issues = result.issues || [];
              const passed = result.passed || [];
              return (
                <li key={index}>
                  <p><strong>{link}</strong></p>
                  <p>Compliance: {result.compliance ? 'Yes' : 'No'}</p>
                  <p>Passed: {passed.join(' ')}</p>
                  <p>Issues: {issues.join(' ')}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TaskManager;