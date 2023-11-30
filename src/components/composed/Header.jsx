import React from 'react';
import { useRecoilState } from 'recoil';

// userdef utils
import { } from '../../utils/common';
import { APP_CONTEXT } from '../../utils/state';
import {
  CURRENCY_UNIT,
  CURRENCY_UNIT_TYPE,
  FLOW_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '../../utils/constants';

// userdef UI components
import Dropdown from '../atomic/Dropdown';

const Header = () => {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);

  const handleConnectorNameChange = (event) => {
    let connectorName = event.target.value;
    setAppContext({ ...appContext, connectorName });
  };

  const handleFlowOptionChange = (event) => {
    let flow = event.target.value;
    if (FLOW_OPTIONS.includes(flow)) {
      setAppContext({ ...appContext, selectedFlow: flow });
    }
  };

  const handlePaymentMethodOptionChange = (event) => {
    setAppContext({
      ...appContext,
      selectedPaymentMethodOption: event.target.value,
    });
  };

  const handleCurrencyUnitOptionChange = (event) => {
    setAppContext({
      ...appContext,
      currencyUnit: event?.target?.value || '',
    });
  };

  const handleCurrencyUnitTypeOptionChange = (event) => {
    setAppContext({
      ...appContext,
      currencyUnitType: event?.target?.value || '',
    });
  };

  return (
    <div className="app-header">
      <div className="dropdown-wrapper hs-headers">
        <div>
          <label htmlFor="dropdown">Connector: </label>
          <input
            className="conector"
            type="text"
            placeholder="Enter Connector Name"
            onChange={handleConnectorNameChange}
            defaultValue={appContext.connectorName}
          />
        </div>
        <Dropdown
          options={FLOW_OPTIONS}
          handleSelectChange={handleFlowOptionChange}
          selectedOption={appContext.selectedFlow}
          type="Flow Type"
        />
        {appContext.selectedFlow !== 'AuthType' ? (
          <Dropdown
            options={PAYMENT_METHOD_OPTIONS}
            handleSelectChange={handlePaymentMethodOptionChange}
            selectedOption={appContext.selectedPaymentMethodOption}
            type="Payment Method"
          />
        ) : (
          <React.Fragment>
            <Dropdown
              options={CURRENCY_UNIT}
              handleSelectChange={handleCurrencyUnitOptionChange}
              selectedOption={appContext.currencyUnit}
              type="Currency Unit"
            />
            <Dropdown
              options={CURRENCY_UNIT_TYPE}
              handleSelectChange={handleCurrencyUnitTypeOptionChange}
              selectedOption={appContext.currencyUnitType}
              type="Currency Unit Type"
            />
          </React.Fragment>
        )}
        {/* <button>
          <a
            style={{ textDecoration: 'none', color: '#fff' }}
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/juspay/hyperswitch/fork"
          >
            Fork Hyperswitch
          </a>
        </button> */}
      </div>
    </div>
  );
};

export default Header;
