import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';

import CurlRequestExecutor from './components/CurlRequestExtractor';

function App() {
  return (
    <div className="App">
      <CurlRequestExecutor></CurlRequestExecutor>
    </div>
  );
}

export default App;
