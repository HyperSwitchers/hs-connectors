import Tooltip from '@mui/material/Tooltip';
import Dropdown from 'components/atomic/Dropdown';
import InfoIcon from '@mui/icons-material/Info';
import React, { useState } from 'react';
import { useRecoilState } from 'recoil';

import {
  CURRENCY_UNIT,
  CURRENCY_UNIT_TYPE,
  FLOW_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  STEPS,
  TOOLTIPS,
} from 'utils/constants';
import { APP_CONTEXT } from 'utils/state';
import { toPascalCase } from 'utils/Parser';

export default function HeaderNew() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);

  const [connectorName, setConnectorName] = useState(
    appContext.connectorName.toString()
  );

  const handleConnectorNameChange = (e) => {
    const connectorName = e?.target?.value;
    if (typeof connectorName === 'string') {
      setConnectorName(connectorName);
    }
  };

  const handleConnectorNameUpdate = () => {
    setAppContext((prevState) => ({
      ...prevState,
      connectorName,
      connectorPascalCase: toPascalCase(connectorName),
      codeInvalidated: true,
    }));
  };

  const handleCurrencyUnitChange = (e) => {
    setAppContext((prevState) => ({
      ...prevState,
      currencyUnit: e?.target?.value || prevState.currencyUnit,
      codeInvalidated: true,
    }));
  };

  const handleCurrencyUnitTypeChange = (e) => {
    setAppContext((prevState) => ({
      ...prevState,
      currencyUnitType: e?.target?.value || prevState.currencyUnitType,
      codeInvalidated: true,
    }));
  };

  const handleFlowChange = (e) => {
    const flow = e?.target?.value;
    if (FLOW_OPTIONS.includes(flow)) {
      setAppContext((prevState) => ({
        ...prevState,
        selectedFlow: flow,
        codeInvalidated: true,
      }));
    }
  };

  const handlePaymentMethodChange = (e) => {
    const paymentMethodType = e?.target?.value;
    if (PAYMENT_METHOD_OPTIONS.includes(paymentMethodType)) {
      setAppContext((prevState) => ({
        ...prevState,
        selectedFlow: paymentMethodType,
        codeInvalidated: true,
      }));
    }
  };

  const handleStepChange = (newStep) => {
    setAppContext((prevState) => ({ ...prevState, currentStep: newStep }));
  };

  return (
    <div className="app-header">
      <div className="app-header-steps">
        {STEPS.map((step) => (
          <div className="step" onClick={() => handleStepChange(step)}>
            {step}
          </div>
        ))}
      </div>
      {appContext.currentStep !== 'AuthType' ? (
        <div className="main">
          Try
          <span>
            <Dropdown
              options={FLOW_OPTIONS}
              handleSelectChange={handleFlowChange}
              selectedOption={appContext.selectedFlow}
              type="Flow Type"
            />
          </span>
          flow with HyperSwitch for
          <span>
            <Dropdown
              options={PAYMENT_METHOD_OPTIONS}
              handleSelectChange={handlePaymentMethodChange}
              selectedOption={appContext.paymentMethodType}
              type="Payment Method"
            />
          </span>
        </div>
      ) : null}
      <div className="__legacy_node__ app-header-drop-downs">
        <div className="connector-name">
          <label>Connector</label>
          <input
            type="text"
            placeholder="Enter Connector Name"
            value={connectorName}
            onChange={handleConnectorNameChange}
            onBlur={handleConnectorNameUpdate}
          />
        </div>
        <div className="drop-down flow-type">
          <label>
            {' '}
            <Tooltip title={TOOLTIPS.flowType} placement="top">
              <InfoIcon
                style={{
                  height: '15px',
                  width: '15px',
                }}
              />
            </Tooltip>
            Flow
          </label>
          <Dropdown
            options={FLOW_OPTIONS}
            handleSelectChange={handleFlowChange}
            selectedOption={appContext.selectedFlow}
            type="Flow Type"
          />
        </div>
        {appContext.selectedFlow !== 'AuthType' ? (
          <div className="drop-down payment-method">
            <label>
              <Tooltip title={TOOLTIPS.paymentMethodType} placement="top">
                <InfoIcon
                  style={{
                    height: '15px',
                    width: '15px',
                  }}
                />
              </Tooltip>
              Payment Method
            </label>
            <Dropdown
              options={PAYMENT_METHOD_OPTIONS}
              handleSelectChange={handlePaymentMethodChange}
              selectedOption={appContext.paymentMethodType}
              type="Payment Method"
            />
          </div>
        ) : (
          <React.Fragment>
            <div className="drop-down currency-unit">
              <label>Currency Unit</label>
              <Dropdown
                options={CURRENCY_UNIT}
                handleSelectChange={handleCurrencyUnitChange}
                selectedOption={appContext.currencyUnit}
                type="Currency Unit"
              />
            </div>
            <div className="drop-down currency-unit-type">
              <label>Currency Unit Type</label>
              <Dropdown
                options={CURRENCY_UNIT_TYPE}
                handleSelectChange={handleCurrencyUnitTypeChange}
                selectedOption={appContext.currencyUnitType}
                type="Currency Unit Type"
              />
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
