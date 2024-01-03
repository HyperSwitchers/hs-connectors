// @ts-check

import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

import Dropdown from 'components/atomic/Dropdown';
import { AUTH_KEYS, AUTH_KEYS_INFO, DEFAULT_AUTH_TYPE } from 'utils/constants';
import { APP_CONTEXT } from 'utils/state';
import { useEffect } from 'react';
import { toPascalCase } from 'utils/Parser';

export default function AuthType() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const AUTH_TYPES = Object.keys(AUTH_KEYS);

  const [authTypeContent, setAuthTypeContent] = useState(
    appContext.authType.value?.content || AUTH_KEYS[DEFAULT_AUTH_TYPE]
  );
  const [authType, setAuthType] = useState(
    appContext.authType.value?.type || DEFAULT_AUTH_TYPE
  );
  const [connectorName, setConnectorName] = useState(
    appContext.connectorName.toString()
  );
  const [totalKeys, setTotalKeys] = useState(
    AUTH_TYPES.indexOf(appContext.authType.value?.type || DEFAULT_AUTH_TYPE) + 1
  );
  const [wasSaved, setWasSaved] = useState(true);

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
    if (
      (wasSaved && authType !== appContext.authType.value?.type) ||
      JSON.stringify(authTypeContent) !==
        JSON.stringify(appContext.authType.value?.content || {})
    ) {
      setWasSaved(false);
    }
  }, [authType, authTypeContent]);

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

  const handleAuthTypeChange = (e) => {
    try {
      const totalKeys = parseInt(e.target.value);
      if (totalKeys <= AUTH_TYPES.length) {
        const authType = AUTH_TYPES[totalKeys - 1];
        const updatedAuthTypeContent = {
          ...AUTH_KEYS[authType],
          ...authTypeContent,
        };
        const newKeys = Object.keys(AUTH_KEYS[authType]);
        Object.keys(updatedAuthTypeContent).map((key) => {
          if (!newKeys.includes(key)) {
            delete updatedAuthTypeContent[key];
          }
        });
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
          <div className="auth-key-field-info">
            {AUTH_KEYS_INFO[authType][key]}
          </div>
          {/* <Tooltip title={AUTH_KEYS_INFO[authType][key]} placement="right">
            <InfoIcon
              style={{
                height: '15px',
                width: '15px',
              }}
            />
          </Tooltip> */}
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
  };

  const handleSaveOperation = () => {
    setAppContext((prevState) => ({
      ...prevState,
      selectedFlow: 'Authorize',
      codeInvalidated: true,
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
        Map your connector to HyperSwitch
      </div>
      <div className="auth-type-subheader">
        Identifiers are essential for secure and authenticated transactions.
        Please make sure you have the correct identifiers ready for your chosen
        processor to ensure smooth and secure payment processing through
        Hyperswitch.
      </div>
      <div className="auth-type-content">
        <div className="connector-name">
          <div className="label">Enter the name of your connector</div>
          <input
            type="text"
            className="material-input"
            placeholder="Enter Connector Name"
            value={connectorName}
            onChange={handleConnectorNameChange}
            onBlur={handleConnectorNameUpdate}
          />
        </div>
        <div className="auth-flow-type">
          <div className="label">
            Identifiers in Auth Header of your connecotr
          </div>
          <Dropdown
            options={[1, 2, 3, 4]}
            selectedOption={totalKeys}
            handleSelectChange={handleAuthTypeChange}
            type="number of identifiers"
          />
        </div>
        <div className="auth-type-header-map">
          <div className="header">
            Enter connector identifiers to map to HyperSwitch
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
