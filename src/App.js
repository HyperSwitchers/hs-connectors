import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';

import CurlRequestExecutor from './components/CurlRequestExtractor';
import ConnectorTemplates from 'components/ConnectorTemplates';

function App() {
  return (
    <div className="App">
      <CurlRequestExecutor></CurlRequestExecutor>
      <ConnectorTemplates></ConnectorTemplates>
    </div>
  );
}

export default App;
