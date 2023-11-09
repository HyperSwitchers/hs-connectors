// @ts-check

import { useState, useEffect, useRef } from 'react';
import { parse_curl } from 'curl-parser';
import $ from 'jquery';
import jsonpath from 'jsonpath';
import '../styles.css';
import '../styles/styles.sass';
import { codeSnippets } from 'utils/constants';
import Modal from '@mui/material/Modal';
import {
  authTypesMapping,
  download,
  deepJsonSwap,
  synonymMapping,
  addFieldsToNodes,
  mapFieldNames,
  deepCopy,
  generateAuthTypeEncryption,
} from '../utils/search_utils';
import Dropdown from './Dropdown';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs'; // Import a suitable style for SyntaxHighlighter
import copy from 'copy-to-clipboard'; // Import the copy-to-clipboard library
import React from 'react';
import AuthType from './AuthType';
import ConnectorTemplates, {
  defaultConnectorProps,
} from './ConnectorTemplates';
import StatusMappingPopup from './StatusMappingPopup';
import { generateRustCode, toPascalCase } from 'utils/Parser';
import IRequestFieldsTable from './curl_handlers/RequestFieldsTable';
import { Paper } from '@mui/material';
import IRequestHeadersTable from './curl_handlers/RequestHeadersTable';
import IResponseFieldsTable from './curl_handlers/ResponseFields';
import IConnectorResponseTable from './curl_handlers/ConnectorResponseTable';
import { APP_CONTEXT, fetchItem, storeItem } from 'utils/state';
import { useRecoilState } from 'recoil';

