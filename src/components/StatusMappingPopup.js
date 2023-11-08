// @ts-check

import React, { useState } from 'react';

import { HYPERSWITCH_STATUS_LIST } from '../utils/constants';
import { storeItem } from 'utils/state';

const StatusMappingPopup = ({
  initialValues,
  onClose,
  onSubmit,
  selectedFlowOption,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(null);
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(initialValues, null, 2)
  );

  const handleSubmit = () => {
    // Parse the edited JSON and submit it
    const editedJson = JSON.parse(jsonInput);
    storeItem('status', JSON.stringify(editedJson));
    onSubmit(editedJson);
    onClose();
  };

  const updateJsonInput = (key, value) => {
    const json = JSON.parse(jsonInput);
    if (value.length === 0) {
      json[key] = null;
    } else {
      json[key] = value;
    }
    setJsonInput(JSON.stringify(json, null, 2));
  };

  const handleKeyPress = (field, event) => {
    const value = event.target.value;
    updateJsonInput(field, value);
    const filteredSuggestions = HYPERSWITCH_STATUS_LIST[
      selectedFlowOption
    ]?.filter((status) => status.toLowerCase().startsWith(value.toLowerCase()));
    renderSuggestions(field, filteredSuggestions);
  };

  const renderSuggestions = (field, suggestions) => {
    const suggestionContainer = document.getElementById(`suggestions-${field}`);
    const inputField = document.getElementById(`input-${field}`);
    if (
      suggestionContainer instanceof HTMLDivElement &&
      inputField instanceof HTMLInputElement
    ) {
      suggestionContainer.innerHTML = '';
      setShowSuggestions(field);
      if (suggestions.length === 0) {
        setShowSuggestions(null);
      }
      suggestions.map((suggestion) => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.addEventListener('click', function (e) {
          inputField.value = suggestion;
          suggestionContainer.innerHTML = '';
          updateJsonInput(field, suggestion);
          setShowSuggestions(null);
        });
        suggestionContainer.appendChild(div);
      });
    }
  };

  return (
    <div className="popup-container">
      <div className="popup">
        <h2>Enter Connector Satus</h2>
        <div className="status-mapping">
          {Object.keys(initialValues).length === 0 ? (
            <div className="none">
              <div className="info">Status not found in response fields.</div>
              <div className="hint">
                Hint: Try sending the request for populating response fields.
              </div>
            </div>
          ) : (
            Object.keys(initialValues).map((f) => {
              return (
                <React.Fragment key={f}>
                  <div className="status">{f}</div>
                  <div className="autocomplete">
                    <div className="input">
                      <input
                        id={`input-${f}`}
                        className="material-input status-mapping-input"
                        type="text"
                        onChangeCapture={(e) => handleKeyPress(f, e)}
                      />
                      <div
                        className="status-dropdown"
                        onClick={() => {
                          setShowSuggestions(f);
                          renderSuggestions(
                            f,
                            !showSuggestions
                              ? HYPERSWITCH_STATUS_LIST[selectedFlowOption]
                              : []
                          );
                        }}
                      >
                        {showSuggestions === f ? 'x' : '...'}
                      </div>
                    </div>
                    <div className="suggestions" id={`suggestions-${f}`}></div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
        <textarea
          id="textarea-popup"
          rows={20}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Enter Status Mapping"
        />
        <div className="button-group">
          <button onClick={handleSubmit}>Submit</button>
          <button id="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusMappingPopup;
