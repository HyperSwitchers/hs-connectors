// @ts-check

import { Paper } from '@mui/material';
import $ from 'jquery';
import { parse_curl } from 'curl-parser';
import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';

import { addFieldsToNodes, getHeaders, mapFieldNames } from 'utils/common';
import { APP_CONTEXT } from 'utils/state';

export default function CurlEditor() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const [curlCommand, setCurlCommand] = useState(appContext.curlCommand);
  const [wait, setWait] = useState(false);

  // Set local curlCommand on state update
  useEffect(() => {
    if (curlCommand !== appContext.curlCommand) {
      setCurlCommand(appContext.curlCommand);
    }
  }, [appContext.curlCommand]);

  // Form cURL request
  useEffect(() => {
    if (
      typeof appContext.curlCommand === 'string' &&
      appContext.curlCommand !== ''
    ) {
      const curl = appContext.curlCommand
        .replace(/\s*\\\s*/g, ' ')
        .replace(/\n/g, '')
        .replace(/--data-raw|--data-urlencode/g, '-d');
      try {
        const request = parse_curl(curl);
        setAppContext((prevState) => ({
          ...prevState,
          curlRequest: request,
        }));
      } catch (error) {
        console.warn('WARNING', 'Failed to parse cURL request', curl);
      }
    } else {
      setAppContext((prevState) => ({
        ...prevState,
        curlRequest: null,
      }));
    }
  }, [appContext.curlCommand]);

  // Form requestFields and requestHeaderFields
  useEffect(() => {
    if (appContext.curlRequest) {
      try {
        const curlRequest = appContext.curlRequest;
        const requestFields = JSON.parse(curlRequest?.data?.ascii || '{}');
        const requestHeaderFields = curlRequest?.headers.reduce(
          (result, item) => {
            let header = item.split(':');
            result[header[0]] = header[1].trim();
            return result;
          },
          {}
        );
        setAppContext((prevState) => ({
          ...prevState,
          requestFields: {
            value: requestFields,
            mapping: {
              ...addFieldsToNodes(mapFieldNames(requestFields)),
              ...prevState.requestFields.mapping,
            },
          },
          requestHeaderFields: {
            value: requestHeaderFields,
            mapping: {
              ...addFieldsToNodes(mapFieldNames(requestHeaderFields)),
              ...prevState.requestHeaderFields.mapping,
            },
          },
        }));
      } catch (error) {
        console.warn('Failed to parse request body and header fields', error);
      }
    } else {
      setAppContext((prevState) => ({
        ...prevState,
        requestFields: {
          value: null,
          mapping: null,
        },
        requestHeaderFields: {
          value: null,
          mapping: null,
        },
      }));
    }
  }, [appContext.curlRequest]);

  const handleCurlUpdate = () => {
    setAppContext((prevState) => ({
      ...prevState,
      curlCommand,
      codeInvalidated: true,
    }));
  };

  const handleCurlChange = (e) => {
    const curlCommand = e?.target?.value;
    if (typeof curlCommand === 'string') {
      setCurlCommand(curlCommand);
    }
  };

  const serveCurlRequest = async () => {
    if (appContext.curlRequest) {
      setWait(true);
      const curlRequest = appContext.curlRequest;
      const updates = {};
      const url = '/cors' + curlRequest.url;
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

  return (
    <div className="curl-request-editor">
      <Paper elevation={0} className="curl-input-section">
        <h3>cURL Request</h3>
        <textarea
          value={curlCommand}
          onBlur={handleCurlUpdate}
          onChange={handleCurlChange}
          placeholder="Enter your cURL request here..."
        />
        <button onClick={serveCurlRequest} disabled={wait}>
          {wait ? <div className="loader"></div> : 'Send Request'}
        </button>
      </Paper>
    </div>
  );
}
