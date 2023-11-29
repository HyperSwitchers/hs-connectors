import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { deepCopy, deepJsonSwap } from 'utils/common';
import { FLOW_OPTIONS } from 'utils/constants';
import {
  APP_CONTEXT,
  updateAppContextInLocalStorage,
} from 'utils/state';
import BasicPopover from '../../atomic/Popup';

const CodeGenerator = ({
  updateAppContext = (u) => {},
}) => {
  const appContext = useRecoilValue(APP_CONTEXT);

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
            generatorInput[appContext.connectorName].attemptStatus =
              appContext.flows[f].status.value || {};
          });
          if (appContext.selectedFlow.toLowerCase() === 'refund') {
            generatorInput[appContext.connectorName].refundStatus =
              appContext.flows[appContext.selectedFlow].status.value || {};
          }
          updateAppContext({ generatorInput });
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
      <div>
        <BasicPopover
          curl={`curl https://raw.githubusercontent.com/HyperSwitchers/hs-connectors/main/src/raise_connector_pr.sh | sh -s -- ${appContext.connectorName} ${appContext.baseUrl || `https://api.${appContext.connectorName}.com`}`}
          updateAppContext={updateAppContext}
        />
      </div>
    </div>
  );
};

export default CodeGenerator;
