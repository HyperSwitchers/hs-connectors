import { useState, useEffect, useRef } from "react";
import { parse_curl } from "curl-parser";
import $ from "jquery";
import "../styles.css";
import mapFieldName, { synonymMapping } from "../utils/search_utils";
import Dropdown from './Dropdown';
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/hljs";
import React from "react";
import AuthType from "./AuthType";
import JsonEditor from "./JsonEditor";
import StatusMappingPopup from "./StatusMappingPopup";

const initialStatusMapping = {
  Started: "",
  AuthenticationFailed: "",
  RouterDeclined: "",
  AuthenticationPending: "",
  AuthenticationSuccessful: "",
  Authorized: "",
  AuthorizationFailed: "",
  Charged: "",
  Authorizing: "",
  CodInitiated: "",
  Voided: "",
  VoidInitiated: "",
  CaptureInitiated: "",
  CaptureFailed: "",
  VoidFailed: "",
  AutoRefunded: "",
  PartialCharged: "",
  Unresolved: "",
  Pending: "",
  Failure: "",
  PaymentMethodAwaited: "",
  ConfirmationAwaited: "",
  DeviceDataCollectionPending: "",
};

const CurlRequestExecutor = () => {
  const [curlCommand, setCurlCommand] =
    useState(`curl --location --request POST 'http://localhost:5050/https://api.shift4.com/charges' \
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
  const staticResponse = {
    status: "",
    response: {
      response_id: "",
      card: {
        number: "",
      },
    },
  };
  const [curlRequest, setCurlRequest] = useState({});
  const [responseFields, setResponseFields] = useState({});
  const [hsResponseFields, setHsResponseFields] = useState({});
  const [requestFields, setRequestFields] = useState({});
  const [requestHeaderFields, setRequestHeaderFields] = useState({});

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
      setRequestFields(addFieldsToLeafNodes(mapFieldName( JSON.parse(fetchRequest?.data?.ascii || "{}"))));

      setRequestHeaderFields(mapFieldName(fetchRequest?.headers.reduce((result, item) => {
        let header = item.split(":");
        result[header[0]] = header[1];
        return result;
      },{})));
    } catch (e) { }
  };

  const isObject = (value) => {
    return value && typeof value === "object" && value.constructor === Object;
  };

  const isString = (value) => {
    return typeof value === "string" || value instanceof String;
  };

  const sendRequest = () => {
    setLoading(true);
    // Transforming the fetchRequest object into a valid JavaScript fetch request
    const requestOptions = {
      method: curlRequest.method,
      headers: curlRequest.headers.reduce((acc, item) => {
        const [key, value] = item.split(":").map((item) => item.trim());
        acc[key] = value;
        return acc;
      }, {}),
      body: curlRequest.data.ascii,
    };

    let url = "/cors/" + curlRequest.url;
    let req_content = {
      type: requestOptions.method,
      url: url,
      headers: requestOptions.headers,
      data: requestOptions.body,
      success: (data) => {
        setResponseFields(data);
        setHsResponseFields(undefined);
        setTimeout(() => {
          setHsResponseFields(addFieldsToLeafNodes(data));
        }, 100);
      },
      error: (data) => {
        console.log(data);
      },
    };
    $.ajax(url, req_content).always(() => setLoading(false));
  };
  const typesList = ["string", "number", "boolean", "array", "object"];
  function addFieldsToLeafNodes(jsonObj) {
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
            type : typesList[0],
          };
      }
    }

    // Make a deep copy of the JSON object to avoid modifying the original object
    const newObj = JSON.parse(JSON.stringify(jsonObj));

    // Start traversing the object
    traverse(newObj);

    return newObj;
  }


  const [selectedFlowOption, setSelectedFlowOption] = useState('');
  const [selectedPaymentMethodOption, setSelectedPaymentMethodOption] = useState('');

  const handleFlowOptionChange = (event) => {
    setSelectedFlowOption(event.target.value);
  };

  const handlePaymentMethodOptionChange = (event) => {
    setSelectedPaymentMethodOption(event.target.value);
  };

  const flowOptions = ["AuthType", "Authorize", "Capture", "Void", "Refund", "PSync", "RSync"];
  const paymentMethodOptions = ["Card", "Wallet", "BankRedirects"];

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

  const [isStatusMappingPopupOpen, setStatusMappingPopupOpen] = useState(false);
  const handleStatusMappingButtonClick = () => {
    setStatusMappingPopupOpen(true);
  };

  const handleCloseStatusMappingPopup = () => {
    setStatusMappingPopupOpen(false);
  };

  const handleStatusMappingSubmit = (jsonData) => {
    // Do something with the submitted JSON data (jsonData)
    console.log("Submitted JSON Data:", jsonData);
  };

  const codeSnippet = generateCodeSnippet();

  return (
    <div>
      <div className='dropdown-wrapper'>
        <label htmlFor="dropdown">Connector: </label>
        <input className='conector' type="text" placeholder="Connector Name" />
        <Dropdown options={flowOptions} handleSelectChange={handleFlowOptionChange} selectedOption={selectedFlowOption} type='FLOW TYPE' />
        <Dropdown options={paymentMethodOptions} handleSelectChange={handlePaymentMethodOptionChange} selectedOption={selectedPaymentMethodOption} type='PAYMENT METHOD' />
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
                rows={20}
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
              <JsonEditor content={requestHeaderFields} options={options}></JsonEditor>
              <h3>Request Body Fields:</h3>
              {/* <div>{JSON.stringify(requestFields)}</div> */}
              <JsonEditor content={requestFields} options={options}></JsonEditor>
            </div>

            <div id="responseFieldsLeft" className="response-fields-left">
              <h3>Response</h3>
              <JsonEditor content={responseFields}></JsonEditor>
            </div>

            <div id="responseFieldsRight" className="response-fields-right">
              <div className="responseButtonStatus">
                <h3>Response Fields Mapping</h3> 
               <button id="responseStatusMapping" onClick={handleStatusMappingButtonClick}>
          Status Mapping
        </button>
              </div>
              {
                hsResponseFields && <JsonEditor content={staticResponse} use_custom_options={true} options_data={hsResponseFields}></JsonEditor>
              }
              {/* Render the StatusMappingPopup when isStatusMappingPopupOpen is true */}
              {isStatusMappingPopupOpen && ( <StatusMappingPopup initialValues={initialStatusMapping} onClose={handleCloseStatusMappingPopup} onSubmit={handleStatusMappingSubmit} />)
              }
            </div>
          </div>
          <div>
            <button>
              Generate Code
            </button>
          </div>
          <div>
            <h3>Generated Code Snippet</h3>
            <SyntaxHighlighter language="rust" style={tomorrow}>
              {codeSnippet}
            </SyntaxHighlighter>
          </div>
        </div>}
    </div>
  );
};

export default CurlRequestExecutor;
