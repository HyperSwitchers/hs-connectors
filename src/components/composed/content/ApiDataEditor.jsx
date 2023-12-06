import React, { useEffect, useState } from 'react';
import DataViewer from './DataViewer';
import { flattenObject } from 'utils/common';
import { useRecoilState } from 'recoil';
import { APP_CONTEXT, FLOWS } from 'utils/state';
import { SYNONYM_MAPPING, TYPES_LIST } from 'utils/constants';

export default function ApiDataEditor() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const [flows, setFlows] = useRecoilState(FLOWS);
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
        type: 'checkbox',
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
          SYNONYM_MAPPING[appContext.selectedFlow]
        ).reduce((arr, key) => [...arr, '$' + key], []),
      },
    },
  });

  useEffect(() => {
    const updatedAuthContent =
      flows['AuthType']?.authType?.value?.content || {};
    const updatedHeaderSuggestions = Object.keys(updatedAuthContent).reduce(
      (arr, key) => [...arr, '$' + updatedAuthContent[key]],
      []
    );
    if (
      JSON.stringify(columns.requestHeaders.valueMap.suggestions || []) !==
      JSON.stringify(updatedHeaderSuggestions)
    ) {
      setColumns((prevState) => ({
        ...prevState,
        requestHeaders: {
          ...prevState.requestHeaders,
          valueMap: {
            ...prevState.requestHeaders.valueMap,
            suggestions: updatedHeaderSuggestions,
          },
        },
      }));
    }
  }, [flows]);

  return (
    <div className="api-data-editor">
      <div className="request-body">
        <h2>Connector Request Body Fields</h2>
        <DataViewer
          appContextField="requestFields"
          headers={columns.requestFields}
          fieldNames={flattenObject(appContext.requestFields.value)}
        />
      </div>
      <div className="request-header">
        <h2>Connector Request Header Fields</h2>
        <DataViewer
          appContextField="requestHeaderFields"
          headers={columns.requestHeaders}
          fieldNames={flattenObject(appContext.requestHeaderFields.value)}
        />
      </div>
    </div>
  );
}
