// @ts-check
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// userdef utils
import { APP_CONTEXT, fetchItem } from 'utils/state';
import {
  addFieldsToNodes,
  deepCopy,
  mapFieldNames,
  updateNestedJson,
} from 'utils/common';

// userdef UI components
import Content from './components/composed/Content.jsx';
import Header from './components/composed/Header.jsx';
import { parse_curl } from 'curl-parser';

function App() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);

  /**
   * Usecase - fetch app_context from localStorage and merge with default state
   * Trigger - on every mount
   */
  useEffect(() => {
    // Try to fetch from localStorage
    let context = fetchItem('app_context');
    context = typeof context === 'object' ? context : appContext;
    if (typeof appContext === 'object') {
      console.info('Found app_context in localStorage, updating app state');
    }

    // Initialize
    const updatedFlows = deepCopy(context.flows);
    Object.keys(context.flows).map((flow) => {
      if (context.flows[flow].curlCommand !== '') {
        const curlRequest = parse_curl(
          context.flows[flow].curlCommand
            .replace(/\s*\\\s*/g, ' ')
            .replace(/\n/g, '')
            .replace(/--data-raw|--data-urlencode/g, '-d')
        );
        const requestHeaderFields = curlRequest?.headers.reduce(
          (result, item) => {
            let header = item.split(':');
            result[header[0]] = header[1].trim();
            return result;
          },
          {}
        );
        const requestFields = JSON.parse(curlRequest?.data?.ascii || '{}');
        const hsResponseFields = updatedFlows[flow].hsResponseFields.value;
        updatedFlows[flow].curlRequest = curlRequest;
        updatedFlows[flow].requestFields = {
          value: requestFields,
          mapping: addFieldsToNodes(mapFieldNames(requestFields)),
        };
        updatedFlows[flow].requestHeaderFields = {
          value: requestHeaderFields,
          mapping: addFieldsToNodes(mapFieldNames(requestHeaderFields)),
        };
        updatedFlows[flow].hsResponseFields = {
          value: hsResponseFields,
          mapping: addFieldsToNodes(mapFieldNames(hsResponseFields)),
        };
      }
    });
    setAppContext({ ...context, flows: { ...context.flows, ...updatedFlows } });
  }, []);

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
