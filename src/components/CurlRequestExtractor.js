import { useState, useEffect, useRef } from "react";
import { parse_curl } from "curl-parser";
import $ from "jquery";
import "../styles.css";
import { mapFieldNames, addFieldsToNodes, synonymMapping, authTypesMapping } from "../utils/search_utils";
import Dropdown from './Dropdown';
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs"; // Import a suitable style for SyntaxHighlighter
import copy from "copy-to-clipboard"; // Import the copy-to-clipboard library
import React from "react";
import AuthType from "./AuthType";
import JsonEditor from "./JsonEditor";
import ConnectorTemplates, { defaultConnectorProps } from "./ConnectorTemplates";
import StatusMappingPopup from "./StatusMappingPopup";
import { generateRustCode } from "utils/Parser";
import IRequestFieldsTable from "./RequestFieldsTable";
import { Paper } from "@mui/material";
import IRequestHeadersTable from "./RequestHeadersTable";
import IResponseFieldsTable from "./ResponseFields";

const initialStatusMapping = {
  Started: null,
  AuthenticationFailed: null,
  RouterDeclined: null,
  AuthenticationPending: null,
  AuthenticationSuccessful: null,
  Authorized: null,
  AuthorizationFailed: null,
  Charged: null,
  Authorizing: null,
  CodInitiated: null,
  Voided: null,
  VoidInitiated: null,
  CaptureInitiated: null,
  CaptureFailed: null,
  VoidFailed: null,
  AutoRefunded: null,
  PartialCharged: null,
  Unresolved: null,
  Pending: null,
  Failure: null,
  PaymentMethodAwaited: null,
  ConfirmationAwaited: null,
  DeviceDataCollectionPending: null,
};

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
  const suggestions = Object.keys(synonymMapping);
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
  const [hsResponseFields, setHsResponseFields] = useState({});
  const [hsMapping, setHsMapping] = useState({
    status: "",
    response: {
      response_id: "",
      card: {
        number: "",
      },
    },
  });
  const [requestFields, setRequestFields] = useState({});
  const [requestHeaderFields, setRequestHeaderFields] = useState({});
  const [codeSnippet, setCodeSnippet] = useState(generateCodeSnippet());
  const [connectorContext, setConnectorContext] = useState({});
  const [mappedResponseFields, setMappedResponseFields] = useState({});

  const [loading, setLoading] = useState(false);
  const options = {
    mode: "tree",
    modes: ["tree", "code"],
    autocomplete: {
      filter: "contain",
      trigger: "focus",
      getOptions: function (text, path, input, editor) {
        return suggestions.map((s) => "$" + s);
      },
    },
  };
  let isLoaded = false;

  useEffect(() => {
    if (!isLoaded) {
      isLoaded = true;
      updateCurlRequest(curlCommand);
    }
  }, []);

  const updateCurlRequest = (request) => {
    let ss = request
      .replace(/\s*\\\s*/g, " ")
      .replace(/\n/g, "")
      .replace(/--data-raw|--data-urlencode/g, "-d");
    setCurlCommand(request);
    try {
      const fetchRequest = parse_curl(ss);
      setCurlRequest(fetchRequest);
      setRequestFields(JSON.parse(fetchRequest?.data?.ascii || "{}"));

      setRequestHeaderFields(fetchRequest?.headers.reduce((result, item) => {
        let header = item.split(":");
        result[header[0]] = header[1];
        return result;
      }, {}));
      saveFlowDetails(fetchRequest);
    } catch (e) {
      console.error(e);
    }
  };

  const saveFlowDetails = (curl) => {
    let props = localStorage.props ? JSON.parse(localStorage.props) : defaultConnectorProps(localStorage.connector || 'tttt');
    let flow = props.flows[selectedFlowOption];
    if (flow) {
      flow.url_path = new URL(curl.url).pathname;
      flow.http_method = curl.method;
      let headers = getHeaders(curl.headers);
      props.content_type = headers['Content-Type'] || headers['content-type'];
      flow.headers = Object.keys(headers).map((key) => convertToValidVariableName(key));
      // if request body is present then build request body
      if (curl.data.ascii) {
        flow.enabled.push('get_request_body')
      }
      else {
        flow.enabled = flow.enabled.filter(item => item !== 'get_request_body')
      }
      props.flows[selectedFlowOption] = flow;
    }
    localStorage.props = JSON.stringify(props);
  }

  const isObject = (value) => {
    return value && typeof value === "object" && value.constructor === Object;
  };

  const isString = (value) => {
    return typeof value === "string" || value instanceof String;
  };

  function convertToValidVariableName(str) {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9_]/g, '_');
  }
  const getHeaders = (headers) => {
    return headers.reduce((acc, item) => {
      const [key, value] = item.split(":").map((item) => item.trim());
      acc[key] = value;
      return acc;
    }, {});
  }
  const sendRequest = () => {
    saveFlowDetails(curlRequest);
    setLoading(true);
    // Transforming the fetchRequest object into a valid JavaScript fetch request
    const requestOptions = {
      method: curlRequest.method,
      headers: getHeaders(curlRequest.headers),
      body: curlRequest.data.ascii,
    };

    let url = "http://localhost:5050/" + curlRequest.url;
    let req_content = {
      type: requestOptions.method,
      url: url,
      headers: requestOptions.headers,
      data: requestOptions.body,
      success: (data) => {
        setResponseFields(data);
        setMappedResponseFields(addFieldsToNodes(mapFieldNames(data)));
        setHsResponseFields(undefined);
        setTimeout(() => {
          setHsResponseFields(addFieldsToNodes(data));
        }, 100);
      },
      error: (data) => {
        console.log(data);
      },
    };
    $.ajax(url, req_content).always(() => setLoading(false));
  };


  const [selectedFlowOption, setSelectedFlowOption] = useState(localStorage.last_selected_flow);
  const [selectedPaymentMethodOption, setSelectedPaymentMethodOption] = useState('');

  const handleFlowOptionChange = (event) => {
    let flow = event.target.value;
    let curl = JSON.parse(localStorage?.props || '{}')?.flows?.[flow]?.curl;
    localStorage.last_selected_flow = flow;
    setCurlCommand(curl?.input || '');
    setRequestFields(curl?.body || {});
    setRequestHeaderFields(curl?.headers || {});
    setResponseFields(curl?.response || {});
    setHsResponseFields(curl?.hsResponse || {});
    setSelectedFlowOption(flow);
  };

  const handlePaymentMethodOptionChange = (event) => {
    setSelectedPaymentMethodOption(event.target.value);
  };

  const flowOptions = ["AuthType", "Authorize", "Capture", "Void", "Refund", "PSync", "RSync"];
  const paymentMethodOptions = ["Card", "Wallet", "BankRedirects"];

  const [isStatusMappingPopupOpen, setStatusMappingPopupOpen] = useState(false);
  const handleStatusMappingButtonClick = () => {
    setStatusMappingPopupOpen(true);
  };

  const handleCloseStatusMappingPopup = () => {
    setStatusMappingPopupOpen(false);
  };

  const [statusMappingData, setStatusMappingData] = useState(initialStatusMapping);
  const handleStatusMappingData = (jsonData) => {
    setStatusMappingData(jsonData);
    // Do something with the submitted JSON data (jsonData)
    console.log("Submitted JSON Data:", jsonData);
  };

  const connector_name = localStorage?.props ? JSON.parse(localStorage?.props)?.connector : 'Test';

  let y = localStorage?.auth_type ? JSON.parse(localStorage?.auth_type) : {};
  var inputJsonData = JSON.stringify({
    [connector_name]: {
      "authType": y.type,
      "flows": {
        [selectedFlowOption || 'Authorize']: {
          "paymentsRequest": JSON.parse(JSON.stringify(requestFields)),
          "paymentsResponse": JSON.parse(JSON.stringify(mappedResponseFields))
        }
      },
      "attemptStatus": statusMappingData
    }
  });

  const [inputJson, setInputJson] = useState('');
  const updateInputJson = (inputJsonData) => {
    setInputJson(inputJsonData);
  };
  console.log(inputJson)
  const curlTextareaRef = useRef(null);

  const [isCopied, setIsCopied] = useState(false);
  // Function to handle the "Copy to Clipboard" button click event
  const handleCopyClick = () => {
    copy(codeSnippet);
    setIsCopied(true);
    // Reset the "Copied to clipboard" notification after a short delay
    setTimeout(() => {
      setIsCopied(false);
    }, 500);
  };

  const [connectorName, setConnectorName] = useState(localStorage.connector_name || "Shift4");
  const handleConnectorNameChange = (event) => {
    let connector_name = event.target.value;
    setConnectorName(connector_name);
    localStorage.connector_name = connector_name;
    localStorage.props = JSON.stringify(defaultConnectorProps(connector_name));
  };
  const [updateRequestData, setUpdateRequestData] = useState({});
  const onRequestFieldsChange = (data) => {
    if (data) {
      setUpdateRequestData(data);
      setRequestFields(data);
    }
  }
  const onRequestHeadersChange = (data) => {
    console.log(data);
  }
  const [updateResponseData, setUpdateResponseData] = useState({});
  const onResponseFieldsChange = (data) => {
    if (data) {
      setUpdateResponseData(data);
      setMappedResponseFields(data);
    }
  }
  return (
    <div>
      <div className='dropdown-wrapper hs-headers'>
        <div style={{ paddingRight: '10px' }}>
          <label htmlFor="dropdown">Connector: </label>
          {/* <input className='conector' type="text" placeholder="Connector Name" style={{padding: '5px'}} onChange={(e) => { localStorage.props = JSON.stringify(defaultConnectorProps(e.target.value)); }} /> */}
          <input className='conector' type="text" placeholder="Connector Name" onChange={handleConnectorNameChange}
            defaultValue={connectorName} />
        </div>
        <Dropdown options={flowOptions} handleSelectChange={handleFlowOptionChange} selectedOption={selectedFlowOption} type='Flow Type' />
        <Dropdown options={paymentMethodOptions} handleSelectChange={handlePaymentMethodOptionChange} selectedOption={selectedPaymentMethodOption} type='Payment Method' />
      </div>
      {selectedFlowOption === 'AuthType' ? <AuthType></AuthType> :
        <div>
          <div className="container">
            {loading && (
              <div className="page-loader">
                <div className="loader"></div>
              </div>
            )}

            <Paper elevation={0} className="curl-input-section">
              <h3>cURL Request</h3>
              <textarea
                ref={curlTextareaRef} // Add the ref to the text area
                style={{ height: '100%' }}
                value={curlCommand}
                onChange={(e) => updateCurlRequest(e.target.value)}
                placeholder="Enter your cURL request here..."
              />
              <button onClick={sendRequest} disabled={loading}>
                {loading ? <div className="loader"></div> : "Send Request"}
              </button>
            </Paper>
            <Paper elevation={0} className="request-body-section">
              <h3>Request Header Fields:</h3>
              <IRequestHeadersTable requestHeaders={{...requestHeaderFields}} suggestions={authTypesMapping} setRequestHeaders={setRequestHeaderFields}></IRequestHeadersTable>
              <h3>Request Body Fields:</h3>
              <IRequestFieldsTable requestFields={{...requestFields}} suggestions={synonymMapping}></IRequestFieldsTable>
            </Paper>

            <Paper elevation={0} id="responseFieldsLeft" className="response-fields-left">
              <h3>Response</h3>
              <JsonEditor content={{ ...responseFields }} options={{ ...options, onChange: setResponseFields }}></JsonEditor>
            </Paper>

            <Paper elevation={0} id="responseFieldsRight" className="response-fields-right">
              <div className="responseButtonStatus">
                <h3>Response Fields Mapping</h3>
                <button id="responseStatusMapping" onClick={handleStatusMappingButtonClick}>
                  Status Mapping
                </button>
              </div>
              <IResponseFieldsTable responseFields={hsMapping} suggestions={responseFields}></IResponseFieldsTable>
              {/* Render the StatusMappingPopup when isStatusMappingPopupOpen is true */}
              {isStatusMappingPopupOpen && (<StatusMappingPopup initialValues={initialStatusMapping} onClose={handleCloseStatusMappingPopup} onSubmit={handleStatusMappingData} />)
              }
            </Paper>
          </div>
          <div>
            <button onClick={(e) => {
              let connector = localStorage.connector || 'tttt';
              let props = localStorage.props ? JSON.parse(localStorage.props) : defaultConnectorProps(connector);
              let y = localStorage?.auth_type ? JSON.parse(localStorage?.auth_type) : {};
              let existingFlows = JSON.parse(inputJson || '{}')?.[connector_name]?.flows;
              let x = JSON.stringify({
                [connector_name]: {
                  "authType": y.type,
                  "flows": {
                    ...existingFlows,
                    [selectedFlowOption || 'Authorize']: {
                      "paymentsRequest": updateRequestData,
                      "paymentsResponse": updateResponseData
                    }
                  },
                  "attemptStatus": statusMappingData
                }
              });
              updateInputJson(x);
              setCodeSnippet(generateRustCode(props.connector, x));
              setConnectorContext({ ...{} });
            }}>
              Generate Code
            </button>
          </div>
          <div style={{ display: 'flex', overflow:'hidden' }}>
            <div style={{ width: '50%', padding: '10px' }}>
              <h3>Generated Code Snippet</h3>
              <button onClick={handleCopyClick}>Copy to Clipboard</button>
              {isCopied && <span style={{ marginLeft: '10px', color: 'green' }}>Copied to clipboard!</span>}
              <SyntaxHighlighter language="rust" style={githubGist}>
                {codeSnippet}
              </SyntaxHighlighter>
            </div>
            <div style={{ padding: '10px' }}>
              <div style={{ width: '50%' }}>
                <ConnectorTemplates
                  curl={{ ...{ connector: connectorName, flow: selectedFlowOption, input: curlCommand, body: requestFields, headers: requestHeaderFields, response: responseFields, hsResponse: hsMapping } }}
                  context={connectorContext}></ConnectorTemplates>
              </div>
            </div>
          </div>
        </div>}
    </div>
  );
};

export default CurlRequestExecutor;
