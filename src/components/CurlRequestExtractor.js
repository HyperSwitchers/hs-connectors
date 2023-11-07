// @ts-check

import { useState, useEffect, useRef } from 'react';
import { parse_curl } from 'curl-parser';
import $ from 'jquery';
import '../styles.css';
import '../styles/styles.sass';
import {
  authTypesMapping,
  download,
  deepJsonSwap,
  synonymMapping,
  addFieldsToNodes,
  mapFieldNames,
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
import { generateRustCode } from 'utils/Parser';
import IRequestFieldsTable from './curl_handlers/RequestFieldsTable';
import { Paper } from '@mui/material';
import IRequestHeadersTable from './curl_handlers/RequestHeadersTable';
import IResponseFieldsTable from './curl_handlers/ResponseFields';
import IConnectorResponseTable from './curl_handlers/ConnectorResponseTable';
import { fetchItem, storeItem } from 'utils/state';

const CurlRequestExecutor = () => {
  const [curlCommand, setCurlCommand] =
    useState(`curl --location --request POST 'https://api.sandbox.checkout.com/payments'     --header 'Authorization: Bearer sk_sbox_3w2n46fb6m4tlp3c6ukvixwoget'     --header 'Content-Type: application/json'     --data-raw '{
      "source": {
        "type": "card",
        "number": "4242424242424242",
        "expiry_month": 1,
        "expiry_year": 30,
        "name": "John Smith",
        "cvv": "100"
      },
      "processing_channel_id": "pc_gcjstkyrr4eudnjkqlro3kymcu",
      "amount": 1040,
      "currency": "GBP",
      "reference": "123lala",
      "capture": false
    }'
    `);
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
  const [curlRequest, setCurlRequest] = useState({});
  const [responseFields, setResponseFields] = useState({});
  const [hsResponse, setHsResponse] = useState({
    status: '',
    response: {
      resource_id: '',
      redirection_data: 'None',
      connector_response_reference_id: '',
    },
  });
  const [hsMapping, setHsMapping] = useState({});
  const [requestFields, setRequestFields] = useState({});
  const [requestHeaderFields, setRequestHeaderFields] = useState({});
  const [responseMapping, setResponseMapping] = useState({});
  const [codeSnippet, setCodeSnippet] = useState(generateCodeSnippet());
  const [connectorContext, setConnectorContext] = useState({});

  const [loading, setLoading] = useState(false);
  let isLoaded = false;

  useEffect(() => {
    if (!isLoaded) {
      isLoaded = true;
      updateCurlRequest(curlCommand);
    }
  }, []);

  const updateCurlRequest = (request) => {
    let ss = request
      .replace(/\s*\\\s*/g, ' ')
      .replace(/\n/g, '')
      .replace(/--data-raw|--data-urlencode/g, '-d');
    setCurlCommand(request);
    try {
      const fetchRequest = parse_curl(ss);
      const requestFields = JSON.parse(fetchRequest?.data?.ascii || '{}');
      setCurlRequest(fetchRequest);
      setRequestFields(requestFields);
      setUpdateRequestData(addFieldsToNodes(mapFieldNames(requestFields)));
      setRequestHeaderFields(
        fetchRequest?.headers.reduce((result, item) => {
          let header = item.split(':');
          result[header[0]] = header[1];
          return result;
        }, {})
      );
      saveFlowDetails(fetchRequest);
    } catch (e) {
      console.error(e);
    }
  };

  const saveFlowDetails = (curl) => {
    let props = localStorage.props
      ? JSON.parse(localStorage.props)
      : defaultConnectorProps(localStorage.connector || 'tttt');
    let flow = props.flows[selectedFlowOption];
    if (flow) {
      flow.url_path = new URL(curl.url).pathname;
      flow.http_method = curl.method;
      let headers = getHeaders(curl.headers);
      props.content_type = headers['Content-Type'] || headers['content-type'];
      flow.headers = Object.keys(headers).map((key) =>
        convertToValidVariableName(key)
      );
      // if request body is present then build request body
      if (curl.data.ascii) {
        flow.enabled.push('get_request_body');
      } else {
        flow.enabled = flow.enabled.filter(
          (item) => item !== 'get_request_body'
        );
      }
      props.flows[selectedFlowOption] = flow;
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
        setResponseFields(data);
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

  const [selectedFlowOption, setSelectedFlowOption] = useState(
    localStorage?.last_selected_flow || 'AuthType'
  );
  const [selectedPaymentMethodOption, setSelectedPaymentMethodOption] =
    useState('');
  const [selectedCurrencyUnitOption, setSelectedCurrencyUnitOption] =
    useState('');
  const [selectedCurrencyUnitTypeOption, setSelectedCurrencyUnitTypeOption] =
    useState('');

  const handleFlowOptionChange = (event) => {
    let flow = event.target.value;
    let curl =
      JSON.parse(localStorage?.props || '{}')?.flows?.[flow]?.curl ||
      curlCommand;
    storeItem('last_selected_flow', flow);
    setCurlCommand(curl?.input || '');
    setRequestFields(curl?.body || {});
    setRequestHeaderFields(curl?.headers || {});
    setResponseFields(curl?.response || {});
    setSelectedFlowOption(flow);
    if (curl?.input) {
      updateCurlRequest(curl?.input);
    }
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
    const statusKeys = Object.keys(responseMapping).filter((f) =>
      f.match(/status/gi)
    );
    let statusFields = {};
    statusKeys.map((f) => {
      if (typeof responseMapping[f].value === 'object') {
        if (Array.isArray(responseMapping[f].value)) {
          responseMapping[f].value.map((s) => {
            statusFields[s] = null;
          });
        } else {
          statusFields = { ...statusFields, ...responseMapping[f].value };
        }
      } else {
        statusFields[responseMapping[f].value] = null;
      }
    });
    setStatusMappingData(statusFields);
    setStatusMappingPopupOpen(true);
  };

  const handleCloseStatusMappingPopup = () => {
    setStatusMappingPopupOpen(false);
  };

  const [statusMappingData, setStatusMappingData] = useState({});
  const handleStatusMappingData = (jsonData) => {
    setStatusMappingData(jsonData);
    // Do something with the submitted JSON data (jsonData)
    console.log('Submitted JSON Data:', jsonData);
  };

  const connector_name = localStorage?.props
    ? JSON.parse(localStorage?.props)?.connector
    : 'Test';

  const [inputJson, setInputJson] = useState('');
  const updateInputJson = (inputJsonData) => {
    let props = { ...fetchItem('props'), ...JSON.parse(inputJsonData) };
    storeItem('props', JSON.stringify(props));
    setInputJson(inputJsonData);
  };
  const curlTextareaRef = useRef(null);

  const [isCopied, setIsCopied] = useState(false);
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

  const [connectorName, setConnectorName] = useState(
    localStorage.connector_name || 'Shift4'
  );
  const handleConnectorNameChange = (event) => {
    let connector_name = event.target.value;
    setConnectorName(connector_name);
    storeItem('connector_name', connector_name);
    storeItem('props', JSON.stringify(defaultConnectorProps(connector_name)));
  };
  const [updateRequestData, setUpdateRequestData] = useState({});
  return (
    <div>
      <div className="dropdown-wrapper hs-headers">
        <div style={{ paddingRight: '10px' }}>
          <label htmlFor="dropdown">Connector: </label>
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
            className="conector"
            type="text"
            placeholder="Connector Name"
            onChange={handleConnectorNameChange}
            defaultValue={connectorName}
          />
        </div>
        <Dropdown
          options={flowOptions}
          handleSelectChange={handleFlowOptionChange}
          selectedOption={selectedFlowOption}
          type="Flow Type"
        />
        <Dropdown
          options={paymentMethodOptions}
          handleSelectChange={handlePaymentMethodOptionChange}
          selectedOption={selectedPaymentMethodOption}
          type="Payment Method"
        />
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
        <button>
          <a
            style={{ textDecoration: 'none', color: '#fff' }}
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/juspay/hyperswitch/fork"
          >
            Fork Hyperswitch
          </a>
        </button>
      </div>
      {selectedFlowOption === 'AuthType' ? (
        <AuthType></AuthType>
      ) : (
        <div>
          <div className="container">
            {loading && (
              <div className="page-loader">
                <div className="loader"></div>
              </div>
            )}
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
                  value={curlCommand}
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
                  requestHeaders={{ ...requestHeaderFields }}
                  suggestions={authTypesMapping}
                  setRequestHeaders={setRequestHeaderFields}
                ></IRequestHeadersTable>
                <h3>Request Body Fields:</h3>
                <div
                  style={{
                    height: '100%',
                    overflow: 'scroll',
                  }}
                >
                  <IRequestFieldsTable
                    updateRequestData={updateRequestData}
                    requestFields={{ ...requestFields }}
                    suggestions={synonymMapping}
                    setUpdateRequestData={setUpdateRequestData}
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
                setResponseMapping={setResponseMapping}
                connectorResponse={responseFields}
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
                  onClick={handleStatusMappingButtonClick}
                >
                  Status Mapping
                </button>
              </div>
              <div
                style={{
                  height: '100%',
                }}
              >
                <IResponseFieldsTable
                  setHsMapping={setHsMapping}
                  setHsResponse={setHsResponse}
                  hsResponse={hsResponse}
                  suggestions={responseFields}
                ></IResponseFieldsTable>
              </div>

              {/* Render the StatusMappingPopup when isStatusMappingPopupOpen is true */}
              {isStatusMappingPopupOpen && (
                <StatusMappingPopup
                  initialValues={statusMappingData}
                  onClose={handleCloseStatusMappingPopup}
                  onSubmit={handleStatusMappingData}
                />
              )}
            </Paper>
          </div>
          <div>
            <button
              id="generate-code"
              onClick={(e) => {
                let connector = localStorage.connector || 'tttt';
                let props = localStorage.props
                  ? JSON.parse(localStorage.props)
                  : defaultConnectorProps(connector);
                let y = localStorage?.auth_type
                  ? JSON.parse(localStorage?.auth_type)
                  : {};
                let existingFlows = JSON.parse(inputJson || '{}')?.[
                  connector_name
                ]?.flows;
                let modifiedUpdatedRequestData =
                  deepJsonSwap(updateRequestData);
                let modifiedUpdatedResponseData = deepJsonSwap(responseMapping);
                let x = JSON.stringify({
                  [connector_name]: {
                    authType: y.type,
                    authKeys:
                      JSON.parse(localStorage.auth_type || '{}').content || {},
                    amount: {
                      unit: selectedCurrencyUnitOption,
                      unitType: selectedCurrencyUnitTypeOption,
                    },
                    flows: {
                      ...existingFlows,
                      [selectedFlowOption || 'Authorize']: {
                        paymentsRequest: modifiedUpdatedRequestData,
                        paymentsResponse: modifiedUpdatedResponseData,
                        hsResponse: hsResponse,
                      },
                    },
                    attemptStatus: statusMappingData,
                  },
                });
                updateInputJson(x);
                setCodeSnippet(generateRustCode(props.connector, x));
                setConnectorContext({ ...{} });
                let targetElement = document.getElementById(
                  'generated-code-snippet'
                );
                targetElement.scrollIntoView({
                  behavior: 'smooth',
                });
              }}
            >
              Generate Code
            </button>
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
                      connector: connectorName,
                      flow: selectedFlowOption,
                      input: curlCommand,
                      body: requestFields,
                      headers: requestHeaderFields,
                      response: responseFields,
                      hsResponse: hsResponse,
                    },
                  }}
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
