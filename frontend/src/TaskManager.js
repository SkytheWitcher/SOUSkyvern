import React, { useState } from 'react';
import axios from 'axios';
import { db } from './firestoreConfig';
import { collection, addDoc, doc } from 'firebase/firestore';
import { updateDoc, arrayUnion } from 'firebase/firestore';  // Add this line
import { auth } from './firebaseConfig';
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
    'Check the availability of British Sign Language (BSL) tours.'
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
  const user = auth.currentUser;
  const [currentTaskId, setCurrentTaskId] = useState(null);

  const saveTaskToHistory = async (task) => {
    try {
      const docRef = await addDoc(collection(db, "taskHistory"), { ...task, userId: user.uid });
      return docRef.id;
    } catch (error) {
      console.error("Error saving task to history:", error);
    }
  };

  const updateTaskHistory = async (taskId, evaluation) => {
    try {
      const taskRef = doc(db, "taskHistory", taskId);
      await updateDoc(taskRef, {
        evaluations: arrayUnion(evaluation)
      });
    } catch (error) {
      console.error("Error updating task history:", error);
    }
  };

  const pollTaskStatus = async (task_id) => {
    let status = 'queued';
    let result = null;
    while (status === 'queued' || status === 'running') {
      try {
        const response = await axios.get(`http://localhost:3000/task-status/${task_id}`);
        result = response.data;
        status = result.status;
        if (status === 'complete') {
          return result;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error checking task status:', error);
        break;
      }
    }
    return result;
  };

  const filterLinks = (links) => {
    const uniqueLinks = [...new Set(links)];
    return uniqueLinks.filter(link => {
      const phoneRegex = /^tel:/;
      const emailRegex = /^mailto:/;
      const socialMediaRegex = /facebook\.com|instagram\.com|twitter\.com|youtube\.com|flickr\.com|foursquare\.com/;
      const imageFileRegex = /\.(png|jpe?g|gif|bmp|svg)$/i;
      return !(phoneRegex.test(link) || emailRegex.test(link) || socialMediaRegex.test(link) || imageFileRegex.test(link));
    });
  };

  const initiateCheckAndExtractTask = async () => {
    setLoading(true);
    try {
      console.log('Initiating check and extract task...');
      const response = await axios.post('http://localhost:3000/initiate-check-and-extract-task', { url });
      const { task_id } = response.data;

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

      const task = { url, has_widget, reasoning, links: filteredLinks, timestamp: new Date(), evaluations: [] };
    const taskId = await saveTaskToHistory(task);
    setCurrentTaskId(taskId); // Set the current task ID
    return taskId;

  } catch (error) {
    console.error('Error initiating check and extract task:', error);
    setLoading(false);
  }
};

const initiateEvaluationTasks = async (criteria) => {
  setLoading(true);
  const batchSize = 5;
  console.log(`Total links to evaluate: ${extractedLinks.length}`);
  console.log(`Batch size: ${batchSize}`);
  const batches = [];

  for (let i = 0; i < extractedLinks.length; i += batchSize) {
    const batch = extractedLinks.slice(i, i + batchSize);
    batches.push(batch);
  }

  try {
    if (!currentTaskId) {
      throw new Error('No task ID found. Please check a website first.');
    }
    await Promise.all(batches.map(batch => initiateEvaluationTaskBatch(batch, criteria, currentTaskId)));
  } catch (error) {
    console.error('Error processing batches:', error);
    alert(error.message);
  }

  setLoading(false);
};

  const initiateEvaluationTaskBatch = async (links, criteria, taskId) => {
    try {
      console.log(`Initiating evaluation task batch for links: ${links.join(', ')}`);
      const response = await axios.post('http://localhost:3000/initiate-evaluation-task-batch', {
        urls: links,
        evaluation_criteria: criteria
      });
      const batchResponses = response.data.batchResponses;

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

      const evaluation = {
        criteria,
        results: batchResults,
        timestamp: new Date()
      };
      await updateTaskHistory(taskId, evaluation);
    } catch (error) {
      console.error('Error initiating evaluation task batch:', error);
    }
  };

  const handleIgnoreLink = (link) => {
    setExtractedLinks(prevLinks => prevLinks.filter(l => l !== link));
  };

  return (
    <div>
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
            {loading ? 'Evaluating...' : 'Evaluate Autistic Customers'}
          </button>
          <button onClick={() => initiateEvaluationTasks(tasks.customersWithDementia)} disabled={loading}>
            {loading ? 'Evaluating...' : 'Evaluate Customers with Dementia'}
          </button>
          <button onClick={() => initiateEvaluationTasks(tasks.digitalAccessibility)} disabled={loading}>
            {loading ? 'Evaluating...' : 'Evaluate Digital Accessibility'}
          </button>
        </div>
      )}

      <div>
        <h2>Extracted Links</h2>
        {extractedLinks.map((link, index) => (
          <div key={index}>
            {link}
            <button onClick={() => handleIgnoreLink(link)}>Ignore</button>
          </div>
        ))}
      </div>

      {Object.keys(taskResults).length > 0 && (
        <div>
          <h2>Task Results</h2>
          {Object.keys(taskResults).map((link, index) => {
            const result = taskResults[link];
            if (!result) return null;
            const issues = result.issues || [];
            const passed = result.passed || [];
            return (
              <div key={index}>
                <p>Link: {link}</p>
                <p>Compliance: {result.compliance ? 'Yes' : 'No'}</p>
                <p>Passed: {passed.join(' ')}</p>
                <p>Issues: {issues.join(' ')}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TaskManager;
