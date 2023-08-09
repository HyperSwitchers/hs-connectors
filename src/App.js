import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


import CurlRequestExecutor from './components/CurlRequestExtractor';
import Sidebar from 'components/Sidebar';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<>
        {/* <Sidebar connectors={[{
          connector_name: 'stripe',
          enabled: ['Authorize', 'Void'],
          "PaymentMethodToken": { "asd": "asd" },
          "AccessTokenAuth": { "asd": "asd" },
          // ... other connectors
        }]} /> */}

          <CurlRequestExecutor /></>
        } />
      </Routes>
    </Router>
  );
}

export default App;
