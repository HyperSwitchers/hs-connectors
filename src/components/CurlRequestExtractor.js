import { useState, useEffect, useRef } from "react";
import { parse_curl } from "curl-parser";
import $ from "jquery";
import "../styles.css";
import JSONEditor from "jsoneditor";
import "jsoneditor/dist/jsoneditor.css";
import mapFieldName from "../utils/search_utils";
import jsonpath from "jsonpath";

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
  const suggestions = [
    "amount",
    "billing_address_firstname",
    "billing_address_lastname",
    "billing_address_line1",
    "billing_address_line2",
    "billing_address_line3",
    "billing_address_city",
    "billing_address_state",
    "billing_address_zip",
    "browser_accept_header",
    "browser_java_enabled",
    "browser_language",
    "browser_color_depth",
    "browser_screen_height",
    "browser_screen_width",
    "browser_time_zone",
    "browser_user_agent",
    "browser_javascript_enabled",
    "browser_ip_address",
    "card_expiry_year_month",
    "card_exp_month",
    "card_exp_year",
    "card_number",
    "card_cvc",
    "card_holder_name",
    "capture",
    "country",
    "currency",
    "description",
    "email",
    "payment_id",
    "phone_number",
    "setup_future_usage",
    "return_url",
  ];
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
      filter: "contain",
      trigger: "focus",
      getOptions: function (text, path, input, editor) {
        return suggestions.map((s) => "$" + s);
      },
    },
  };
  let isLoaded = false;

  //for options
  const activationChar = "$";

  useEffect(() => {
    if (!isLoaded && jsonEditorRef.current) {
      isLoaded = true;
      const requestEditor = new JSONEditor(requestEditorRef.current, options);
      const responseEditor = new JSONEditor(reponseEditorRef.current, options);
      const jsonEditor = new JSONEditor(jsonEditorRef.current, options);

      let rr = curlCommand
        .replace(/\s*\\\s*/g, " ")
        .replace(/\n/g, "")
        .replace(/--data-raw|--data-urlencode/g, "-d");
      setCurlCommand(rr);

      var ss = parse_curl(rr);
      setCurlRequest(ss);
      requestEditor.set(mapFieldName(JSON.parse(ss.data.ascii)));
      requestEditor.expandAll();
      responseEditor.set({});
      jsonEditor.set({}); // Set an initial empty JSON object
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
      displayResponseFields(
        requestEditorRef,
        mapFieldName(JSON.parse(fetchRequest?.data?.ascii || "{}"))
      );
    } catch (e) {}
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
        console.log(data);
        setOriginalData(data);
        displayResponseFields(reponseEditorRef, data);
        displayResponseFields2(jsonEditorRef, addFieldsToLeafNodes(data));
      },
      error: (data) => {
        console.log(data);
      },
    };
    $.ajax(url, req_content).always(() => setLoading(false));
  };

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

  function displayResponseFields(jsonEditorRef, data, parentKey = null) {
    if (jsonEditorRef.current) {
      jsonEditorRef.current.innerHTML = "";
      if (jsonEditorRef.current && data) {
        const jsonString = JSON.stringify(data, null, 2);
        try {
          const jsonData = JSON.parse(jsonString);
          const jsonEditor = new JSONEditor(jsonEditorRef.current, options);
          jsonEditor.set(jsonData);
          jsonEditor.expandAll();
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    }
  }

  function displayResponseFields2(jsonEditorRef, data, parentKey = null) {
    const jsonString = JSON.stringify(data, null, 2);
    const jsonData = JSON.parse(jsonString);

    const options2 = {
      autocomplete: {
        confirmKeys: [39, 35, 9, 190], // Confirm Autocomplete Keys: [right, end, tab, '.']  // By default are only [right, end, tab]
        caseSensitive: false,

        getOptions: function (text, path, input, editor) {
          if (!text.startsWith(activationChar) || input !== "value") return [];
          let data = {};
          let startFrom = 0;
          const lastPoint = text.lastIndexOf(".");
          const jsonObj = jsonData;
          if (lastPoint > 0 && text.length > 1) {
            data = jsonpath.query(
              jsonObj,
              "$." + text.substring(activationChar.length, lastPoint)
            );
            if (data.length > 0) {
              data = data[0];
            } else {
              data = {};
            }
            // Indicate that autocompletion should start after the . (ignoring the first part)
            startFrom = text.lastIndexOf(".") + 1;
          } else {
            data = jsonObj;
          }

          const optionsStr = YaskON.stringify(data, null, activationChar);
          const options = optionsStr.split("\n");
          return { startFrom: startFrom, options: options };
        },
      },
    };

    // helper function to auto complete paths of a JSON object
    const YaskON = {
      // Return first level json paths by the node 'o'
      stringify: function (o, prefix, activationChar) {
        prefix = prefix || "";
        switch (typeof o) {
          case "object":
            let output = "";
            if (Array.isArray(o)) {
              o.forEach(
                function (e, index) {
                  output += activationChar + prefix + "[" + index + "]" + "\n";
                }.bind(this)
              );
              return output;
            }
            output = "";
            for (let k in o) {
              if (o.hasOwnProperty(k)) {
                if (prefix === "")
                  output += this.stringify(o[k], k, activationChar);
              }
            }
            if (prefix !== "") output += activationChar + prefix + "\n";
            return output;
          case "function":
            return "";
          default:
            return prefix + "\n";
        }
      },
    };

    if (jsonEditorRef.current) {
      jsonEditorRef.current.innerHTML = "";
      if (jsonEditorRef.current && data) {
        const jsonString = JSON.stringify(data, null, 2);
        try {
          const jsonData = JSON.parse(jsonString);
          const jsonEditor = new JSONEditor(jsonEditorRef.current, options2);
          jsonEditor.set({
            status: "",
            response: {
              response_id: "",
              card: {
                number: "",
              },
            },
          });
          jsonEditor.expandAll();
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    }
  }

  const buildUpdatedResponse = (data, fields) => {
    if (isObject(data)) {
      const updatedResponse = {};
      for (const field of fields) {
        if (isObject(field.value)) {
          updatedResponse[field.key] = buildUpdatedResponse(
            data[field.key],
            field.contentElement.props.value
          );
        } else {
          updatedResponse[field.key] = field.contentElement.props.value;
        }
      }
      return updatedResponse;
    } else {
      return data;
    }
  };

  return (
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
          <h3>Request Body Fields:</h3>
          <div
            className="json-request-editor-container"
            ref={requestEditorRef}
          ></div>
        </div>

        <div id="responseFieldsLeft" className="response-fields-left">
          <h3>Response</h3>
          <div
            className="json-response-editor-container"
            ref={reponseEditorRef}
          ></div>
        </div>

        <div id="responseFieldsRight" className="response-fields-right">
          <h3>Response Fields Mapping</h3>
          <div className="json-editor-container" ref={jsonEditorRef}></div>
        </div>
      </div>
    </div>
  );
};

export default CurlRequestExecutor;
