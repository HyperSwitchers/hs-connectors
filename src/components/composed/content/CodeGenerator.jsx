import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import { deepCopy, deepJsonSwap } from 'utils/common';
import { APP_CONTEXT, updateAppContextInLocalStorage } from 'utils/state';
import BasicPopover from '../../atomic/Popup';

const CodeGenerator = ({ loadContext = (f) => {} }) => {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);

  return (
    <div className="code-generator">
      <button
        id="generate-code"
        onClick={(e) => {
          updateAppContextInLocalStorage(appContext);
          if (!appContext.authType.value) {
            loadContext('AuthType');
            return;
          }
          let authType = appContext.authType.value || {};
          let modifiedUpdatedRequestData = deepJsonSwap(
            deepCopy(appContext.requestFields.mapping || {})
          );
          let modifiedUpdatedResponseData = deepJsonSwap(
            deepCopy(appContext.responseFields.mapping || {})
          );
          const currentFlow = appContext.selectedFlow || 'Authorize';
          const generatorInput = deepCopy(appContext.generatorInput);
          generatorInput[appContext.connectorName] = {
            ...generatorInput[appContext.connectorName],
            authType: authType.type,
            authKeys: authType.content || {},
            amount: {
              unit: appContext.currencyUnit,
              unitType: appContext.currencyUnitType,
            },
            flows: {
              ...generatorInput[appContext.connectorName].flows,
              [currentFlow]: {
                ...(appContext.generatorInput[appContext.connectorName]?.flows[
                  currentFlow
                ] || {}),
                paymentsRequest: modifiedUpdatedRequestData,
                paymentsResponse: modifiedUpdatedResponseData,
                hsResponse: appContext.hsResponseFields.value || {},
              },
            },
          };
          if (appContext.selectedFlow.toLowerCase() === 'authorize') {
            generatorInput[appContext.connectorName].attemptStatus =
              appContext.status.value || {};
          }
          if (appContext.selectedFlow.toLowerCase() === 'refund') {
            generatorInput[appContext.connectorName].refundStatus =
              appContext.status.value || {};
          }
          setAppContext({ ...appContext, generatorInput });
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
          curl={`curl https://raw.githubusercontent.com/HyperSwitchers/hs-connectors/main/src/raise_connector_pr.sh | sh -s -- ${
            appContext.connectorName
          } ${
            appContext.baseUrl || `https://api.${appContext.connectorName}.com`
          }`}
        />
      </div>
    </div>
  );
};

export default CodeGenerator;