const CurlRequestExecutor = () => {
  const generateCodeSnippet = () => {
    return `fn main() {
    let name: &str = "John";
    let age: u32 = 30;

    println!("Name: {}, Age: {}", name, age);
}
    impl TryFrom<&types::ConnectorAuthType> for ZenAuthType {
      type Error = error_stack::Report<errors::ConnectorError>;
      fn try_from(auth_type: &types::ConnectorAuthType) -> Result<Self, Self::Error> {
          if let types::ConnectorAuthType::HeaderKey { api_key } = auth_type {
              Ok(Self {
                  api_key: api_key.to_owned(),
              })
          } else {
              Err(errors::ConnectorError::FailedToObtainAuthType.into())
          }
      }
  }`;

    // In a real scenario, you might generate the code dynamically based on some logic
  };

  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const [codeSnippet, setCodeSnippet] = useState(generateCodeSnippet());
  const [connectorContext, setConnectorContext] = useState({});
  const [loading, setLoading] = useState(false);
  const [inputJson, setInputJson] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [raiseAPRModalOpen, setRaiseAPRModalOpen] = useState(false);
  const [selectedPaymentMethodOption, setSelectedPaymentMethodOption] =
    useState('');
  const [selectedCurrencyUnitOption, setSelectedCurrencyUnitOption] =
    useState('');
  const [selectedCurrencyUnitTypeOption, setSelectedCurrencyUnitTypeOption] =
    useState('');

  const updateAppContextInLocalStorage = () => {
    // Update in localStorage
    storeItem('app_context', JSON.stringify(appContext));
  };

  const updateAppContext = (updates) => {
    const updatedAppContext = {
      ...appContext,
      ...updates,
    };
    setAppContext(updatedAppContext);
  };

  /// Effects
  /**
   * Trigger - Run on every mount
   * Use - Setup app's state
   */
  useEffect(() => {
    const storedAppContext = fetchItem('app_context');
    const updatedAppContext = { ...(storedAppContext || deepCopy(appContext)) };
    if (
      typeof updatedAppContext.flows[updatedAppContext.selectedFlow]
        .curlCommand === 'string'
    ) {
      updateCurlRequest(
        updatedAppContext.flows[updatedAppContext.selectedFlow].curlCommand
      );
    }
    updateAppContext(updatedAppContext);
  }, []);

  /**
   * Trigger - Run whenever status field in response is mapped to HS variable
   * Use - Open popup for mapping status fields to HS AttemptStatus
   */
  useEffect(() => {
    if (
      typeof appContext.flows[appContext.selectedFlow].statusVariable ===
        'string' &&
      appContext.flows[appContext.selectedFlow].statusVariable.length > 0 &&
      !appContext.flows[appContext.selectedFlow].status.value
    ) {
      handleStatusMappingButtonClick();
    }
  }, [appContext.flows[appContext.selectedFlow].statusVariable]);

  const updateCurlRequest = (request, flow = null) => {
    let ss = request
      .replace(/\s*\\\s*/g, ' ')
      .replace(/\n/g, '')
      .replace(/--data-raw|--data-urlencode/g, '-d');
    const updatedFlow = flow || appContext.selectedFlow;
    const updatedAppContext = deepCopy(appContext);
    updatedAppContext.flows[updatedFlow].curlCommand = request;
    try {
      const fetchRequest = parse_curl(ss);
      const requestFields = JSON.parse(fetchRequest?.data?.ascii || '{}');
      const requestHeaderFields = fetchRequest?.headers.reduce(
        (result, item) => {
          let header = item.split(':');
          result[header[0]] = header[1].trim();
          return result;
        },
        {}
      );
      updatedAppContext.flows[updatedFlow].curlRequest = fetchRequest;
      if (!flow || !updatedAppContext.flows[updatedFlow]?.requestFields.value) {
        updatedAppContext.flows[updatedFlow].requestFields = {
          value: requestFields,
          mapping: addFieldsToNodes(mapFieldNames({ ...requestFields })),
        };
      }
      if (
        !flow ||
        !updatedAppContext.flows[updatedFlow]?.requestHeaderFields.value
      ) {
        updatedAppContext.flows[updatedFlow].requestHeaderFields = {
          value: requestHeaderFields,
          mapping: addFieldsToNodes(mapFieldNames({ ...requestHeaderFields })),
        };
      }
      if (
        updatedAppContext.flows[updatedFlow]?.hsResponseFields.value &&
        !updatedAppContext.flows[updatedFlow]?.hsResponseFields.mapping
      ) {
        updatedAppContext.flows[updatedFlow].hsResponseFields = {
          ...updatedAppContext.flows[updatedFlow]?.hsResponseFields,
          mapping: addFieldsToNodes(
            mapFieldNames({
              ...updatedAppContext.flows[updatedFlow]?.hsResponseFields.value,
            })
          ),
        };
      }
      if (fetchRequest) {
        saveFlowDetails(fetchRequest);
      }
    } catch (e) {
      console.error(e);
    }
    if (flow) {
      updatedAppContext.selectedFlow = flow;
    }
    updateAppContext(updatedAppContext);
  };

  const saveFlowDetails = (curl) => {
    let props = localStorage.props
      ? JSON.parse(localStorage.props)
      : defaultConnectorProps(localStorage.connector || 'DemoCon');
    let flow = props.flows[appContext.selectedFlow];
    if (flow) {
      flow.url_path = new URL(curl.url).pathname;
      flow.http_method = toPascalCase(curl.method);
      let headers = getHeaders(curl.headers);
      props.content_type = headers['Content-Type'] || headers['content-type'];
      flow.headers = Object.keys(headers).map((key) =>
        convertToValidVariableName(key)
      );
      // if request body is present then build request body
      flow.enabled.push(
        'get_headers',
        'get_content_type',
        'get_url',
        'build_request',
        'handle_response',
        'get_error_response'
      );
      if (Object.keys(JSON.parse(curl.data.ascii)).length > 0) {
        flow.enabled.push('get_request_body');
      }
      props.flows[appContext.selectedFlow] = flow;
    }
    storeItem('props', JSON.stringify(props));
  };

  function convertToValidVariableName(str) {
    return str.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
  }
  const getHeaders = (headers) => {
    return headers.reduce((acc, item) => {
      const [key, value] = item.split(':').map((item) => item.trim());
      acc[key] = value;
      return acc;
    }, {});
  };
  const sendRequest = () => {
    const curlRequest = deepCopy(
      appContext.flows[appContext.selectedFlow].curlRequest
    );
    saveFlowDetails(curlRequest);
    setLoading(true);
    // Transforming the fetchRequest object into a valid JavaScript fetch request
    const requestOptions = {
      method: curlRequest.method,
      headers: getHeaders(curlRequest.headers),
      body: curlRequest.data.ascii,
    };

    let url = curlRequest.url;
    let req_content = {
      type: requestOptions.method,
      url: url,
      headers: requestOptions.headers,
      data: requestOptions.body,
      success: (data) => {
        const updatedFlows = deepCopy(appContext.flows);
        updatedFlows[appContext.selectedFlow].responseFields.value = data;
        updatedFlows[appContext.selectedFlow].responseFields.mapping =
          addFieldsToNodes(mapFieldNames(data));
        updateAppContext({ flows: updatedFlows });
      },
      error: (data) => {
        console.log(data);
      },
    };
    $.ajax(url, req_content).always(() => setLoading(false));
    let targetElement = document.getElementById('generate-code');

    targetElement.scrollIntoView({
      behavior: 'instant',
      block: 'end',
    });
  };

  const handleFlowOptionChange = (event) => {
    let flow = event.target.value;
    updateCurlRequest(appContext.flows[flow].curlCommand || '', flow);
  };

  const handlePaymentMethodOptionChange = (event) => {
    setSelectedPaymentMethodOption(event.target.value);
  };

  const handleCurrencyUnitOptionChange = (event) => {
    setSelectedCurrencyUnitOption(event.target.value);
  };

  const handleCurrencyUnitTypeOptionChange = (event) => {
    setSelectedCurrencyUnitTypeOption(event.target.value);
  };

  const flowOptions = [
    'AuthType',
    'Authorize',
    'Capture',
    'Void',
    'Refund',
    'PSync',
    'RSync',
  ];
  const paymentMethodOptions = ['Card', 'Wallet', 'BankRedirects'];

  const CurrencyUnit = ['Minor', 'Base'];
  const CurrencyUnitType = ['String', 'i64', 'f64'];

  const [isStatusMappingPopupOpen, setStatusMappingPopupOpen] = useState(false);
  const handleStatusMappingButtonClick = () => {
    let statusFields = {};
    const statusVariable =
      appContext.flows[appContext.selectedFlow].statusVariable;
    if (typeof statusVariable === 'string') {
      let field = null;
      try {
        field =
          jsonpath.query(
            appContext.flows[appContext.selectedFlow].responseFields.mapping,
            '$.' +
              statusVariable
                // @ts-ignore
                .replaceAll('.', '.value.')
                .replaceAll('-', '')
          )[0] || {};
      } catch (error) {
        console.error('jsonpath query failed', error);
        return;
      }
      if (typeof field.value === 'object') {
        if (Array.isArray(field.value)) {
          field.value.map((s) => {
            statusFields[s] = null;
          });
        } else {
          statusFields = { ...statusFields, ...field.value };
        }
      } else {
        statusFields[field.value] = null;
      }
      const updatedFlows = deepCopy(appContext.flows);
      if (
        typeof updatedFlows[appContext.selectedFlow].status.value === 'object'
      ) {
        updatedFlows[appContext.selectedFlow].status.value = {
          ...statusFields,
          ...updatedFlows[appContext.selectedFlow].status.value,
        };
      } else {
        updatedFlows[appContext.selectedFlow].status.value = statusFields;
      }
      setStatusMappingPopupOpen(true);
      updateAppContext({ flows: updatedFlows });
    }
  };

  const handleCloseStatusMappingPopup = () => {
    setStatusMappingPopupOpen(false);
  };

  const updateInputJson = (inputJsonData) => {
    let props = { ...fetchItem('props'), ...JSON.parse(inputJsonData) };
    storeItem('props', JSON.stringify(props));
    setInputJson(inputJsonData);
  };
  const curlTextareaRef = useRef(null);

  // Function to handle the "Copy to Clipboard" button click event
  const handleCopyClick = () => {
    copy(codeSnippet);
    download(codeSnippet, 'transformer.rs', 'text');
    setIsCopied(true);
    // Reset the "Copied to clipboard" notification after a short delay
    setTimeout(() => {
      setIsCopied(false);
    }, 500);
  };

  const handleConnectorNameChange = (event) => {
    let connectorName = event.target.value;
    updateAppContext({ connectorName });
    storeItem('props', JSON.stringify(defaultConnectorProps(connectorName)));
  };
  return (
    <div>
      <div
        className="dropdown-wrapper hs-headers"
        style={{
          marginLeft: '50px',
          marginBottom: '10px',
        }}
      >
        <div style={{ paddingRight: '10px' }}>
          <label
            htmlFor="dropdown"
            style={{
              fontSize: '15px',
            }}
          >
            Connector:{' '}
          </label>
          <Tooltip title="Text to be added.......">
            <InfoIcon
              style={{
                height: '15px',
                width: '15px',
              }}
            />
          </Tooltip>

          {/* <input className='conector' type="text" placeholder="Connector Name" style={{padding: '5px'}} onChange={(e) => { localStorage.props = JSON.stringify(defaultConnectorProps(e.target.value)); }} /> */}
          <input
            style={{
              height: '30px',
              width: '250px',
            }}
            className="conector"
            type="text"
            placeholder="Connector Name"
            onChange={handleConnectorNameChange}
            defaultValue={appContext.connectorName}
          />
        </div>
        <Dropdown
          options={flowOptions}
          handleSelectChange={handleFlowOptionChange}
          selectedOption={appContext.selectedFlow}
          type="Flow Type"
        />
        {appContext.selectedFlow !== 'AuthType' ? (
          <Dropdown
            options={paymentMethodOptions}
            handleSelectChange={handlePaymentMethodOptionChange}
            selectedOption={selectedPaymentMethodOption}
            type="Payment Method"
          />
        ) : null}
        {/*} {appContext.selectedFlow === 'AuthType' ? (
          <React.Fragment>
            <Dropdown
              options={CurrencyUnit}
              handleSelectChange={handleCurrencyUnitOptionChange}
              selectedOption={selectedCurrencyUnitOption}
              type="Currency Unit"
            />
            <Dropdown
              options={CurrencyUnitType}
              handleSelectChange={handleCurrencyUnitTypeOptionChange}
              selectedOption={selectedCurrencyUnitTypeOption}
              type="Currency Unit Type"
            />
          </React.Fragment>
        ) : null}
        <button>
          <a
            style={{ textDecoration: 'none', color: '#fff' }}
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/juspay/hyperswitch/fork"
          >
            Fork Hyperswitch
          </a>
        </button> */}
      </div>
      {appContext.selectedFlow === 'AuthType' ? (
        <AuthType updateAppContext={updateAppContext}></AuthType>
      ) : (
        <div>
          <div className="container">
            {loading && (
              <div className="page-loader">
                <div className="loader"></div>
              </div>
            )}
            <div
              dangerouslySetInnerHTML={{
                __html:
                  appContext.flows[appContext.selectedFlow]?.description || '',
              }}
            ></div>
            <div
              style={{
                display: 'flex',
                alignItems: 'items-center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Paper
                elevation={0}
                className="curl-input-section"
                style={{
                  height: '85vh',
                  width: '45vw',
                }}
              >
                <h3>cURL Request</h3>
                <textarea
                  ref={curlTextareaRef} // Add the ref to the text area
                  style={{ height: '100%' }}
                  value={appContext.flows[appContext.selectedFlow].curlCommand}
                  onChange={(e) => updateCurlRequest(e.target.value)}
                  placeholder="Enter your cURL request here..."
                />
                <button onClick={sendRequest} disabled={loading}>
                  {loading ? <div className="loader"></div> : 'Send Request'}
                </button>
              </Paper>
              <Paper
                elevation={0}
                className="request-body-section"
                style={{
                  height: '85vh',
                  width: '45vw',
                }}
              >
                <h3>Request Header Fields:</h3>
                <IRequestHeadersTable
                  suggestions={{
                    ...Object.keys(
                      appContext.authType.value?.content || {}
                    ).reduce((obj, key) => {
                      const val = appContext.authType.value?.content[key];
                      obj[val] = [];
                      return obj;
                    }, {}),
                    ...generateAuthTypeEncryption(
                      Object.values(
                        appContext.authType.value?.content || {}
                      ).slice(0, 2)
                    ),
                  }}
                  updateAppContext={updateAppContext}
                ></IRequestHeadersTable>
                <h3>Request Body Fields:</h3>
                <div
                  style={{
                    height: '100%',
                    overflow: 'scroll',
                  }}
                >
                  <IRequestFieldsTable
                    suggestions={synonymMapping[appContext.selectedFlow]}
                    updateAppContext={updateAppContext}
                  ></IRequestFieldsTable>
                </div>
              </Paper>
            </div>

            <Paper
              elevation={0}
              id="responseFieldsLeft"
              className="response-fields-left"
            >
              <h3>Response</h3>
              <IConnectorResponseTable
                updateAppContext={updateAppContext}
              ></IConnectorResponseTable>
              {/* <JsonEditor content={{ ...responseFields }} options={{ ...options, onChange: setResponseFields }}></JsonEditor> */}
            </Paper>

            <Paper
              elevation={0}
              id="responseFieldsRight"
              className="response-fields-right"
            >
              <div className="responseButtonStatus">
                <h3>Response Fields Mapping</h3>
                <button
                  id="responseStatusMapping"
                  className={`${
                    !(
                      typeof appContext.flows[appContext.selectedFlow]
                        .statusVariable === 'string' &&
                      appContext.flows[appContext.selectedFlow].statusVariable
                        .length > 0
                    )
                      ? 'disabled'
                      : ''
                  }`}
                  onClick={handleStatusMappingButtonClick}
                >
                  {!(
                    typeof appContext.flows[appContext.selectedFlow]
                      .statusVariable === 'string' &&
                    appContext.flows[appContext.selectedFlow].statusVariable
                      .length > 0
                  )
                    ? 'Map Status to HyperSwitch field'
                    : 'Status Mapping'}
                </button>
              </div>
              <div
                style={{
                  height: '100%',
                }}
              >
                <IResponseFieldsTable
                  suggestions={
                    appContext.flows[appContext.selectedFlow]?.responseFields
                      ?.value
                  }
                  updateAppContext={updateAppContext}
                ></IResponseFieldsTable>
              </div>

              {/* Render the StatusMappingPopup when isStatusMappingPopupOpen is true */}
              {isStatusMappingPopupOpen && (
                <StatusMappingPopup
                  onClose={handleCloseStatusMappingPopup}
                  updateAppContext={updateAppContext}
                />
              )}
            </Paper>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              gap: '10px',
            }}
          >
            <button
              id="generate-code"
              className={`${!appContext.authType.value ? 'disabled' : ''}`}
              onClick={(e) => {
                updateAppContextInLocalStorage();
                if (!appContext.authType.value) {
                  updateAppContext({ selectedFlow: 'AuthType' });
                  return;
                }
                let connector = localStorage.connector || 'DemoCon';
                let props = localStorage.props
                  ? JSON.parse(localStorage.props)
                  : defaultConnectorProps(connector);
                let authType = appContext.authType.value || {};
                let existingFlows = JSON.parse(inputJson || '{}')?.[
                  appContext.connectorName
                ]?.flows;
                let modifiedUpdatedRequestData = deepJsonSwap(
                  deepCopy(
                    appContext.flows[appContext.selectedFlow].requestFields
                      .mapping || {}
                  )
                );
                let modifiedUpdatedResponseData = deepJsonSwap(
                  deepCopy(
                    appContext.flows[appContext.selectedFlow].responseFields
                      .mapping || {}
                  )
                );
                let x = JSON.stringify({
                  [appContext.connectorName]: {
                    authType: authType.type,
                    authKeys: authType.content || {},
                    amount: {
                      unit: selectedCurrencyUnitOption,
                      unitType: selectedCurrencyUnitTypeOption,
                    },
                    flows: {
                      ...existingFlows,
                      [appContext.selectedFlow || 'Authorize']: {
                        paymentsRequest: modifiedUpdatedRequestData,
                        paymentsResponse: modifiedUpdatedResponseData,
                        hsResponse:
                          appContext.flows[appContext.selectedFlow]
                            .hsResponseFields.value || {},
                      },
                    },
                    attemptStatus:
                      appContext.flows[appContext.selectedFlow].status.value ||
                      {},
                  },
                });
                updateInputJson(x);
                setCodeSnippet(generateRustCode(appContext.connectorName, x));
                setConnectorContext({ ...{} });
                let targetElement = document.getElementById(
                  'generated-code-snippet'
                );
                targetElement.scrollIntoView({
                  behavior: 'smooth',
                });
              }}
            >
              {!appContext.authType.value
                ? 'Configure AuthType before generating code'
                : 'Generate Code'}
            </button>
            <button
              onClick={() => {
                setRaiseAPRModalOpen(true);
              }}
              className={`${!appContext.authType.value ? 'disabled' : ''}`}
            >
              Raise Github PR
            </button>
            <Modal
              open={raiseAPRModalOpen}
              onClose={() => {
                setRaiseAPRModalOpen(false);
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '50rem',
                  height: '45rem',
                  backgroundColor: 'white',
                  border: '2px solid #000',
                }}
              >
                <div
                  className="auth-type-code-snippets"
                  style={{
                    height: '100%',
                    width: '100%',
                  }}
                >
                  <div className="code-snippet-header">
                    {codeSnippets.map((l) => (
                      <div key={l}>{l}</div>
                    ))}
                    <b>Please run below command in your terminal </b>
                    <br />
                    <br />
                    <br />
                    <code>
                      curl
                      https://raw.githubusercontent.com/HyperSwitchers/hs-connectors/main/raise_connector_pr.sh?token=GHSAT0AAAAAACHHDB3POVUZAGSXF2FNKAU6ZKMURMQ
                      | bash{' '}
                    </code>
                  </div>
                  <button
                    onClick={() => {
                      copy(
                        `curl https://raw.githubusercontent.com/HyperSwitchers/hs-connectors/main/raise_connector_pr.sh?token=GHSAT0AAAAAACHHDB3POVUZAGSXF2FNKAU6ZKMURMQ | bash`
                      );
                    }}
                  >
                    Copy to clipboard
                  </button>
                </div>
              </div>
            </Modal>
          </div>
          <div style={{ display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: '50%', padding: '10px' }}>
              <h3 id="generated-code-snippet">Generated Code Snippet</h3>
              <button onClick={handleCopyClick}>Copy to Clipboard</button>
              {isCopied && (
                <span style={{ marginLeft: '10px', color: 'green' }}>
                  Copied to clipboard!
                </span>
              )}
              <SyntaxHighlighter language="rust" style={githubGist}>
                {codeSnippet}
              </SyntaxHighlighter>
            </div>
            <div style={{ padding: '10px' }}>
              <div style={{ width: '50%' }}>
                <ConnectorTemplates
                  curl={{
                    ...{
                      connector: appContext.connectorName,
                      flow: appContext.selectedFlow,
                      input:
                        appContext.flows[appContext.selectedFlow].curlCommand,
                      body: appContext.flows[appContext.selectedFlow]
                        .requestFields?.value,
                      headers:
                        appContext.flows[appContext.selectedFlow]
                          .requestHeaderFields?.value,
                      response:
                        appContext.flows[appContext.selectedFlow]
                          ?.responseFields?.value,
                      hsResponse:
                        appContext.flows[appContext.selectedFlow]
                          .hsResponseFields?.value,
                    },
                  }}
                  // @ts-ignore
                  context={connectorContext}
                ></ConnectorTemplates>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurlRequestExecutor;
