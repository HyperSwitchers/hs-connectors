// @ts-check
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// userdef utils
import { APP_CONTEXT, FLOWS, fetchItem } from 'utils/state';
import { addFieldsToNodes, mapFieldNames } from 'utils/common';

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
  useEffect(() => {
    // Try to fetch from localStorage
    let context = fetchItem('app_context');
    context = typeof context === 'object' ? context : appContext;
    if (typeof appContext === 'object') {
      console.info('Found app_context in localStorage, updating app state');
    }

    setAppContext(context);
    loadContext(context.selectedFlow);
  }, []);

  // Store flow details
  const loadContext = (newFlow) => {
    debugger;
    // Store current values in flows
    const flowsUpdates = {
      [appContext.connectorName]: {
        ...(flows[appContext.connectorName] || {}),
        [appContext.selectedFlow]: {
          curlCommand: appContext.curlCommand,
          curlRequest: appContext.curlRequest,
          requestFields: appContext.requestFields,
          requestHeaderFields: appContext.requestHeaderFields,
          responseFields: appContext.responseFields,
          hsResponseFields: appContext.hsResponseFields,
          status: appContext.status,
        },
      },
    };
    setFlows({
      ...flows,
      ...flowsUpdates,
    });

    // Load appContext with persisted values
    const appContextUpdates = {
      selectedFlow: newFlow,
    };
    if (
      flows[appContext.connectorName] &&
      flows[appContext.connectorName][newFlow]
    ) {
      appContextUpdates.curlCommand =
        flows[appContext.connectorName][newFlow].curlCommand;
      appContextUpdates.curlRequest =
        flows[appContext.connectorName][newFlow].curlRequest;
      appContextUpdates.requestFields =
        flows[appContext.connectorName][newFlow].requestFields;
      appContextUpdates.requestHeaderFields =
        flows[appContext.connectorName][newFlow].requestHeaderFields;
      appContextUpdates.responseFields =
        flows[appContext.connectorName][newFlow].responseFields;
      appContextUpdates.hsResponseFields =
        flows[appContext.connectorName][newFlow].hsResponseFields;
      appContextUpdates.status =
        flows[appContext.connectorName][newFlow].status;
    }

    const curl = appContext.curlCommand || DEFAULT_CURL[newFlow.toLowerCase()];
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
      const hsResponseFields = appContext.hsResponseFields.value;
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
      appContextUpdates.hsResponseFields = {
        value: hsResponseFields,
        mapping: addFieldsToNodes(mapFieldNames(hsResponseFields)),
      };
    }

    setAppContext({
      ...appContext,
      ...appContextUpdates,
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
