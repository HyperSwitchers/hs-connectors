// @ts-check

import handlebars from 'handlebars';
import React, { useEffect, useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useRecoilState } from 'recoil';

import {
  ConnectorCommon,
  ConnectorIntegration,
  ConnectorWebhook,
} from 'templates/ConnectorIntegration';
import { generateRustCode, toPascalCase } from 'utils/Parser';
import {
  buildAuthHeaders,
  deepCopy,
  deepJsonSwap,
  findCommonHeaders,
  getHeaders,
  toCamelCase,
} from 'utils/common';

import { APP_CONTEXT, FLOWS, PROP_STATE, TRANSFORMER_STATE } from 'utils/state';

export default function CodePreview() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const [flows, setFlows] = useRecoilState(FLOWS);
  const [propState, setPropState] = useRecoilState(PROP_STATE);
  const [transformerState, setTransformerState] =
    useRecoilState(TRANSFORMER_STATE);

  const [connectorIntegrationCode, setConnectorIntegrationCode] = useState('');
  const [transformerIntegrationCode, setTransformerIntegrationCode] =
    useState('');
  const [regenerateCode, setRegenerateCode] = useState(false);

  // Regenerate connectorIntegrationCode
  useEffect(() => {
    try {
      const template = handlebars.compile(ConnectorIntegration);
      const connectorCommonTemplate = handlebars.compile(ConnectorCommon);
      const connectorWebhookTemplate = handlebars.compile(ConnectorWebhook);

      const renderedTemplate =
        connectorCommonTemplate({
          struct_name: toPascalCase(propState.struct_name),
          connector_name: toCamelCase(propState.connector_name),
          headers: findCommonHeaders(propState.flows),
          content_type: propState.content_type,
          ...buildAuthHeaders(propState.flows),
        }) +
        Object.values(propState.flows)
          .map((flow) =>
            template({
              ...flow,
              connector_name: toCamelCase(propState.connector_name || ' '),
            })
          )
          .join('\n') +
        connectorWebhookTemplate({
          struct_name: toPascalCase(propState.connector),
        });

      if (renderedTemplate !== connectorIntegrationCode) {
        setConnectorIntegrationCode(renderedTemplate);
      }
    } catch (error) {
      console.warn('ERROR', 'Failed to generate connector integration code');
    }
  }, [propState]);

  // Regenerate transformerIntegrationCode
  useEffect(() => {
    try {
      // debugger
      const rustCode = generateRustCode(
        appContext.connectorPascalCase,
        JSON.stringify(transformerState)
      );
      if (rustCode !== transformerIntegrationCode) {
        setTransformerIntegrationCode(rustCode);
      }
    } catch (error) {
      console.warn('ERROR', 'Failed to generate Transformer code', error);
    }
  }, [transformerState]);

  // Regenerate transformer and connector integration props
  useEffect(() => {
    if (regenerateCode) {
      // Form transformer generator input
      const modifiedRequestData = deepJsonSwap(
        deepCopy(appContext.requestFields.mapping || {})
      );
      const modifiedResponseData = deepJsonSwap(
        deepCopy(appContext.responseFields.mapping || {})
      );
      const updatedTransformerState = {
        [appContext.connectorPascalCase]: {
          connectorName: appContext.connectorName,
          authType: appContext.authType.value.type,
          authKeys: appContext.authType.value.content,
          amount: {
            unit: appContext.currencyUnit,
            unitType: appContext.currencyUnitType,
          },
          flows: {
            [appContext.selectedFlow]: {
              paymentsRequest: modifiedRequestData,
              paymentsResponse: modifiedResponseData,
              hsResponse: appContext.hsResponseFields.value || {},
            },
          },
        },
      };
      if (
        flows['Authorize']?.status?.value ||
        appContext.selectedFlow.toLowerCase() === 'authorize'
      ) {
        updatedTransformerState[appContext.connectorPascalCase].attemptStatus =
          flows['Authorize'].status?.value || appContext.status?.value;
      }
      if (
        flows['Refund']?.status?.value ||
        appContext.selectedFlow.toLowerCase() === 'refund'
      ) {
        updatedTransformerState[appContext.connectorPascalCase].refundStatus =
          flows['Refund'].status?.value || appContext.status?.value;
      }
      setTransformerState((prevState) => ({
        ...prevState,
        ...updatedTransformerState,
      }));

      // Form connector integration generator input
      const curlRequest = appContext.curlRequest;
      const headers = getHeaders(curlRequest.headers);
      const enabledFlows = [];
      if (Object.keys(JSON.parse(curlRequest.data.ascii)).length > 0) {
        enabledFlows.push('get_request_body');
      }
      if (appContext.responseFields.value) {
        enabledFlows.push(
          'get_url',
          'get_content_type',
          'get_headers',
          'build_request',
          'handle_response',
          'get_error_response'
        );
      }
      const updatedPropState = {
        connector: appContext.connectorName,
        url: new URL(curlRequest.url).pathname,
        content_type: headers['Content-Type'] || headers['content-type'],
        struct_name: appContext.connectorPascalCase,
        flows: {
          ...propState.flows,
          [appContext.selectedFlow]: {
            ...propState.flows[appContext.selectedFlow],
            enabled: enabledFlows,
          },
        },
      };
      setPropState((prevState) => ({ ...prevState, ...updatedPropState }));

      // Set flag for code re-generation
      setRegenerateCode(false);
    }
  }, [regenerateCode]);

  return (
    <div className="code-preview">
      <div className="code-preview-header">
        <div className="button" onClick={() => setRegenerateCode(true)}>
          Generate Code
        </div>
        <div className="button">Raise GitHub PR</div>
        <h2>Generated Code Snippet</h2>
      </div>
      <div className="connector-integration">
        <div className="filename">
          {appContext.connectorName.toLowerCase()}.rs
        </div>
        <SyntaxHighlighter id="connectors" language="rust" style={githubGist}>
          {connectorIntegrationCode}
        </SyntaxHighlighter>
      </div>
      <div className="transformer-integration">
        <div className="filename">transformers.rs</div>
        <SyntaxHighlighter id="transformers" language="rust" style={githubGist}>
          {transformerIntegrationCode}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
