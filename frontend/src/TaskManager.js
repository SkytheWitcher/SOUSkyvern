import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function TaskManager() {
  const [url, setUrl] = useState('');
  const [evaluationCriteria, setEvaluationCriteria] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskResult, setTaskResult] = useState(null);
  const [extractedLinks, setExtractedLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusChecking, setStatusChecking] = useState(false);

  const initiateWidgetCheckTask = async () => {
    setLoading(true);
    try {
      console.log('Initiating widget check task...');
      const response = await axios.post('http://localhost:3000/initiate-widget-check-task', { url });
      console.log('Widget check task initiated:', response.data);
      setTaskId(response.data.task_id);
      setLoading(false);
      setStatusChecking(true);
    } catch (error) {
      console.error('Error initiating widget check task:', error);
      setLoading(false);
    }
  };

  const initiateExtractLinksTask = async () => {
    setLoading(true);
    try {
      console.log('Initiating extract links task...');
      const response = await axios.post('http://localhost:3000/initiate-extract-links-task', { url });
      console.log('Extract links task initiated:', response.data);
      setTaskId(response.data.task_id);
      setLoading(false);
      setStatusChecking(true);
    } catch (error) {
      console.error('Error initiating extract links task:', error);
      setLoading(false);
    }
  };

  const initiateEvaluationTask = async (link) => {
    setLoading(true);
    try {
      console.log('Initiating evaluation task for link:', link);
      const response = await axios.post('http://localhost:3000/initiate-evaluation-task', { url: link, evaluation_criteria: evaluationCriteria.split('\n') });
      console.log('Evaluation task initiated:', response.data);
      setTaskId(response.data.task_id);
      setLoading(false);
      setStatusChecking(true);
    } catch (error) {
      console.error('Error initiating evaluation task:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (statusChecking && taskId) {
      const interval = setInterval(async () => {
        try {
          console.log('Checking task status for task ID:', taskId);
          const response = await axios.get(`http://localhost:3000/task-status/${taskId}`);
          console.log('Task status response:', response.data);
          setTaskResult(response.data);
          if (response.data.status !== 'queued' && response.data.status !== 'running') {
            setStatusChecking(false);
            clearInterval(interval);

            // Handle the result of the widget check task
            if (response.data.extracted_information && response.data.extracted_information.has_widget) {
              alert("Accessibility widget found. No further checks needed.");
              setExtractedLinks([]);  // Clear any extracted links
            } else if (response.data.extracted_information && response.data.extracted_information.links) {
              setExtractedLinks(response.data.extracted_information.links);
            }
          }
        } catch (error) {
          console.error('Error checking task status:', error);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [statusChecking, taskId]);

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
      <button onClick={initiateWidgetCheckTask} disabled={loading}>
        {loading ? 'Checking Widget...' : 'Check Widget'}
      </button>
      {taskId && (
        <div>
          <h2>Task ID: {taskId}</h2>
        </div>
      )}
      {taskResult && (
        <div>
          <h2>Task Result</h2>
          <pre>{JSON.stringify(taskResult, null, 2)}</pre>
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
                  {loading ? 'Checking...' : 'Evaluate'}
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