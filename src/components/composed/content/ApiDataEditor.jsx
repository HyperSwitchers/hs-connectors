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

  useEffect(() => {
    const updatedAuthContent =
      flows['AuthType']?.authType?.value?.content || {};
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
      <div className="response-fields">
        <h2>Connector Response Fields</h2>
        {appContext.responseFields.mapping && (
          <DataViewer
            appContextField="responseFields"
            headers={columns.responseFields}
            fieldNames={flattenObject(appContext.responseFields.value)}
          />
        )}
      </div>
      <div className="hs-response-fields">
        <h2>Connector Response Mapping</h2>
        {appContext.hsResponseFields.mapping && (
          <DataViewer
            appContextField="hsResponseFields"
            headers={columns.hsResponseFields}
            fieldNames={flattenObject(appContext.hsResponseFields.value)}
          />
        )}
      </div>
    </div>
  );
}
