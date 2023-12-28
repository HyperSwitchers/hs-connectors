import React, { useEffect, useState } from 'react';
import $ from 'jquery';

// userdef UI components
import AuthType from './content/AuthType';
import CodePreview from './content/CodePreview';
import CurlEditor from './content/CurlEditor';
import { useRecoilState } from 'recoil';
import { APP_CONTEXT, FLOWS } from 'utils/state';
import DataViewer from './content/DataViewer';
import {
  addFieldsToNodes,
  deepCopy,
  flattenObject,
  getHeaders,
} from 'utils/common';
import {
  HYPERSWITCH_STATUS_LIST,
  SYNONYM_MAPPING,
  TYPES_LIST,
} from 'utils/constants';

// Images
import ArrowDown from '../../assets/images/ArrowDown.svg';

export default function Content() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const [flows, setFlows] = useRecoilState(FLOWS);

  const [statusMapping, setStatusMapping] = useState(
    appContext.status?.value || {}
  );
  const [columns, setColumns] = useState({
    requestHeaders: {
      field: {
        value: 'Connector Field Name',
      },
      valueMap: {
        value: 'HyperSwitch Field Name',
        update: 'value',
        type: 'dropdown',
      },
    },
    requestFields: {
      field: {
        value: 'Connector Field Name',
      },
      value: {
        value: 'Value',
      },
      optional: {
        value: 'Optional',
        update: 'optional',
        type: 'switch',
      },
      secret: {
        value: 'Secret',
        update: 'secret',
        type: 'checkbox',
      },
      type: {
        value: 'Data Type',
        update: 'type',
        type: 'dropdown',
        suggestions: TYPES_LIST,
      },
      valueMap: {
        value: 'HyperSwitch Field Name',
        update: 'value',
        type: 'dropdown',
        suggestions: Object.keys(
          SYNONYM_MAPPING[appContext.selectedFlow] || {}
        ).reduce((arr, key) => [...arr, '$' + key], []),
      },
    },
    responseFields: {
      field: {
        value: 'Connector Field Name',
      },
      value: {
        value: 'Value',
      },
      type: {
        value: 'Data Type',
        update: 'type',
        type: 'dropdown',
        suggestions: TYPES_LIST,
      },
    },
    hsResponseFields: {
      field: {
        value: 'HyperSwitch Field Name',
      },
      valueMap: {
        value: 'Connector Field Name',
        type: 'dropdown',
        update: 'value',
        suggestions: Object.keys(appContext.responseFields?.value || {}).reduce(
          (arr, key) => [...arr, '$' + key],
          []
        ),
      },
    },
  });
  const [showSuggestions, setShowSuggestions] = useState('');
  const [wait, setWait] = useState(false);

  useEffect(() => {
    const updatedAuthContent = appContext?.authType?.value?.content || {};
    const updatedHeaderSuggestions = Object.keys(updatedAuthContent).reduce(
      (arr, key) => [...arr, '$' + updatedAuthContent[key]],
      []
    );
    const columnUpdates = {};
    if (
      JSON.stringify(columns.requestHeaders.valueMap.suggestions || []) !==
      JSON.stringify(updatedHeaderSuggestions)
    ) {
      columnUpdates.requestHeaders = {
        ...columns.requestHeaders,
        valueMap: {
          ...columns.requestHeaders.valueMap,
          suggestions: updatedHeaderSuggestions,
        },
      };
    }

    const updatedResponseFields = appContext.responseFields.value || {};
    const updatedResponseSuggestions = flattenObject(updatedResponseFields).map(
      (f) => '$' + f
    );
    if (
      JSON.stringify(columns.hsResponseFields.valueMap.suggestions || []) !==
      JSON.stringify(updatedResponseSuggestions)
    ) {
      columnUpdates.hsResponseFields = {
        ...columns.hsResponseFields,
        valueMap: {
          ...columns.hsResponseFields.valueMap,
          suggestions: updatedResponseSuggestions,
        },
      };
    }

    setColumns((prevState) => ({
      ...prevState,
      ...columnUpdates,
    }));
  }, [flows]);

  // Status mapping initialization
  useEffect(() => {
    if (
      appContext.responseFields.mapping &&
      appContext.hsResponseFields.mapping?.status?.value?.startsWith('$')
    ) {
      const responseFields = deepCopy(appContext.responseFields.mapping.status);
      const field = appContext.hsResponseFields.mapping.status.value.replace(
        '$',
        ''
      );
      const fields = field.split('.').flatMap((f) => [f, 'value']);
      let vmap = fields.reduce(
        (obj, f) => obj[f],
        appContext.responseFields.mapping
      );
      vmap = Array.isArray(vmap) ? vmap : [vmap];
      responseFields.valueMap = vmap;
      setStatusMapping({
        ...vmap.reduce((obj, k) => {
          obj[k] = '';
          return obj;
        }, {}),
      });
    }
  }, [appContext.responseFields.mapping, appContext.hsResponseFields.mapping]);

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
      const statusMappingUpdates = {};
      suggestions.map((suggestion) => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.id = `suggestion-${suggestion}`;
        const updatedStatus = {
          ...(appContext.status.value || {}),
          [field]: suggestion,
        };
        div.addEventListener('click', function (e) {
          inputField.value = suggestion;
          suggestionContainer.innerHTML = '';
          setShowSuggestions(null);
          statusMappingUpdates[field] = suggestion;
          setAppContext((prevState) => ({
            ...prevState,
            codeInvalidated: true,
            status: {
              value: updatedStatus,
              mapping: addFieldsToNodes(updatedStatus),
            },
          }));
        });
        suggestionContainer.appendChild(div);
      });
    }
  };

  const serveCurlRequest = async () => {
    if (appContext.curlRequest) {
      setWait(true);
      const curlRequest = appContext.curlRequest;
      const updates = {};
      const url = curlRequest.url;
      const req = {
        method: curlRequest.method,
        url,
        headers: getHeaders(curlRequest.headers),
        data: curlRequest.data.ascii,
        success: (data) => {
          updates.responseFields = {
            value: data,
            mapping: addFieldsToNodes(data),
          };
          updates.codeInvalidated = true;
          setTimeout(() => {
            document.getElementById('response-fields-anchor')?.scrollIntoView();
          }, 100);
        },
        error: (data) => {
          console.error(
            'ERROR',
            `Failed to make API request ${curlRequest.method} ${curlRequest.url}`,
            data
          );
        },
      };

      $.ajax(url, req).always(() => {
        setAppContext((prevState) => ({ ...prevState, ...updates }));
        setWait(false);
      });
    }
  };

  const renderAppContent = () => {
    switch (appContext.currentStep) {
      case 'AuthType': {
        return <AuthType />;
      }
      case 'RequestMap': {
        return (
          <div className="request-body-wrapper main">
            <div className="header">
              Identifiers are essential for secure and authenticated
              transactions. Please make sure you have the correct identifiers
              ready for your chosen processor to ensure smooth and secure
              payment processing through Hyperswitch.
            </div>
            <div className="curl">
              <h2 className="heading">Enter your cURL request here</h2>
              <CurlEditor />
            </div>
            <div className="data">
              <h2 className="heading">
                Map your Connector header and body to Hyperswitch fields
              </h2>
              <div className="request-header">
                <div className="data-header">
                  <h2>Header</h2>
                  <img src={ArrowDown} alt="" />
                </div>
                <DataViewer
                  appContextField="requestHeaderFields"
                  headers={columns.requestHeaders}
                  fieldNames={flattenObject(
                    appContext.requestHeaderFields.value
                  )}
                />
              </div>
              <div className="request-body">
                <div className="data-header">
                  <h2>Body</h2>
                  <img src={ArrowDown} alt="" />
                </div>
                <DataViewer
                  appContextField="requestFields"
                  headers={columns.requestFields}
                  fieldNames={flattenObject(appContext.requestFields.value)}
                />
              </div>
            </div>
            <div className="submit">
              <button onClick={serveCurlRequest} disabled={wait}>
                {wait ? <div className="loader"></div> : 'Send Request'}
              </button>
            </div>
          </div>
        );
      }
      case 'ResponseMap': {
        return (
          <div className="response-body-wrap main">
            <div className="data">
              <div className="response-fields" id="response-fields-anchor">
                <div className="data-header">
                  <h2>Connector Response</h2>
                  <img src={ArrowDown} alt="" />
                </div>
                {appContext.responseFields.mapping && (
                  <DataViewer
                    appContextField="responseFields"
                    headers={columns.responseFields}
                    fieldNames={flattenObject(appContext.responseFields.value)}
                  />
                )}
              </div>
            </div>
            <div className="data">
              <div className="response-mapping">
                <div className="hs-response-mapping">
                  <div className="data-header">
                    <h2>Connector Response Mapping</h2>
                    <img src={ArrowDown} alt="" />
                  </div>
                  {appContext.responseFields.mapping && (
                    <DataViewer
                      appContextField="hsResponseFields"
                      headers={columns.hsResponseFields}
                      fieldNames={flattenObject(
                        appContext.hsResponseFields.value
                      )}
                    />
                  )}
                </div>
                {typeof appContext.hsResponseFields.mapping.status.value ===
                  'string' &&
                appContext.hsResponseFields.mapping.status.value !== '' &&
                Object.keys(statusMapping).length > 0 ? (
                  <div className="hs-status-mapping">
                    <div className="data-header">
                      <h2>Connector Status Mapping</h2>
                      <img src={ArrowDown} alt="" />
                    </div>
                    <div className="data-viewer">
                      {Object.keys(statusMapping).map((f) => (
                        <React.Fragment key={f}>
                          <div className="status">{f}</div>
                          <div className="autocomplete">
                            <div className="input">
                              <input
                                id={`input-${f}`}
                                className="material-input status-mapping-input"
                                type="text"
                                value={(appContext?.status?.value || {})[f]}
                              />
                              <div
                                className="status-dropdown"
                                onClick={() => {
                                  setShowSuggestions(f);
                                  renderSuggestions(
                                    f,
                                    !showSuggestions
                                      ? HYPERSWITCH_STATUS_LIST[
                                          appContext.selectedFlow
                                        ]
                                      : []
                                  );
                                }}
                              >
                                {showSuggestions === f ? 'x' : '...'}
                              </div>
                            </div>
                            <div
                              className="suggestions"
                              id={`suggestions-${f}`}
                            ></div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      }
      case 'GeneratedCode': {
        return <CodePreview />;
      }
    }

    return <AuthType />;
  };

  return <div className="app-content">{renderAppContent()}</div>;
}
