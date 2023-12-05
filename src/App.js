// @ts-check
import React, { useEffect, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// userdef utils
import { APP_CONTEXT, FLOWS, fetchItem } from 'utils/state';
import { addFieldsToNodes, deepCopy, mapFieldNames } from 'utils/common';

// userdef UI components
import Content from './components/composed/Content.jsx';
import Header from './components/composed/Header.jsx';
import { parse_curl } from 'curl-parser';
import { DEFAULT_CURL } from 'utils/constants.js';

function App() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const [flows, setFlows] = useRecoilState(FLOWS);
  /**
   * Usecase - fetch app_context from localStorage and merge with default state
   * Trigger - on every mount
   */
  let firstLoad = false;
  useEffect(() => {
    if (!firstLoad) {
      // Try to fetch from localStorage
      let context = fetchItem('app_context');
      context = typeof context === 'object' ? context : appContext;
      if (typeof appContext === 'object') {
        console.info('Found app_context in localStorage, updating app state');
      }
      setAppContext(context);
      loadContext(context.selectedFlow);
      firstLoad = true;
    }
  }, []);

  // Store flow details
  const loadContext = (newFlow, updates = {}) => {
    // Store current values in flows
    setFlows({
      ...flows,
      [appContext.selectedFlow]: {
        curlCommand: appContext.curlCommand,
        curlRequest: appContext.curlRequest,
        requestFields: appContext.requestFields,
        requestHeaderFields: appContext.requestHeaderFields,
        responseFields: appContext.responseFields,
        hsResponseFields: appContext.hsResponseFields,
        status: appContext.status,
      },
    });

    debugger;

    // Load appContext with persisted values
    const appContextUpdates = deepCopy(appContext);
    appContextUpdates.selectedFlow = newFlow;
    if (flows[newFlow]) {
      appContextUpdates.curlCommand = flows[newFlow].curlCommand;
      appContextUpdates.curlRequest = flows[newFlow].curlRequest;
      appContextUpdates.requestFields = flows[newFlow].requestFields;
      appContextUpdates.requestHeaderFields =
        flows[newFlow].requestHeaderFields;
      appContextUpdates.responseFields = flows[newFlow].responseFields;
      appContextUpdates.hsResponseFields = flows[newFlow].hsResponseFields;
      appContextUpdates.status = flows[newFlow].status;
    } else {
      appContextUpdates.curlCommand = '';
      appContextUpdates.curlRequest = null;
      appContextUpdates.requestFields = { value: null, mapping: null };
      appContextUpdates.requestHeaderFields = { value: null, mapping: null };
      appContextUpdates.responseFields = { value: null, mapping: null };
      appContextUpdates.hsResponseFields = {
        value: {
          status: '',
          response: {
            resource_id: '',
          },
        },
        mapping: null,
      };
      appContextUpdates.status = { value: null, mapping: null };
    }

    const curl =
      appContextUpdates.curlCommand || DEFAULT_CURL[newFlow.toLowerCase()];
    if (curl && !appContextUpdates.curlRequest) {
      const curlRequest = parse_curl(
        curl
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
      appContextUpdates.curlCommand = curl;
      appContextUpdates.curlRequest = curlRequest;
      appContextUpdates.requestFields = {
        value: requestFields,
        mapping: addFieldsToNodes(mapFieldNames(requestFields)),
      };
      appContextUpdates.requestHeaderFields = {
        value: requestHeaderFields,
        mapping: addFieldsToNodes(mapFieldNames(requestHeaderFields)),
      };
    }
    if (!appContextUpdates.hsResponseFields.mapping) {
      const hsResponseFields = appContextUpdates.hsResponseFields.value;
      appContextUpdates.hsResponseFields = {
        value: hsResponseFields,
        mapping: addFieldsToNodes(mapFieldNames(hsResponseFields)),
      };
    }
    console.warn(newFlow, flows);
    console.warn('DEBUG LOADING', {
      ...appContextUpdates,
      ...updates,
    });
    console.warn('DEBUG STORING', {
      [appContext.selectedFlow]: {
        curlCommand: appContext.curlCommand,
        curlRequest: appContext.curlRequest,
        requestFields: appContext.requestFields,
        requestHeaderFields: appContext.requestHeaderFields,
        responseFields: appContext.responseFields,
        hsResponseFields: appContext.hsResponseFields,
        status: appContext.status,
      },
    });
    setAppContext({
      ...appContextUpdates,
      ...updates,
    });
  };

  return (
    <Router>
      <Header loadContext={loadContext} />
      <Routes>
        <Route path="*" element={<Content loadContext={loadContext} />} />
      </Routes>
    </Router>
  );
}

export default App;
