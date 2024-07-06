import React, { useState, useEffect } from 'react';
import { db } from './firestoreConfig';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth } from './firebaseConfig';

function TaskHistory() {
  const [taskHistory, setTaskHistory] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      fetchTaskHistory();
    }
  }, [user]);

  const fetchTaskHistory = async () => {
    try {
      const q = query(collection(db, "taskHistory"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTaskHistory(history);
    } catch (error) {
      console.error("Error fetching task history:", error);
    }
  };

  const deleteTaskFromHistory = async (taskId) => {
    try {
      await deleteDoc(doc(db, "taskHistory", taskId));
      fetchTaskHistory();
    } catch (error) {
      console.error("Error deleting task from history:", error);
    }
  };

  return (
    <div className="task-history">
      <h2>Task History</h2>
      {taskHistory.map(task => (
        <div key={task.id} className="task-card">
          <h3>{task.url}</h3>
          <p>Timestamp: {new Date(task.timestamp.seconds * 1000).toLocaleString()}</p>
          <p>Has Widget: {task.has_widget ? 'Yes' : 'No'}</p>
          <p>Reasoning: {task.reasoning}</p>
          
          {task.evaluations && task.evaluations.map((evaluation, evalIndex) => (
            <div key={evalIndex} className="evaluation-card">
              <h4>Evaluation {evalIndex + 1}</h4>
              <p>Timestamp: {new Date(evaluation.timestamp.seconds * 1000).toLocaleString()}</p>
              <div className="criteria-list">
                <h5>Evaluation Criteria:</h5>
                <ul>
                  {evaluation.criteria.map((criterion, index) => (
                    <li key={index}>{criterion}</li>
                  ))}
                </ul>
              </div>
              
              {evaluation.results.map((result, resultIndex) => (
                <div key={resultIndex} className="result-card">
                  <h5>Link: {result.url}</h5>
                  <p>Compliance: {result.result.compliance ? 'Yes' : 'No'}</p>
                  <div className="passed-list">
                    <h6>Passed:</h6>
                    <ul>
                      {result.result.passed.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="issues-list">
                    <h6>Issues:</h6>
                    <ul>
                      {result.result.issues.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ))}
          
          <button onClick={() => deleteTaskFromHistory(task.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default TaskHistory;