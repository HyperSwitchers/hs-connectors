import React, { useEffect, useRef, useState } from 'react';
import JSONEditor from "jsoneditor";
import jsonpath from "jsonpath";
import "jsoneditor/dist/jsoneditor.css";

function JsonEditor({
    content = {},
    options = {
        mode: "tree",
        modes: ["tree", "code"],
        onChange: (e) => {},
    }, 
    is_saveable = false, 
    onSave = (editor) => { },
    use_custom_options = false,
    options_data = {},
}) {
    const [customOptionsData, setCustomOptionsData] = useState(options_data);
    const jsonEditorRef = useRef();
    const activationChar = "$";
    const customOptions = {
        autocomplete: {
          confirmKeys: [39, 35, 9, 190], // Confirm Autocomplete Keys: [right, end, tab, '.']  // By default are only [right, end, tab]
          caseSensitive: false,
  
          getOptions: function (text, path, input, editor) {
            if (!text.startsWith(activationChar) || input !== "value") return [];
            let data = {};
            let startFrom = 0;
            const lastPoint = text.lastIndexOf(".");
            const jsonObj = customOptionsData;
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
            const opts = optionsStr.split("\n");
            return { startFrom: startFrom, options: opts };
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
    let isLoaded = false;
    const [jsonEditor, setJsonEditor] = useState(undefined);
    const [validationErrors, setValidationErrors] = useState([]);
    const validateFields = (data) => {
        const errors = [];
        for (const field in data) {
            if (data[field] === '') {
                errors.push(`${field} is required.`);
            }
        }
        return errors;
    }
    const onSaveClick = () => {
        const requestData = jsonEditor.get();

        const errors = validateFields(requestData);
        setValidationErrors(errors);

        if (errors.length === 0) {
            // Perform save action here
            console.log("Data is valid, performing save action...");
        }
        else {
            localStorage.auth_type = requestData;
        }
        onSave(jsonEditor);
    }

    useEffect(() => {
        if (!jsonEditor && !isLoaded) {
            isLoaded = true;
            let editorOptions = use_custom_options ? customOptions : options;
            editorOptions = {... editorOptions, onChangeText: onEditorContentChange}
            const requestEditor = new JSONEditor(jsonEditorRef.current, editorOptions);
            setJsonEditor(requestEditor);
            requestEditor.set(content);
            requestEditor.expandAll();
        }
        else if (jsonEditor) {
            jsonEditor.set(content);
            jsonEditor.expandAll();
        }
    }, [content]);

    const onEditorContentChange = (e) => {
      options.onChange(JSON.parse(e));
    } 

    return (
        <div className='editor'>
            <div
                className="json-request-editor-container"
                ref={jsonEditorRef}
            ></div>
            {
                is_saveable && <><button onClick={onSaveClick}>Save</button>
                    <div className="validation-errors">
                        {validationErrors.map((error, index) => (
                            <p key={index} className="error-message">{error}</p>
                        ))}
                    </div></>
            }
        </div>

    );
};

export default JsonEditor;