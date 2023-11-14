import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { generateRustCode } from 'utils/Parser';
import { deepCopy, deepJsonSwap } from 'utils/common';
import { FLOW_OPTIONS } from 'utils/constants';
import {
  APP_CONTEXT,
  fetchItem,
  storeItem,
  updateAppContextInLocalStorage,
} from 'utils/state';

const CodeGenerator = ({
  updateAppContext = (u) => {},
  updateAppContextUsingPath = (p, u) => {},
}) => {
  const appContext = useRecoilValue(APP_CONTEXT);

  // Component specific states
  const [connectorContext, setConnectorContext] = useState({});

  return (
    <div className="code-generator">
      <button
        id="generate-code"
        onClick={(e) => {
          updateAppContextInLocalStorage(appContext);
          if (!appContext.authType.value) {
            updateAppContext({ selectedFlow: 'AuthType' });
            return;
          }
          let authType = appContext.authType.value || {};
          let modifiedUpdatedRequestData = deepJsonSwap(
            deepCopy(
              appContext.flows[appContext.selectedFlow].requestFields.mapping ||
                {}
            )
          );
          let modifiedUpdatedResponseData = deepJsonSwap(
            deepCopy(
              appContext.flows[appContext.selectedFlow].responseFields
                .mapping || {}
            )
          );
          const generatorInput = {
            [appContext.connectorName]: {
              authType: authType.type,
              authKeys: authType.content || {},
              amount: {
                unit: appContext.currencyUnit,
                unitType: appContext.currencyUnitType,
              },
              flows: {
                [appContext.selectedFlow || 'Authorize']: {
                  paymentsRequest: modifiedUpdatedRequestData,
                  paymentsResponse: modifiedUpdatedResponseData,
                  hsResponse:
                    appContext.flows[appContext.selectedFlow].hsResponseFields
                      .value || {},
                },
              },
            },
          };
          FLOW_OPTIONS.filter(
            (f) =>
              f.toLowerCase() !== 'authtype' && f.toLowerCase() !== 'refund'
          ).map((f) => {
            if (appContext.flows[f].status.value) {
              generatorInput[appContext.connectorName].attemptStatus =
                appContext.flows[f].status.value || {};
            }
          });
          if (appContext.selectedFlow.toLowerCase() === 'refund') {
            generatorInput[appContext.connectorName].refundStatus =
              appContext.flows[appContext.selectedFlow].status.value || {};
          }
          updateAppContext({ generatorInput });
          setConnectorContext({ ...{} });
          let targetElement = document.getElementById('generated-code-snippet');
          targetElement.scrollIntoView({
            behavior: 'smooth',
          });
        }}
      >
        {!appContext.authType.value
          ? 'Configure AuthType before generating code'
          : 'Generate Code'}
      </button>
    </div>
  );
};

export default CodeGenerator;
