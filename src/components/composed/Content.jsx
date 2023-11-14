// @ts-check

import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import jsonpath from 'jsonpath';

// lib UI components
import { Paper } from '@mui/material';

// userdef utils
import { deepCopy, generateAuthTypeEncryption } from 'utils/common';
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

const Content = ({
  updateAppContext = (u) => {},
  updateAppContextUsingPath = (p, u) => {},
}) => {
  const appContext = useRecoilValue(APP_CONTEXT);

  // Component specifc states
  const [isStatusMappingPopupOpen, setIsStatusMappingPopupOpen] =
    useState(false);

  const handleStatusMappingButtonClick = () => {
    let statusFields = {};
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
      if (typeof field.value === 'object') {
        if (Array.isArray(field.value)) {
          field.value.map((s) => {
            statusFields[s] = null;
            return null;
          });
        } else {
          statusFields = { ...statusFields, ...field.value };
        }
      } else {
        statusFields[field.value] = null;
      }
      const updatedFlows = deepCopy(appContext.flows);
      if (
        typeof updatedFlows[appContext.selectedFlow].status.value === 'object'
      ) {
        updatedFlows[appContext.selectedFlow].status.value = {
          ...statusFields,
          ...updatedFlows[appContext.selectedFlow].status.value,
        };
      } else {
        updatedFlows[appContext.selectedFlow].status.value = statusFields;
      }
      setIsStatusMappingPopupOpen(true);
      updateAppContext({ flows: updatedFlows });
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
        <CurlRequestEditor
          updateAppContext={updateAppContext}
          updateAppContextUsingPath={updateAppContextUsingPath}
        />
        {/* Request fields */}
        <Paper elevation={0} className="request-body-section">
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
              updateAppContext={updateAppContext}
            ></IRequestHeadersTable>
          </div>
          {/* Request Body */}
          <div className="request-body-mapping">
            <h3>Connector Request Fields - Body</h3>
            <IRequestFieldsTable
              suggestions={SYNONYM_MAPPING[appContext.selectedFlow]}
              updateAppContext={updateAppContext}
            ></IRequestFieldsTable>
          </div>
        </Paper>
        {/* Response fields */}
        <Paper elevation={0} className="response-body-section">
          {/* Response type mapping */}
          <div className="response-body-type-mapping">
            <h3>Connector Response Fields - Data Type</h3>
            <IConnectorResponseTable
              updateAppContext={updateAppContext}
            ></IConnectorResponseTable>
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
              updateAppContext={updateAppContext}
            ></IResponseFieldsTable>
          </div>
        </Paper>
        {/* Status Mapping popup */}
        {isStatusMappingPopupOpen && (
          <StatusMappingPopup
            onClose={() => setIsStatusMappingPopupOpen(false)}
            updateAppContextUsingPath={updateAppContextUsingPath}
          />
        )}
        {/* Code generation */}
        <CodeGenerator
          updateAppContext={updateAppContext}
          updateAppContextUsingPath={updateAppContextUsingPath}
        />
        {/* Generated code preview */}
        <CodePreview
          updateAppContext={updateAppContext}
          updateAppContextUsingPath={updateAppContextUsingPath}
        />
      </div>
    );
  };

  return (
    <div className="app-content">
      {appContext.selectedFlow === 'AuthType' ? (
        <AuthType
          updateAppContext={updateAppContext}
          updateAppContextUsingPath={updateAppContextUsingPath}
        />
      ) : (
        renderMainContent(appContext)
      )}
    </div>
  );
};

export default Content;
