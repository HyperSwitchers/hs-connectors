// @ts-check

import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

import Dropdown from 'components/atomic/Dropdown';
import { AUTH_KEYS, AUTH_KEYS_INFO, DEFAULT_AUTH_TYPE } from 'utils/constants';
import { APP_CONTEXT } from 'utils/state';
import { useEffect } from 'react';

export default function AuthTypeNew() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const AUTH_TYPES = Object.keys(AUTH_KEYS);

  const [authTypeContent, setAuthTypeContent] = useState(
    appContext.authType.value?.content || AUTH_KEYS[DEFAULT_AUTH_TYPE]
  );
  const [authType, setAuthType] = useState(
    Object.keys(appContext.authType.value?.type || {})[0] || DEFAULT_AUTH_TYPE
  );
  const [totalKeys, setTotalKeys] = useState(
    AUTH_TYPES.indexOf(appContext.authType.value?.type || DEFAULT_AUTH_TYPE) + 1
  );
  const [wasSaved, setWasSaved] = useState(false);

  useEffect(() => {
    if (appContext.authType.value) {
      if (appContext.authType.value.type) {
        setAuthType(appContext.authType.value.type);
      }

      if (appContext.authType.value.content) {
        setTotalKeys(Object.keys(appContext.authType.value.content).length);
        setAuthTypeContent(appContext.authType.value.content);
      }
    }
  }, [appContext.authType]);

  useEffect(() => {
    if (wasSaved) {
      setWasSaved(false);
    }
  }, [authType, authTypeContent]);

  const handleAuthTypeChange = (e) => {
    try {
      const totalKeys = parseInt(e.target.value);
      if (totalKeys <= AUTH_TYPES.length) {
        const authType = AUTH_TYPES[totalKeys - 1];
        const updatedAuthTypeContent = {
          ...AUTH_KEYS[authType],
          ...authTypeContent,
        };
        setAuthType(authType);
        setAuthTypeContent(updatedAuthTypeContent);
        setTotalKeys(totalKeys);
      }
    } catch (error) {
      console.error('WARN', 'Failed to update AuthType');
    }
  };

  const renderAuthKeyFields = (content) => {
    return Object.keys(content).map((key) => (
      <React.Fragment key={key}>
        <div className="auth-key-field">
          <div className="auth-key-field-value">{key}</div>
          <Tooltip title={AUTH_KEYS_INFO[authType][key]} placement="right">
            <InfoIcon
              style={{
                height: '15px',
                width: '15px',
              }}
            />
          </Tooltip>
        </div>
        <input
          id={`${key}-input`}
          className="material-input"
          type="text"
          value={authTypeContent[key]}
          onChange={(e) => {
            const target = e.target;
            let updatedContent = { ...authTypeContent };
            if (target instanceof HTMLInputElement) {
              updatedContent[key] = target.value;
            }
            setAuthTypeContent(updatedContent);
          }}
        />
      </React.Fragment>
    ));
  };

  const handleClearOperation = () => {
    setAuthTypeContent(AUTH_KEYS[authType]);
    setAppContext((prevState) => ({
      ...prevState,
      authType: {
        ...prevState.authType,
        value: {
          type: authType,
          content: AUTH_KEYS[authType],
        },
      },
    }));
  };

  const handleSaveOperation = () => {
    setAppContext((prevState) => ({
      ...prevState,
      authType: {
        ...prevState.authType,
        value: {
          type: authType,
          content: authTypeContent,
        },
      },
    }));
    setWasSaved(true);
  };

  return (
    <div className="auth-type">
      <div className="auth-type-header header">
        Processor Authorization Mapping
      </div>
      <div className="auth-type-subheader">
        When using Hyperswitch as your payment processor, it's important to
        understand the identifiers required for the Authorization Header. <br />{' '}
        <br />
        These identifiers are essential for secure and authenticated
        transactions. Each processor may have different requirements. For
        example, the Noon processor requires three identifiers:
        BusinessIdentifier, ApplicationIdentifier, and ApplicationKey. These
        three identifiers will be internally mapped to (api_key, key1, and
        api_secret) on Hyperswitch's end.
        <br /> <br />
        Please make sure you have the correct identifiers ready for your chosen
        processor to ensure smooth and secure payment processing through
        Hyperswitch.
      </div>
      <div className="auth-type-flow-type">
        <div className="flow-type-header">Identifiers in Auth Header</div>
        <Dropdown
          options={[1, 2, 3, 4]}
          selectedOption={totalKeys}
          handleSelectChange={handleAuthTypeChange}
          type="number of identifiers"
        />
      </div>
      <div className="auth-type-content">
        <div className="auth-type-header-map">
          <div className="header">
            <div className="heading">Authorization Header Mapping</div>
            <div className="subheading">
              Map processor identifiers to HyperSwitch identifiers
            </div>
          </div>
          <div className="content">{renderAuthKeyFields(authTypeContent)}</div>
          <div className="footer">
            <div className="clear button" onClick={handleClearOperation}>
              Clear
            </div>
            <div
              className={`save button${wasSaved ? ' disabled' : ''}`}
              onClick={() => (wasSaved ? null : handleSaveOperation())}
            >
              {wasSaved ? 'Saved' : 'Save Mapping'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
