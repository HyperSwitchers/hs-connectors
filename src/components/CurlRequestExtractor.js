import { useState, useEffect, useRef } from "react";
import { parse_curl } from "curl-parser";
import $ from "jquery";
import "../styles.css";
import mapFieldName, { synonymMapping } from "../utils/search_utils";
import Dropdown from './Dropdown';
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs"; // Import a suitable style for SyntaxHighlighter
import copy from "copy-to-clipboard"; // Import the copy-to-clipboard library
import React from "react";
import AuthType from "./AuthType";
import JsonEditor from "./JsonEditor";
import ConnectorTemplates, { defaultConnectorProps } from "./ConnectorTemplates";
import StatusMappingPopup from "./StatusMappingPopup";
import { generateRustCode, responseReplacements, toPascalCase } from "utils/Parser";

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
    useState(`curl --location --request POST 'https://api.shift4.com/charges' \
  --header 'X-router;' \
  --header 'Authorization: Basic c2tfdGVzdF93cjhMYjdqd1FNTEp1STJCMHBoSFJMVDQ6' \
  --header 'Content-Type: application/json' \
  --header 'Cookie: __cf_bm=fsHWOIwYKLyvlLhuMqB3vjSRUvHYVnPQIvpMTggO2IE-1679579356-0-Aa0HljVPYVwZLsJW+Neq4sv7FiWlU5tuh7a498pR4NlkM61Si3keelHQ7HQRU+FfDm1pe/qc5FLGne4Lck/6F6k=' \
  --data-raw '{
      "amount": 499,
      "card": {
          "number": "4012000100000007",
          "expMonth": "03",
          "expYear": "25",
          "cvc": "123",
          "cardholderName": "john"
      },
      "captured": true,
      "currency": "EUR",
      "description":"asdasd"
  }`);
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
      setRequestFields(addFieldsToNodes(mapFieldName(JSON.parse(fetchRequest?.data?.ascii || "{}"))));

      setRequestHeaderFields(mapFieldName(fetchRequest?.headers.reduce((result, item) => {
        let header = item.split(":");
        result[header[0]] = header[1];
        return result;
      }, {})));
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
        setMappedResponseFields(addFieldsToNodes(mapFieldName(data)));
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
  const typesList = ["String", "i64", "bool", "array", "object"];
  function addFieldsToNodes(jsonObj) {
    // Helper function to check if a value is an object (excluding arrays)
    function isObject(val) {
      return typeof val === "object" && !Array.isArray(val);
    }

    // Recursive function to traverse the JSON object
    function traverse(obj) {
      for (const key in obj) {
        if (isObject(obj[key])) {
          traverse(obj[key]); // Recursively traverse nested objects
        }

        // Add fields to leaf nodes
        obj[key] = {
          value: obj[key],
          optional: false, // Set this to true or false based on your requirement
          secret: false, // Set this to true or false based on your requirement
          type: typesList[0],
        };
      }
    }

    // Make a deep copy of the JSON object to avoid modifying the original object
    const newObj = JSON.parse(JSON.stringify(jsonObj));
    console.log(JSON.stringify(jsonObj));

    // Start traversing the object
    traverse(newObj);

    return newObj;
  }


  const [selectedFlowOption, setSelectedFlowOption] = useState('');
  const [selectedPaymentMethodOption, setSelectedPaymentMethodOption] = useState('');

  const handleFlowOptionChange = (event) => {
    let flow = event.target.value;
    let curl = JSON.parse(localStorage?.props || '{}')?.flows?.[flow]?.curl;
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
        "Authorize": {
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

  const [connectorName, setConnectorName] = useState("Shift4");
  const handleConnectorNameChange = (event) => {
    setConnectorName(event.target.value);
    localStorage.props = JSON.stringify(defaultConnectorProps(event.target.value));
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

            <div className="curl-input-section">
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
            </div>
            <div className="request-body-section">
              <h3>Request Header Fields:</h3>
              <JsonEditor content={{...requestHeaderFields}} options={{...options, onChange:setRequestHeaderFields}}></JsonEditor>
              <h3>Request Body Fields:</h3>
              {/* <div>{JSON.stringify(requestFields)}</div> */}
              <JsonEditor content={{...requestFields}} options={{...options, onChange:onRequestFieldsChange}}></JsonEditor>
            </div>

            <div id="responseFieldsLeft" className="response-fields-left">
              <h3>Response</h3>
              <JsonEditor content={{...responseFields}} options={{...options, onChange:setResponseFields}}></JsonEditor>
            </div>

            <div id="responseFieldsRight" className="response-fields-right">
              <div className="responseButtonStatus">
                <h3>Response Fields Mapping</h3>
                <button id="responseStatusMapping" onClick={handleStatusMappingButtonClick}>
                  Status Mapping
                </button>
              </div>
              {
                <JsonEditor content={{...mappedResponseFields}} use_custom_options={true} options_data={addFieldsToNodes(responseReplacements)} options={{...options, onChange:setMappedResponseFields}}></JsonEditor>
              }
              {/* Render the StatusMappingPopup when isStatusMappingPopupOpen is true */}
              {isStatusMappingPopupOpen && (<StatusMappingPopup initialValues={initialStatusMapping} onClose={handleCloseStatusMappingPopup} onSubmit={handleStatusMappingData} />)
              }
            </div>
          </div>
          <div>
            <button onClick={(e) => {
              let props = localStorage.props ? JSON.parse(localStorage.props) : defaultConnectorProps(localStorage.connector || 'tttt');
              let y = localStorage?.auth_type ? JSON.parse(localStorage?.auth_type) : {};
              console.log(y.type);
              let x = JSON.stringify({
                [connector_name]: {
                  "authType": y.type,
                  "flows": {
                    "Authorize": {
                      "paymentsRequest": updateRequestData,
                      "paymentsResponse": updateResponseData
                    }
                  },
                  "attemptStatus": statusMappingData
                }
              });
              updateInputJson(x);
              console.log("before input");
              console.log(x);
              setCodeSnippet(generateRustCode(props.connector, x));
              setConnectorContext({...{}});
            }}>
              Generate Code
            </button>
          </div>
          <div style={{ display: 'flex' }}>
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
                curl={{...{connector: connectorName, flow: selectedFlowOption, input: curlCommand, body: requestFields, headers: requestHeaderFields, response: responseFields, hsResponse: hsMapping }}} 
                context={connectorContext}></ConnectorTemplates>
              </div>
            </div>
          </div>
        </div>}
    </div>
  );
};

export default CurlRequestExecutor;
