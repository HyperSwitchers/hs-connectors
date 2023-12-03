// @ts-check

import React, { useEffect, useRef, useState } from 'react';
import { useRecoilState } from 'recoil';
import jsonpath from 'jsonpath';

// lib UI components
import { Paper } from '@mui/material';

// userdef utils
import { generateAuthTypeEncryption } from 'utils/common';
import { APP_CONTEXT } from 'utils/state';
import { SYNONYM_MAPPING } from 'utils/constants';

// userdef UI components
import AuthType from './content/AuthType';
import CurlRequestEditor from './content/CurlRequestEditor';
import IRequestHeadersTable from './content/curl_handlers/RequestHeadersTable';
import IRequestFieldsTable from './content/curl_handlers/RequestFieldsTable';
import IConnectorResponseTable from './content/curl_handlers/ConnectorResponseTable';
import IResponseFieldsTable from './content/curl_handlers/ResponseFields';
import StatusMappingPopup from './content/StatusMappingPopup';
import CodeGenerator from './content/CodeGenerator';
import CodePreview from './content/CodePreview';

const Content = () => {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const prevRef = useRef(appContext);
  useEffect(() => {
    if (
      Object.keys(appContext.flows).filter(
        (f) =>
          prevRef.current.flows[f]?.statusVariable !==
            appContext.flows[f]?.statusVariable &&
          !(
            appContext.flows[f]?.status.value ||
            appContext.flows[f]?.status.mapping
          )
      ).length > 0
    ) {
      handleStatusMappingButtonClick();
    }
    prevRef.current = appContext;
  }, [appContext.flows]);

  // Component specifc states
  const [isStatusMappingPopupOpen, setIsStatusMappingPopupOpen] =
    useState(false);

  const handleStatusMappingButtonClick = () => {
    let statusFields = {};
    let statusFieldsCopy =
      appContext.flows[appContext.selectedFlow].status.value || {};
    const statusVariable =
      appContext.flows[appContext.selectedFlow].statusVariable;
    if (typeof statusVariable === 'string') {
      let field = null;
      try {
        field =
          jsonpath.query(
            appContext.flows[appContext.selectedFlow].responseFields.mapping,
            '$.' +
              statusVariable
                // @ts-ignore
                .replaceAll('.', '.value.')
                .replaceAll('-', '')
          )[0] || {};
      } catch (error) {
        console.error('jsonpath query failed', error);
        return;
      }
      (typeof field.value === 'object'
        ? Array.isArray(field.value)
          ? field.value
          : Object.keys(field.value)
        : [field.value]
      ).map((f) =>
        !statusFieldsCopy[f]
          ? (statusFields[f] = null)
          : (statusFields[f] = statusFieldsCopy[f])
      );
      setIsStatusMappingPopupOpen(true);
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
                  value: statusFields,
                },
              },
            },
          }),
        0
      );
    }
  };

  const renderMainContent = (appContext) => {
    return (
      <div className="app-content-main">
        {appContext.flows[appContext.selectedFlow]?.description ? (
          <div
            className="flow-description"
            dangerouslySetInnerHTML={{
              __html: appContext.flows[appContext.selectedFlow].description,
            }}
          ></div>
        ) : null}
        {/* cURL editor */}
        <CurlRequestEditor />
        {/* Request fields */}
        <Paper elevation={0} className="request-body-section">
          {/* Request Body */}
          <div className="request-body-mapping">
            <h3>Connector Request Fields - Body</h3>
            <IRequestFieldsTable
              suggestions={SYNONYM_MAPPING[appContext.selectedFlow]}
            ></IRequestFieldsTable>
          </div>
          {/* Request headers */}
          <div className="request-headers-mapping">
            <h3>Connector Request Fields - Headers</h3>
            <IRequestHeadersTable
              suggestions={{
                ...Object.keys(appContext.authType.value?.content || {}).reduce(
                  (obj, key) => {
                    const val = appContext.authType.value?.content[key];
                    obj[val] = [];
                    return obj;
                  },
                  {}
                ),
                ...generateAuthTypeEncryption(
                  Object.values(appContext.authType.value?.content || {}).slice(
                    0,
                    2
                  )
                ),
              }}
            />
          </div>
        </Paper>
        {/* Response fields */}
        <Paper elevation={0} className="response-body-section">
          {/* Response type mapping */}
          <div className="response-body-type-mapping">
            <h3>Connector Response Fields - Data Type</h3>
            <IConnectorResponseTable />
          </div>
          {/* Response fields mapping */}
          <div className="response-body-fields-mapping">
            <h3>Connector Response Fields - Mapping to HS</h3>
            <button
              id="responseStatusMapping"
              className={`${
                !(
                  typeof appContext.flows[appContext.selectedFlow]
                    .statusVariable === 'string' &&
                  appContext.flows[appContext.selectedFlow].statusVariable
                    .length > 0
                )
                  ? 'disabled'
                  : ''
              }`}
              onClick={handleStatusMappingButtonClick}
            >
              {!(
                typeof appContext.flows[appContext.selectedFlow]
                  .statusVariable === 'string' &&
                appContext.flows[appContext.selectedFlow].statusVariable
                  .length > 0
              )
                ? 'Map Status to HyperSwitch field'
                : 'Status Mapping'}
            </button>
            <IResponseFieldsTable
              suggestions={
                appContext.flows[appContext.selectedFlow]?.responseFields?.value
              }
            ></IResponseFieldsTable>
          </div>
        </Paper>
        {/* Status Mapping popup */}
        {isStatusMappingPopupOpen && (
          <StatusMappingPopup
            setIsStatusMappingPopupOpen={setIsStatusMappingPopupOpen}
          />
        )}
        {/* Code generation */}
        <CodeGenerator />
        {/* Generated code preview */}
        <CodePreview />
      </div>
    );
  };

  return (
    <div className="app-content">
      {appContext.selectedFlow === 'AuthType' ? (
        <AuthType />
      ) : (
        renderMainContent(appContext)
      )}
    </div>
  );
};

export default Content;
