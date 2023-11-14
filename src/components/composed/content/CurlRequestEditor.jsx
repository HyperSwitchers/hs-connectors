// @ts-check

import $ from 'jquery';
import React, { useEffect, useRef } from 'react';
import { Paper } from '@mui/material';
import { useRecoilValue } from 'recoil';

// userdef utils
import { APP_CONTEXT } from 'utils/state';
import { addFieldsToNodes, deepCopy, mapFieldNames } from 'utils/common';
import { parse_curl } from 'curl-parser';
import { getHeaders } from 'utils/common';

const CurlRequestEditor = ({
  updateAppContext = (u) => {},
  updateAppContextUsingPath = (p, u) => {},
}) => {
  const appContext = useRecoilValue(APP_CONTEXT);
  const curlTextareaRef = useRef(null);

  // Component specific effects
  /**
   * Usecase - Update curl command + request and subsequent fields on flow update
   * Trigger - Selected flow is updated
   */
  useEffect(() => {
    const newFlow = appContext.selectedFlow;
    if (
      !appContext.flows[newFlow].requestFields.mapping ||
      !appContext.flows[newFlow].requestHeaderFields.mapping
    ) {
      updateCurlRequest(appContext.flows[newFlow].curlCommand, newFlow);
    }
  }, [appContext.selectedFlow]);

  const updateCurlRequest = (request, flow = null) => {
    let ss = request
      .replace(/\s*\\\s*/g, ' ')
      .replace(/\n/g, '')
      .replace(/--data-raw|--data-urlencode/g, '-d');
    const updatedFlow = flow || appContext.selectedFlow;
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

      // Update state
      const updatedFlows = deepCopy(appContext.flows[appContext.selectedFlow]);
      updatedFlows.curlCommand = request;
      updatedFlows.curlRequest = fetchRequest;
      if (!flow || !updatedFlows?.requestFields.value) {
        updatedFlows.requestFields = {
          value: requestFields,
          mapping: addFieldsToNodes(mapFieldNames({ ...requestFields })),
        };
      }
      if (!flow || !updatedFlows?.requestHeaderFields.value) {
        updatedFlows.requestHeaderFields = {
          value: requestHeaderFields,
          mapping: addFieldsToNodes(mapFieldNames({ ...requestHeaderFields })),
        };
      }
      if (
        updatedFlows?.hsResponseFields.value &&
        !updatedFlows?.hsResponseFields.mapping
      ) {
        updatedFlows.hsResponseFields = {
          ...updatedFlows?.hsResponseFields,
          mapping: addFieldsToNodes(
            mapFieldNames({
              ...updatedFlows?.hsResponseFields.value,
            })
          ),
        };
      }

      // Updates
      if (flow) {
        updateAppContext({ selectedFlow: flow });
      }
      updateAppContextUsingPath(`flows.${updatedFlow}`, updatedFlows);
    } catch (e) {
      console.error('Failed while updating cURL request', e);
      updateAppContextUsingPath(`flows.${updatedFlow}.curlCommand`, request);
    }
  };

  const sendRequest = async () => {
    const curlRequest = deepCopy(
      appContext.flows[appContext.selectedFlow].curlRequest
    );
    // Transforming the fetchRequest object into a valid JavaScript fetch request
    const requestOptions = {
      method: curlRequest.method,
      headers: getHeaders(curlRequest.headers),
      body: curlRequest.data.ascii,
    };

    let url = curlRequest.url;
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
          mapping: addFieldsToNodes(mapFieldNames(data)),
        };
        updates.flows = deepCopy(appContext.flows);
        updates.flows[`${appContext.selectedFlow}`].responseFields =
          responseFieldsUpdate;
      },
      error: (data) => {
        console.log(data);
      },
    };

    $.ajax(url, req_content).always(() => {
      updates.loading = false;
      updateAppContext(updates);
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
          value={appContext.flows[appContext.selectedFlow].curlCommand}
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
