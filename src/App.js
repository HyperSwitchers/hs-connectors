// @ts-check
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// userdef utils
import { APP_CONTEXT, fetchItem } from 'utils/state';
import { updateNestedJson } from 'utils/common';

// userdef UI components
import Content from './components/composed/Content.jsx';
import Header from './components/composed/Header.jsx';

function App() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);

  /**
   * Usecase - fetch app_context from localStorage and merge with default state
   * Trigger - on every mount
   */
  useEffect(() => {
    const appContext = fetchItem('app_context');
    if (typeof appContext === 'object') {
      console.info('Found app_context in localStorage, updating app state');
      setAppContext(appContext);
    }
  }, []);

  const updateAppContextUsingPath = (path, update) => {
    let updatedAppContext = updateNestedJson(
      appContext,
      path.split('.'),
      update
    );
    setAppContext(updatedAppContext);
  };

  const updateAppContext = (updates) => {
    const updatedAppContext = {
      ...appContext,
      ...updates,
    };
    setAppContext(updatedAppContext);
  };

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="*" element={<Content />} />
      </Routes>
    </Router>
  );
}

export default App;
