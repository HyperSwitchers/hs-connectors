// @ts-check

import $ from 'jquery';
import React, { useEffect, useRef } from 'react';
import { Paper } from '@mui/material';
import { useRecoilState } from 'recoil';

// userdef utils
import { APP_CONTEXT, storeItem } from 'utils/state';
import { addFieldsToNodes, mapFieldNames } from 'utils/common';
import { parse_curl } from 'curl-parser';
import { getHeaders } from 'utils/common';
import { defaultConnectorProps } from './ConnectorTemplates';
import { toPascalCase } from 'utils/Parser';
import { DEFAULT_CONNECTOR } from 'utils/constants';

const CurlRequestEditor = () => {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const curlTextareaRef = useRef(null);

  // Component specific effects
  /**
   * Usecase - Update curl command + request and subsequent fields on flow update
   * Trigger - Selected flow is updated
   */
  useEffect(() => {
    const newFlow = appContext.selectedFlow;
    if (
      !appContext.requestFields?.mapping ||
      !appContext.requestHeaderFields?.mapping
    ) {
      updateCurlRequest(appContext.curlCommand, newFlow);
    }
  }, [appContext.selectedFlow]);

  const updateCurlRequest = (request, flow = null) => {
    let ss = request
      .replace(/\s*\\\s*/g, ' ')
      .replace(/\n/g, '')
      .replace(/--data-raw|--data-urlencode/g, '-d');
    try {
      const fetchRequest = parse_curl(ss);
      const requestFields = JSON.parse(fetchRequest?.data?.ascii || '{}');
      const requestHeaderFields = fetchRequest?.headers.reduce(
        (result, item) => {
          let header = item.split(':');
          result[header[0]] = header[1].trim();
          return result;
        },
        {}
      );

      // Updates
      if (fetchRequest) {
        saveFlowDetails(fetchRequest);
      }
      // debugger;
      setAppContext({
        ...appContext,
        curlCommand: request,
        curlRequest: fetchRequest,
        requestFields: {
          value: requestFields,
          mapping: addFieldsToNodes(mapFieldNames({ ...requestFields })),
        },
        requestHeaderFields: {
          value: requestHeaderFields,
          mapping: addFieldsToNodes(mapFieldNames({ ...requestHeaderFields })),
        },
        hsResponseFields: {
          ...appContext?.hsResponseFields,
          mapping: addFieldsToNodes(
            mapFieldNames({
              ...appContext?.hsResponseFields.value,
            })
          ),
        },
      });
    } catch (e) {
      console.error('Failed while updating cURL request', e);
      setAppContext({ ...appContext, curlCommand: request });
    }
  };

  function convertToValidVariableName(str) {
    return str.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
  }

  const saveFlowDetails = (curl) => {
    let props = localStorage.props
      ? JSON.parse(localStorage.props)
      : defaultConnectorProps(localStorage.connector || DEFAULT_CONNECTOR);
    let flow = props.flows[appContext.selectedFlow];
    if (flow) {
      flow.url_path = new URL(curl.url).pathname;
      flow.http_method = toPascalCase(curl.method);
      let headers = getHeaders(curl.headers);
      props.content_type = headers['Content-Type'] || headers['content-type'];
      flow.headers = Object.keys(headers).map((key) =>
        convertToValidVariableName(key)
      );
      // if request body is present then build request body
      flow.enabled.push(
        'get_headers',
        'get_content_type',
        'get_url',
        'build_request',
        'handle_response',
        'get_error_response'
      );
      if (Object.keys(JSON.parse(curl.data.ascii)).length > 0) {
        flow.enabled.push('get_request_body');
      }
      props.flows[appContext.selectedFlow] = flow;
    }
    storeItem('props', JSON.stringify(props));
  };

  const sendRequest = async () => {
    const curlRequest = appContext.curlRequest;
    // Transforming the fetchRequest object into a valid JavaScript fetch request
    const requestOptions = {
      method: curlRequest.method,
      headers: getHeaders(curlRequest.headers),
      body: curlRequest.data.ascii,
    };

    let url =  curlRequest.url;
    const updates = {
      baseUrl: new URL(curlRequest?.url)?.origin,
    };
    let req_content = {
      type: requestOptions.method,
      url: url,
      headers: requestOptions.headers,
      data: requestOptions.body,
      success: (data) => {
        const responseFieldsUpdate = {
          value: data,
          mapping: addFieldsToNodes(data),
        };
        updates.responseFields = responseFieldsUpdate;
      },
      error: (data) => {
        console.log(data);
      },
    };

    $.ajax(url, req_content).always(() => {
      updates.loading = false;
      setAppContext({ ...appContext, ...updates });
    });
    let targetElement = document.getElementById('generate-code');
    targetElement.scrollIntoView({
      behavior: 'instant',
      block: 'end',
    });
  };

  return (
    <div className="curl-request-editor">
      <Paper elevation={0} className="curl-input-section">
        <h3>cURL Request</h3>
        <textarea
          ref={curlTextareaRef} // Add the ref to the text area
          value={appContext.curlCommand}
          onChange={(e) => updateCurlRequest(e.target.value)}
          placeholder="Enter your cURL request here..."
        />
        <button onClick={sendRequest} disabled={appContext.loading}>
          {appContext.loading ? <div className="loader"></div> : 'Send Request'}
        </button>
      </Paper>
    </div>
  );
};

export default CurlRequestEditor;
