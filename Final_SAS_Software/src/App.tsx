import React from 'react';
import { useStore } from './store/useStore';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

function App() {
  // Use this part if you need to check if the user is logged in
  // const isLoggedIn = useStore(state => state.isLoggedIn);

  return (
    <div>
      <Toaster />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

export default App;
