// @ts-check

import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// userdef UI components
import Content from './components/composed/Content.jsx';
import Header from './components/composed/Header.jsx';
import {
  APP_CONTEXT,
  FLOWS,
  PROP_STATE,
  TRANSFORMER_STATE,
} from './utils/state';
import {
  addFieldsToNodes,
  fetchItem,
  mapFieldNames,
  storeItem,
} from './utils/common';
import {
  DEFAULT_APP_CONTEXT,
  DEFAULT_CONNECTOR,
  DEFAULT_CURL,
  DEFAULT_FLOW,
  DEFAULT_TRANSFORMER_STATE,
  DESCRIPTION,
  defaultConnectorProps,
} from './utils/constants';

export default function App() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const [flows, setFlows] = useRecoilState(FLOWS);
  const [propState, setPropState] = useRecoilState(PROP_STATE);
  const [transformerState, setTransformerState] =
    useRecoilState(TRANSFORMER_STATE);

  const [bootComplete, setBootComplete] = useState(false);
  const [flow, setFlow] = useState(appContext.selectedFlow);

  // Load app's context on boot
  useEffect(() => {
    try {
      let storedState = fetchItem('app_context') || {};
      const flows = fetchItem('flows') || {};
      if (flows[appContext.selectedFlow || DEFAULT_FLOW]) {
        storedState = { ...appContext, ...storedState, ...flows[DEFAULT_FLOW] };
      } else {
        storedState = { ...appContext, ...storedState };
      }
      setAppContext(storedState);
      setFlows(flows);

      const propState =
        fetchItem('prop_state') ||
        defaultConnectorProps(storedState.connectorName || DEFAULT_CONNECTOR);
      const transformerState =
        fetchItem('transformer_state') || DEFAULT_TRANSFORMER_STATE;
      setPropState(propState);
      setTransformerState(transformerState);
    } catch (error) {
      console.warn('INFO', 'Failed to load from localStorage');
    }
    console.info('INFO', 'Boot completed');
    setBootComplete(true);
  }, []);

  // Store flows context in localStorage
  useEffect(() => {
    if (bootComplete) {
      storeItem('flows', JSON.stringify(flows));
    }
  }, [flows]);

  // Store state in localStorage
  useEffect(() => {
    if (bootComplete) {
      storeItem('app_context', JSON.stringify(appContext));
    }
  }, [appContext]);

  // Swap app's context on flow change
  useEffect(() => {
    const newFlow = appContext.selectedFlow,
      prevFlow = flow;
    if (newFlow !== prevFlow) {
      const prevFlowData = { [prevFlow]: flows[prevFlow] },
        updatedFlowData = {
          [prevFlow]: {
            curlCommand: appContext.curlCommand,
            curlRequest: appContext.curlRequest,
            hsResponseFields: appContext.hsResponseFields,
            requestFields: appContext.requestFields,
            requestHeaderFields: appContext.requestHeaderFields,
            responseFields: appContext.responseFields,
            status: appContext.status,
            statusVariable: appContext.statusVariable,
          },
        };
      if (JSON.stringify(prevFlowData) !== JSON.stringify(updatedFlowData)) {
        setFlows((prevState) => ({
          ...prevState,
          ...updatedFlowData,
        }));
      }
      if (flows[newFlow]) {
        setAppContext((prevState) => ({ ...prevState, ...flows[newFlow] }));
      } else {
        setAppContext({
          ...appContext,
          curlCommand: DEFAULT_CURL[newFlow.toLowerCase()] || '',
          selectedFlow: newFlow,
          description: DESCRIPTION[newFlow.toLowerCase()],
          curlRequest: null,
          hsResponseFields: {
            value: {
              status: '',
              response: {
                resource_id: '',
              },
            },
            mapping: null,
          },
          requestFields: {
            value: null,
            mapping: null,
          },
          requestHeaderFields: {
            value: null,
            mapping: null,
          },
          responseFields: {
            value: null,
            mapping: null,
          },
          status: {
            value: null,
            mapping: null,
          },
        });
      }
      setFlow(newFlow);
    }
  }, [appContext.selectedFlow]);

  // Update flows on requestFields change
  useEffect(() => {
    const prevRequestFields = flows[appContext.selectedFlow]?.requestFields,
      requestFields = appContext.requestFields;
    if (
      requestFields &&
      JSON.stringify(prevRequestFields) !== JSON.stringify(requestFields)
    ) {
      setFlows((prevState) => ({
        ...prevState,
        [appContext.selectedFlow]: {
          curlCommand: appContext.curlCommand,
          curlRequest: appContext.curlRequest,
          hsResponseFields: appContext.hsResponseFields,
          requestFields: appContext.requestFields,
          requestHeaderFields: appContext.requestHeaderFields,
          status: appContext.status,
          statusVariable: appContext.statusVariable,
        },
      }));
    }
  }, [appContext.requestFields]);

  // Update flows on requestHeaderFields change
  useEffect(() => {
    const prevRequestHeaderFields =
        flows[appContext.selectedFlow]?.requestHeaderFields,
      requestHeaderFields = appContext.requestHeaderFields;
    if (
      requestHeaderFields &&
      JSON.stringify(prevRequestHeaderFields) !==
        JSON.stringify(requestHeaderFields)
    ) {
      setFlows((prevState) => ({
        ...prevState,
        [appContext.selectedFlow]: {
          curlCommand: appContext.curlCommand,
          curlRequest: appContext.curlRequest,
          hsResponseFields: appContext.hsResponseFields,
          requestFields: appContext.requestFields,
          requestHeaderFields: appContext.requestHeaderFields,
          status: appContext.status,
          statusVariable: appContext.statusVariable,
        },
      }));
    }
  }, [appContext.requestHeaderFields]);

  // Update flows on responseFields change
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

  // Form mapping for hsResponseFields
  useEffect(() => {
    const hsResponseFields = appContext.hsResponseFields;
    if (hsResponseFields.value && !hsResponseFields.mapping) {
      setAppContext((prevState) => ({
        ...prevState,
        hsResponseFields: {
          ...prevState.hsResponseFields,
          mapping: addFieldsToNodes(mapFieldNames(hsResponseFields.value)),
        },
      }));
    }
  }, [appContext.hsResponseFields]);

  // Form mapping for status
  useEffect(() => {
    const status = appContext.status;
    if (status.value && !status.mapping) {
      setAppContext((prevState) => ({
        ...prevState,
        status: {
          ...prevState.status,
          mapping: addFieldsToNodes(status.value),
        },
      }));
    }
  }, [appContext.status]);

  return (
    <Router>
      {bootComplete ? (
        <React.Fragment>
          <div className="app">
            <Header />
            <Routes>
              <Route path="*" element={<Content />} />
            </Routes>
          </div>{' '}
        </React.Fragment>
      ) : null}
    </Router>
  );
}
