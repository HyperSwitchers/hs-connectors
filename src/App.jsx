// @ts-check

import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// userdef UI components
import ContentNew from './components/composed/ContentNew';
import HeaderNew from './components/composed/HeaderNew';
import { APP_CONTEXT, FLOWS } from './utils/state';
import { fetchItem, storeItem } from './utils/common';
import {
  DEFAULT_APP_CONTEXT,
  DEFAULT_CURL,
  DEFAULT_FLOW,
  DESCRIPTION,
} from './utils/constants';
import { parse_curl } from 'curl-parser';

export default function App() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const [flows, setFlows] = useRecoilState(FLOWS);

  const [bootComplete, setBootComplete] = useState(false);
  const [flow, setFlow] = useState(appContext.selectedFlow);

  // Load app's context on boot
  useEffect(() => {
    const flows = fetchItem('flows');
    if (flows) {
      setFlows(flows);
      if (flows[DEFAULT_FLOW]) {
        setAppContext(flows[DEFAULT_FLOW]);
      }
      console.info('INFO', 'Boot completed');
    }

    setBootComplete(true);
  }, []);

  // Store flows context in localStorage
  useEffect(() => {
    if (bootComplete) {
      storeItem('flows', JSON.stringify(flows));
    }
  }, [flows]);

  // Swap app's context on flow change
  useEffect(() => {
    const newFlow = appContext.selectedFlow,
      prevFlow = flow;
    if (newFlow !== prevFlow) {
      const prevFlowData = { [prevFlow]: flows[prevFlow] },
        updatedFlowData = {
          [prevFlow]: { ...appContext, selectedFlow: prevFlow },
        };
      if (JSON.stringify(prevFlowData) !== JSON.stringify(updatedFlowData)) {
        setFlows((prevState) => ({
          ...prevState,
          ...updatedFlowData,
        }));
      }
      if (flows[newFlow]) {
        setAppContext(flows[newFlow]);
      } else {
        setAppContext({
          ...DEFAULT_APP_CONTEXT,
          connectorName: appContext.connectorName,
          connectorPascalCase: appContext.connectorPascalCase,
          curlCommand: DEFAULT_CURL[newFlow.toLowerCase()] || '',
          currencyUnit: appContext.currencyUnit,
          currencyUnitType: appContext.currencyUnitType,
          paymentMethodType: appContext.paymentMethodType,
          selectedFlow: newFlow,
          codeInvalidated: appContext.codeInvalidated,
          downloadInvalidated: appContext.downloadInvalidated,
          loading: appContext.loading,
          description: DESCRIPTION[newFlow.toLowerCase()],
        });
      }
      setFlow(newFlow);
    }
  }, [appContext.selectedFlow]);

  useEffect(() => {
    const prevResponseFields = flows[appContext.selectedFlow]?.responseFields,
      responseFields = appContext.responseFields;
    if (
      responseFields &&
      JSON.stringify(prevResponseFields) !== JSON.stringify(responseFields)
    ) {
      setFlows((prevState) => ({
        ...prevState,
        [appContext.selectedFlow]: appContext,
      }));
    }
  }, [appContext.responseFields]);

  return (
    <Router>
      <div className="app">
        <HeaderNew />
        <Routes>
          <Route path="*" element={<ContentNew />} />
        </Routes>
      </div>
    </Router>
  );
}
