import React from 'react';
import { useStore } from './store/useStore';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';

function App() {
  const isLoggedIn = useStore(state => state.isLoggedIn);

  return isLoggedIn ? <Dashboard /> : <Login />;
}

export default App;