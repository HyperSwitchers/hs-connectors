// @ts-check

import React, { useEffect, useState } from 'react';

import { HYPERSWITCH_STATUS_LIST } from '../../../utils/constants';
import { APP_CONTEXT } from 'utils/state';
import { useRecoilState } from 'recoil';
import { deepCopy, updateNestedJson } from 'utils/common';
import jsonpath from 'jsonpath';

const StatusMappingPopup = ({ setIsStatusMappingPopupOpen = (b) => {} }) => {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const [showSuggestions, setShowSuggestions] = useState(null);
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(
      appContext.flows[appContext.selectedFlow].status.value || {},
      null,
      2
    )
  );

  /**
   * Trigger - whenever selected flow or status mapping is updated
   * Use - Update json input
   */
  useEffect(() => {
    const updatedValue =
      appContext.flows[appContext.selectedFlow].status.value || {};
    setJsonInput(JSON.stringify(updatedValue, null, 2));
  }, [appContext.flows, appContext.selectedFlow]);

  const updateStatusMapping = (field, update) => {
    try {
      setTimeout(
        () =>
          setAppContext({
            ...appContext,
            flows: {
              ...appContext.flows,
              [appContext.selectedFlow]: {
                ...appContext.flows[appContext.selectedFlow],
                status: {
                  ...appContext.flows[appContext.selectedFlow].status,
                  value: {
                    ...appContext.flows[appContext.selectedFlow].status.value,
                    [field]: update,
                  },
                },
              },
            },
          }),
        0
      );
    } catch (error) {
      console.error('Failed to update status mapping', error);
    }
  };

  function updateConnectorResponse(row, update) {
    let updatedMapping = deepCopy(
      appContext.flows[appContext.selectedFlow].responseFields.mapping
    );
    const fields = row.split('.');
    const keys = fields.flatMap((f) => [f, 'value']);
    keys.pop();
    updatedMapping = updateNestedJson(updatedMapping, keys, update);
    return updatedMapping;
  }

  const handleSubmit = () => {
    const statusVariable =
      appContext.flows[appContext.selectedFlow].statusVariable;
    const field =
      jsonpath.query(
        appContext.flows[appContext.selectedFlow].responseFields.mapping,
        '$.' + statusVariable.replaceAll('.', '.value.').replaceAll('-', '')
      )[0] || {};
    let updatedResponseMapping =
      appContext.flows[appContext.selectedFlow].responseFields.mapping;
    if (field.type.toLowerCase() === 'string') {
      const updates = { ...field, type: 'enum', value: [field.value].flat() };
      updatedResponseMapping = updateConnectorResponse(statusVariable, updates);
    }
    // Parse the edited JSON and submit it
    const editedJson = JSON.parse(jsonInput);
    setTimeout(
      () =>
        setAppContext({
          ...appContext,
          flows: {
            ...appContext.flows,
            [appContext.selectedFlow]: {
              ...appContext.flows[appContext.selectedFlow],
              responseFields: {
                ...appContext.flows[appContext.selectedFlow].responseFields,
                mapping: updatedResponseMapping,
              },
              status: {
                ...appContext.flows[appContext.selectedFlow].status,
                value: editedJson,
              },
            },
          },
        }),
      0
    );
    setIsStatusMappingPopupOpen(false);
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
      appContext.selectedFlow
    ]?.filter((status) => status.toLowerCase().startsWith(value.toLowerCase()));
    renderSuggestions(field, filteredSuggestions);
    updateStatusMapping(field, value);
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
          updateStatusMapping(field, suggestion);
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
          {Object.keys(
            appContext.flows[appContext.selectedFlow].status.value || {}
          ).length === 0 ? (
            <div className="none">
              <div className="info">Status not found in response fields.</div>
              <div className="hint">
                Hint: Try sending the request for populating response fields.
              </div>
            </div>
          ) : (
            Object.keys(
              appContext.flows[appContext.selectedFlow].status.value || {}
            ).map((f) => {
              return (
                <React.Fragment key={f}>
                  <div className="status">{f}</div>
                  <div className="autocomplete">
                    <div className="input">
                      <input
                        id={`input-${f}`}
                        className="material-input status-mapping-input"
                        type="text"
                        value={
                          appContext.flows[appContext.selectedFlow].status
                            .value[f]
                        }
                        onChange={(e) => handleKeyPress(f, e)}
                      />
                      <div
                        className="status-dropdown"
                        onClick={() => {
                          setShowSuggestions(f);
                          renderSuggestions(
                            f,
                            !showSuggestions
                              ? HYPERSWITCH_STATUS_LIST[appContext.selectedFlow]
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
          <button
            id="cancel-button"
            onClick={() => setIsStatusMappingPopupOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusMappingPopup;
