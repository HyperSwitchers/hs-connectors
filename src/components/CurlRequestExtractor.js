import { useState, useEffect, useRef } from "react";
import { parse_curl } from 'curl-parser';
import $ from 'jquery';
import "../styles.css";
import JSONEditor, { JSONEditorOptions } from "jsoneditor";
import "jsoneditor/dist/jsoneditor.css";
import _ from 'lodash';
import FieldsAutocomplete from "./FieldsAutocomplete";
import mapFieldName from '../utils/search_utils'

const CurlRequestExecutor = () => {
  const [curlCommand, setCurlCommand] = useState(`curl --location --request POST 'https://api.shift4.com/charges' \
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
  const [curlRequest, setCurlRequest] = useState({});
  const [originalData, setOriginalData] = useState(null);
  const [responseFields, setResponseFields] = useState([]);
  const jsonEditorRef = useRef(null);
  const requestEditorRef = useRef(null);
  const reponseEditorRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const options = {
    mode: "tree",
    modes: ["tree", "code"],
    autocomplete: {
      getOptions: function () {
        return ['apple', 'cranberry', 'raspberry', 'pie', 'mango', 'mandarine', 'melon', 'appleton'];
      }
    }
  }
  const [bodyFields, setBodyFields] = useState({});
  let isLoaded = false;

  useEffect(() => {
    if (!isLoaded && jsonEditorRef.current) {
      isLoaded = true;
      const requestEditor = new JSONEditor(requestEditorRef.current, options);
      const responseEditor = new JSONEditor(reponseEditorRef.current, options);
      const jsonEditor = new JSONEditor(jsonEditorRef.current, options);
      requestEditor.set({});
      responseEditor.set({});
      jsonEditor.set({
        "Array": [1, 2, 3],
        "asd": "asdasd",
        "Boolean": true,
        "user": "Dell",
        "_id": 123,
        "Object": { "a": "b", "c": "d" },
        "abc": "Hello World"
      }); // Set an initial empty JSON object
    }
  }, []);

  const updateCurlRequest = (request) => {
    let ss = request.replace(/\s*\\\s*/g, ' ').replace(/\n/g, '').replace(/--data-raw|--data-urlencode/g, '-d');
    const fetchRequest = parse_curl(ss);
    setCurlCommand(request);
    setCurlRequest(fetchRequest);
    displayResponseFields(requestEditorRef, mapFieldName(JSON.parse(fetchRequest?.data?.ascii|| "{}")));
  }

  const isObject = (value) => {
    return value && typeof value === 'object' && value.constructor === Object;
  };

  const isString = (value) => {
    return typeof value === 'string' || value instanceof String;
  };

  const sendRequest = () => {
    setLoading(true);
    // Transforming the fetchRequest object into a valid JavaScript fetch request
    const requestOptions = {
      method: curlRequest.method,
      headers: curlRequest.headers.reduce((acc, item) => {
        const [key, value] = item.split(':').map(item => item.trim());
        acc[key] = value;
        return acc;
      }, {}),
      body: curlRequest.data.ascii,
    };

    console.log(requestOptions);

    let req_content = {
      async: true,
      crossDomain: true,
      type: requestOptions.method,
      url: curlRequest.url,
      headers: requestOptions.headers,
      data: requestOptions.body,
      success: (data) => {
        console.log(data); setOriginalData(data);
        displayResponseFields(reponseEditorRef, data);
        displayResponseFields(jsonEditorRef, addFieldsToLeafNodes(data));
      },
      error: (data) => { console.log(data) }
    };
    $.ajax(curlRequest.url, req_content).always(() => setLoading(false));

  };

  function addFieldsToLeafNodes(jsonObj) {
    // Helper function to check if a value is an object (excluding arrays)
    function isObject(val) {
      return typeof val === 'object' && !Array.isArray(val);
    }

    // Recursive function to traverse the JSON object
    function traverse(obj) {
      for (const key in obj) {
        if (isObject(obj[key])) {
          traverse(obj[key]); // Recursively traverse nested objects
        } else {
          // Add fields to leaf nodes
          obj[key] = {
            value: obj[key],
            optional: false, // Set this to true or false based on your requirement
            secret: false, // Set this to true or false based on your requirement
          };
        }
      }
    }

    // Make a deep copy of the JSON object to avoid modifying the original object
    const newObj = JSON.parse(JSON.stringify(jsonObj));

    // Start traversing the object
    traverse(newObj);

    return newObj;
  }

  const handleDropdownChange = (event, parentKey) => {
    const fieldName = event.target.name;
    const fieldValue = event.target.value;

    console.log(responseFields);

    // Update the responseFields state
    const updatedResponseFields = responseFields.map((field) => {
      if (field.key === fieldName) {
        return { ...field, value: fieldValue };
      }
      return field;
    });
    console.log(updatedResponseFields);
    setResponseFields(updatedResponseFields);
  };

  function displayResponseFields(jsonEditorRef, data, parentKey = null) {
    if (jsonEditorRef.current) {
      jsonEditorRef.current.innerHTML = "";
      if (jsonEditorRef.current && data) {
        const jsonString = JSON.stringify(data, null, 2);
        try {
          const jsonData = JSON.parse(jsonString);
          const jsonEditor = new JSONEditor(jsonEditorRef.current, options);
          jsonEditor.set(jsonData);
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    }
  }

  function createDropdown(key, currentValue, parentKey) {
    const dropdown = document.createElement('select');
    dropdown.name = parentKey ? `${parentKey}.${key}` : key; // Use dot notation for nested keys

    const defaultOption = document.createElement('option');
    defaultOption.text = currentValue;
    dropdown.add(defaultOption);

    const colors = ['red', 'blue', 'green'];
    for (const color of colors) {
      if (color !== currentValue) {
        const option = document.createElement('option');
        option.text = color;
        dropdown.add(option);
      }
    }

    return dropdown;
  }

  const buildUpdatedResponse = (data, fields) => {
    if (isObject(data)) {
      const updatedResponse = {};
      for (const field of fields) {
        if (isObject(field.value)) {
          updatedResponse[field.key] = buildUpdatedResponse(data[field.key], field.contentElement.props.value);
        } else {
          updatedResponse[field.key] = field.contentElement.props.value;
        }
      }
      return updatedResponse;
    } else {
      return data;
    }
  };

  // useEffect(() => {
  //   if (originalData && responseFields.length > 0) {
  //     const updatedResponse = buildUpdatedResponse(originalData, responseFields);
  //     console.log('Updated JSON:', updatedResponse);
  //   }
  // }, [responseFields, originalData]);

  return (
    <div>
      <div className="container">
        {loading && (
          <div className="page-loader">
            <div className="loader"></div>
          </div>
        )}

        <div className="curl-input-section">
          <h1>cURL Request</h1>
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
          <h2>Request Body Fields:</h2>
          <div className="json-request-editor-container" ref={requestEditorRef}></div>
        </div>

        <div id="responseFieldsLeft" className="response-fields-left">
          <h2>Response Fields (Dropdowns):</h2>
          <div className="json-response-editor-container" ref={reponseEditorRef}></div>
        </div>

        <div id="responseFieldsRight" className="response-fields-right">
          <h2>Response Fields (Dropdowns):</h2>
          <div className="json-editor-container" ref={jsonEditorRef}></div>
          {/* {responseFields.map((field, index) => (
          <div key={index}>
            <strong>{field.parentKey ? `${field.parentKey}.${field.key}: ` : `${field.key}: `}</strong>
            {createDropdown(field.key, originalData)}
          </div>
        ))} */}
        </div></div>
    </div>
  );
};

export default CurlRequestExecutor;