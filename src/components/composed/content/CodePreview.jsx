// @ts-check

import copy from 'copy-to-clipboard';
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
  download,
  findCommonHeaders,
  getHeaders,
  storeItem,
  toCamelCase,
} from 'utils/common';
import { CURL_FOR_PR } from 'utils/constants';
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
  const [isCopied, setIsCopied] = useState({
    prCurl: false,
    connectorIntegrationCode: false,
    transformerIntegrationCode: false,
  });
  const [showPrSteps, setShowPrSteps] = useState(false);
  const [prCurl, setPrCurl] = useState(
    CURL_FOR_PR.replace(
      '{{connector_pascal_case}}',
      appContext.connectorPascalCase
    ).replace(
      '{{base_url}}',
      appContext.curlRequest.url ||
        `https://api.${appContext.connectorName.toLowerCase()}.com`
    )
  );

  useEffect(() => {
    const updatedPrCurl = CURL_FOR_PR.replace(
      '{{connector_pascal_case}}',
      appContext.connectorPascalCase
    ).replace(
      '{{base_url}}',
      appContext.curlRequest.url ||
        `https://api.${appContext.connectorName.toLowerCase()}.com`
    );

    if (updatedPrCurl !== prCurl) {
      setPrCurl(updatedPrCurl);
    }
  }, [appContext.connectorPascalCase, appContext.curlRequest]);

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
          currency_unit: propState.currency_unit,
          currency_unit_type: propState.currency_unit_type,
          ...buildAuthHeaders(propState.flows),
        }) +
        Object.values(propState.flows)
          .map((flow) =>
            template({
              ...flow,
              connector_name: toCamelCase(propState.connector_name || ' '),
              struct_name: toPascalCase(propState.struct_name),
              content_type: propState.content_type,
              currency_unit: propState.currency_unit,
              currency_unit_type: propState.currency_unit_type,
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
      console.warn(
        'ERROR',
        'Failed to generate connector integration code',
        error
      );
    }

    storeItem('prop_state', JSON.stringify(propState));
  }, [propState]);

  // Regenerate transformerIntegrationCode
  useEffect(() => {
    try {
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

    storeItem('transformer_state', JSON.stringify(transformerState));
  }, [transformerState]);

  // Regenerate transformer and connector integration props
  useEffect(() => {
    if (regenerateCode) {
      // Form transformer generator input
      const modifiedRequestData = deepJsonSwap(
        deepCopy(appContext.requestFields.mapping || {})
      );
      const updatedTransformerState = {
        [appContext.connectorPascalCase]: {
          connectorName: appContext.connectorName,
          amount: {
            unit: appContext.currencyUnit,
            unitType: appContext.currencyUnitType,
          },
          flows: {
            ...transformerState[appContext.connectorPascalCase]?.flows,
            [appContext.selectedFlow]: {
              paymentsRequest: modifiedRequestData,
            },
          },
          attemptStatus:
            appContext.selectedFlow.toLowerCase() === 'authorize'
              ? appContext.status.value || {}
              : flows['Authorize']?.status?.value || {},
          refundStatus:
            appContext.selectedFlow.toLowerCase() === 'refund'
              ? appContext.status.value || {}
              : flows['Refund']?.status?.value || {},
        },
      };
      if (appContext.authType.value) {
        if (appContext.authType.value.type)
          updatedTransformerState[appContext.connectorPascalCase].authType =
            appContext.authType.value.type;
        if (appContext.authType.value.content)
          updatedTransformerState[appContext.connectorPascalCase].authKeys =
            appContext.authType.value.content;
      }
      if (appContext.responseFields.value) {
        const modifiedResponseData = deepJsonSwap(
          deepCopy(appContext.responseFields.mapping || {})
        );
        updatedTransformerState[appContext.connectorPascalCase].flows[
          appContext.selectedFlow
        ].paymentsResponse = modifiedResponseData;
      }
      if (appContext.hsResponseFields.value) {
        updatedTransformerState[appContext.connectorPascalCase].flows[
          appContext.selectedFlow
        ].hsResponse = appContext.hsResponseFields.value;
      }
      setTransformerState((prevState) => ({
        ...prevState,
        ...updatedTransformerState,
      }));

      // Form connector integration generator input
      const curlRequest = appContext.curlRequest;
      const headers = getHeaders(curlRequest.headers);
      const enabledFlows = [
        ...(propState.flows[appContext.selectedFlow]?.enabled || []),
      ];
      if (Object.keys(JSON.parse(curlRequest.data.ascii)).length > 0) {
        enabledFlows.push(
          'get_request_body',
          'get_url',
          'get_content_type',
          'get_headers',
          'build_request'
        );
      }
      if (appContext.responseFields.value) {
        enabledFlows.push('handle_response', 'get_error_response');
      }
      const updatedPropState = {
        connector: appContext.connectorName,
        connector_name: appContext.connectorName,
        currency_unit: appContext.currencyUnit,
        currency_unit_type: appContext.currencyUnitType,
        url: new URL(curlRequest.url).pathname,
        content_type: headers['Content-Type'] || headers['content-type'],
        struct_name: appContext.connectorPascalCase,
        flows: {
          ...propState.flows,
          [appContext.selectedFlow]: {
            ...propState.flows[appContext.selectedFlow],
            // @ts-ignore
            enabled: [...new Set(enabledFlows)],
            http_method: toPascalCase(appContext.curlRequest?.method),
            url_path: new URL(curlRequest.url).pathname,
            curl: {
              input: appContext.curlCommand,
              body: appContext.requestFields?.value,
              headers: appContext.requestHeaderFields?.mapping,
              response: appContext.responseFields?.value,
              hsResponse: appContext.hsResponseFields?.value,
            },
          },
        },
      };
      setPropState((prevState) => ({ ...prevState, ...updatedPropState }));

      // Set flag for code re-generation
      setRegenerateCode(false);
      setAppContext((prevState) => ({
        ...prevState,
        codeInvalidated: false,
        downloadInvalidated: true,
      }));
    }
  }, [regenerateCode]);

  const handleClipboardCopy = (key) => {
    if (typeof isCopied[key] === 'boolean') {
      let copyContent = '';
      switch (key) {
        case 'prCurl':
          copyContent = prCurl;
          break;
        case 'connectorIntegrationCode':
          copyContent = connectorIntegrationCode;
          break;
        case 'transformerIntegrationCode':
          copyContent = transformerIntegrationCode;
          break;
      }
      copy(copyContent);
      setIsCopied((prevState) => ({ ...prevState, [key]: true }));
      setTimeout(
        () => setIsCopied((prevState) => ({ ...prevState, [key]: false })),
        1000
      );
    }
  };

  const handlePrSteps = () => {
    setShowPrSteps(true);
    if (appContext.downloadInvalidated) {
      download(
        connectorIntegrationCode,
        `${appContext.connectorName.toLowerCase()}.rs`,
        'text'
      );
      download(transformerIntegrationCode, 'transformers.rs', 'text');
      setAppContext((prevState) => ({
        ...prevState,
        downloadInvalidated: false,
      }));
    }
  };

  return (
    <div className="code-preview">
      <div className="code-preview-header">
        <a
          href="#code-preview-anchor"
          className={`save button${
            appContext.codeInvalidated ? '' : ' disabled'
          }`}
          onClick={() =>
            appContext.codeInvalidated ? setRegenerateCode(true) : null
          }
        >
          {appContext.codeInvalidated ? 'Generate Code' : 'Code generated!'}
        </a>
        <div
          className={`save button${showPrSteps ? ' disabled' : ''}`}
          onClick={() => handlePrSteps()}
        >
          Raise GitHub PR
        </div>
        {showPrSteps && (
          <div id="pr-steps" className="pr-steps">
            <div className="info">
              Run below command in your terminal for raising a PR
            </div>
            <div
              className="copy button"
              onClick={() => handleClipboardCopy('prCurl')}
            >
              {!isCopied.prCurl ? 'Copy' : 'Copied to clipboard!'}
            </div>
            <div className="close button" onClick={() => setShowPrSteps(false)}>
              X
            </div>
            <div className="curl">{prCurl}</div>
          </div>
        )}
        <h2 id="code-preview-anchor">Generated Code Snippet</h2>
      </div>
      <div className="connector-integration">
        <div>
          <div className="filename">
            {appContext.connectorName.toLowerCase()}.rs
          </div>
          <div
            className="copy button"
            onClick={() => handleClipboardCopy('connectorIntegrationCode')}
          >
            {!isCopied.connectorIntegrationCode
              ? 'Copy'
              : 'Copied to clipboard!'}
          </div>
        </div>
        <SyntaxHighlighter id="connectors" language="rust" style={githubGist}>
          {connectorIntegrationCode}
        </SyntaxHighlighter>
      </div>
      <div className="transformer-integration">
        <div>
          <div className="filename">transformers.rs</div>
          <div
            className="copy button"
            onClick={() => handleClipboardCopy('transformerIntegrationCode')}
          >
            {!isCopied.transformerIntegrationCode
              ? 'Copy'
              : 'Copied to clipboard!'}
          </div>
        </div>
        <SyntaxHighlighter id="transformers" language="rust" style={githubGist}>
          {transformerIntegrationCode}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
