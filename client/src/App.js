import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUpForm from './components/SignUpForm';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import OTPVerification from './components/OTPVerification';
import CreatePassword from './components/CreatePassword';
import TaskManager from './components/TaskManager';
import TaskDashboard from './components/TaskDashboard';
import TaskDescription from './components/TaskDescription'; 
import HrDashboard from './components/HrDashboard';



function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          
          <Route path="/register" element={<SignUpForm />} />
          <Route path="/" element={<Login />} />
          <Route path="/ForgotPassword" element={<ForgotPassword />} />
          <Route path="/OTPVerification" element={<OTPVerification />} />
          <Route path="/CreatePassword" element={<CreatePassword />} />
          <Route path="/TaskManager" element={<TaskManager />} />
          <Route path="/TaskDashboard" element={<TaskDashboard />} />
          <Route path="/TaskDescription" element={<TaskDescription />} />
          <Route path="/HrDashboard" element={<HrDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;