import React, { useState } from 'react';
import TaskManager from './TaskManager';
import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetInput, setShowResetInput] = useState(false);

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-not-found':
        return 'No user found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'Email is already in use.';
      case 'auth/weak-password':
        return 'Password is too weak.';
      case 'auth/invalid-credential':
        return 'Account not found. Please register or try again.';
      default:
        return 'An unknown error occurred.';
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err.code));
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err.code));
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
  };

  const handleForgotPassword = async () => {
    if (showResetInput && resetEmail) {
      try {
        await sendPasswordResetEmail(auth, resetEmail);
        setError('Password reset email sent.');
        setShowResetInput(false); // Hide the input after sending the reset email
        setResetEmail(''); // Clear the input field
      } catch (err) {
        setError(getErrorMessage(err.code));
      }
    } else {
      setShowResetInput(true);
    }
  };

  return (
    <div className="App">
      <h1>SOUSkyvern WCAG Evaluator</h1>
      {user ? (
        <div>
          <h1>Welcome, {user.email}</h1>
          <button onClick={handleLogout}>Logout</button>
          <TaskManager />
        </div>
      ) : (
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleRegister}>Register</button>
          <button onClick={handleForgotPassword}>
            {showResetInput ? 'Send Reset Email' : 'Forgot Password'}
          </button>
          {showResetInput && (
            <input 
              type="email" 
              placeholder="Enter email for password reset" 
              value={resetEmail} 
              onChange={(e) => setResetEmail(e.target.value)} 
            />
          )}
          {error && <p>{error}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
