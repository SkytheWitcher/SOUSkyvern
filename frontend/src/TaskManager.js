import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function TaskManager() {
  const [url, setUrl] = useState('');
  const [evaluationCriteria, setEvaluationCriteria] = useState('');
  const [taskResult, setTaskResult] = useState(null);
  const [extractedLinks, setExtractedLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showExtractLinksOption, setShowExtractLinksOption] = useState(false);

  const initiateCheckAndExtractTask = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/initiate-check-and-extract-task', { url });
      const { task_id } = response.data;

      // Poll for task completion
      const taskStatus = await pollTaskStatus(task_id);
      const { has_widget, reasoning, links } = taskStatus.extracted_information;

      setTaskResult({ has_widget, reasoning });
      setExtractedLinks(links || []);
      setLoading(false);

      if (!has_widget) {
        setShowExtractLinksOption(true);
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
        const response = await axios.get(`http://localhost:3000/task-status/${task_id}`);
        result = response.data;
        status = result.status;

        if (status === 'complete') {
          return result;
        }

        await new Promise(resolve => setTimeout(resolve, 5000)); // wait for 5 seconds before polling again
      } catch (error) {
        console.error('Error checking task status:', error);
        break;
      }
    }

    return result;
  };

  const initiateEvaluationTask = async (link) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/initiate-evaluation-task', {
        url: link,
        evaluation_criteria: evaluationCriteria.split('\n')
      });
      const { task_id } = response.data;

      // Poll for task completion
      const taskStatus = await pollTaskStatus(task_id);
      const { compliance, issues } = taskStatus.extracted_information;

      alert(`Evaluation Result for ${link}:\nCompliance: ${compliance}\nIssues: ${issues.join(', ')}`);
      setLoading(false);
    } catch (error) {
      console.error('Error initiating evaluation task:', error);
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>WCAG Compliance Checker</h1>
      <input
        type="text"
        placeholder="Enter website URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <textarea
        placeholder="Enter evaluation criteria"
        value={evaluationCriteria}
        onChange={(e) => setEvaluationCriteria(e.target.value)}
      />
      <button onClick={initiateCheckAndExtractTask} disabled={loading}>
        {loading ? 'Checking...' : 'Check Website'}
      </button>
      {showExtractLinksOption && (
        <div>
          <h2>No accessibility widget found. Would you like to evaluate the extracted links based on your criteria?</h2>
        </div>
      )}
      {extractedLinks.length > 0 && (
        <div>
          <h2>Extracted Links</h2>
          <ul>
            {extractedLinks.map((link, index) => (
              <li key={index}>
                {link}
                <button onClick={() => initiateEvaluationTask(link)} disabled={loading}>
                  {loading ? 'Evaluating...' : 'Evaluate'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TaskManager;