// @ts-check

import React, { useEffect, useState } from 'react';
import Dropdown from '../../atomic/Dropdown';
import 'jsoneditor/dist/jsoneditor.css';
import { APP_CONTEXT, updateAppContextInLocalStorage } from 'utils/state';
import { AUTH_KEYS, CODE_SNIPPETS, DEFAULT_AUTH_TYPE } from 'utils/constants';
import { useRecoilState } from 'recoil';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

function AuthType() {
  const authTypes = ['HeaderKey', 'BodyKey', 'SignatureKey', 'MultiAuthKey'];
  const typesInfo = {
    HeaderKey: {
      api_key:
        'This is the API Key provided by the processor. Think of it as a bearer token, which is like a secure key that grants access to your account.',
    },
    BodyKey: {
      api_key:
        'This is the API Key provided by the processor. Think of it as a bearer token, which is like a secure key that grants access to your account.',
      key1: 'API Key 1 is an additional key or authorization that you need to provide to the processor. It is an extra layer of security or identification required for specific transactions.',
    },
    SignatureKey: {
      api_key:
        'This is the API Key provided by the processor. Think of it as a bearer token, which is like a secure key that grants access to your account.',
      key1: 'API Key 1 is an additional key or authorization that you need to provide to the processor. It is an extra layer of security or identification required for specific transactions.',
      api_secret:
        'The API Secret is provided by the processor and is used to generate a signature for authentication and security purposes. It helps verify the integrity of your requests and data.',
    },
    MultiAuthKey: {
      api_key:
        'This is the API Key provided by the processor. Think of it as a bearer token, which is like a secure key that grants access to your account.',
      key1: 'API Key 1 is an additional key or authorization that you need to provide to the processor. It is an extra layer of security or identification required for specific transactions.',
      api_secret:
        'The API Secret is provided by the processor and is used to generate a signature for authentication and security purposes. It helps verify the integrity of your requests and data.',
      key2: 'Similar to API Key 1, API Key 2 is another additional key or authorization that you need to provide to the processor. It may serve a unique purpose or role in the authorization process.',
    },
  };
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const auth = appContext.authType.value;
  const [totalKeys, setTotalKeys] = useState(
    authTypes.indexOf(auth?.type || DEFAULT_AUTH_TYPE) + 1
  );
  const [selectedAuthType, setSelectedAuthType] = useState(
    auth?.type || DEFAULT_AUTH_TYPE
  );
  const [content, setContent] = useState(
    auth?.content || AUTH_KEYS[DEFAULT_AUTH_TYPE]
  );
  const [codeIntegration, selectCodeIntegration] = useState(CODE_SNIPPETS[0]);
  const [isSaved, setIsSaved] = useState(false);

  /**
   * Usecase - set isSaved flag to false to indicate that new authType content can be saved in main app state
   * Trigger - whenever content is updated
   */
  useEffect(() => {
    setIsSaved(false);
  }, [content]);

  /**
   * Usecase - update selectedAuthType and set the content accordingly
   * Trigger - whenever new authType is selected
   */
  useEffect(() => {
    const auth = appContext.authType.value;
    if (auth?.type) {
      setSelectedAuthType(auth.type);
    }
    if (auth?.content) {
      setContent(auth.content);
    }
  }, [appContext.authType]);

  const onSaveClick = (requestData) => {
    setIsSaved(true);
    const updatedAppContext = {
      ...appContext,
      authType: {
        ...appContext.authType,
        value: {
          type: selectedAuthType,
          content: requestData,
        },
      },
      selectedFlow: 'Authorize',
    }
    setAppContext(updatedAppContext);
    updateAppContextInLocalStorage(updatedAppContext);
  };
  const onAuthTypeChange = (e, jsonEditor) => {
    try {
      const totalKeys = parseInt(e.target.value);
      if (totalKeys <= authTypes.length) {
        const authType = authTypes.at(totalKeys - 1);
        const updatedContent = { ...AUTH_KEYS[authType], ...content };
        Object.keys(updatedContent).map((k) => {
          if (!Object.keys(AUTH_KEYS[authType]).includes(k)) {
            delete updatedContent[k];
          }
        });
        setTotalKeys(totalKeys);
        setSelectedAuthType(authType);
        setContent(updatedContent);
        setAppContext({
          ...appContext,
          authType: {
            ...appContext.authType,
            value: { type: authType, content: updatedContent },
          },
        });
      }
    } catch (error) {}
  };

  const renderAuthKeyFields = (content) => {
    return Object.keys(content).map((key) => (
      <React.Fragment key={key}>
        <div className="auth-key-field">
          <div className="auth-key-field-value">{key}</div>
          <Tooltip title={typesInfo[selectedAuthType][key]} placement="right">
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
          value={content[key]}
          onChange={(e) => {
            const target = e.target;
            let updatedContent = { ...content };
            if (target instanceof HTMLInputElement) {
              updatedContent[key] = target.value;
            }
            setContent(updatedContent);
          }}
        />
      </React.Fragment>
    ));
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
        {/* Hyperswitch authorization keys:
        <ol>
          <li><b>API Key:</b> This is the API Key provided by the processor. Think of it as a bearer token, which is like a secure key that grants access to your account.</li>
          <li><b>API Key 1:</b> API Key 1 is an additional key or authorization that you need to provide to the processor. It's an extra layer of security or identification required for specific transactions.</li>
          <li><b>API Key 2:</b> Similar to API Key 1, API Key 2 is another additional key or authorization that you need to provide to the processor. It may serve a unique purpose or role in the authorization process.</li>
          <li><b>API Secret:</b> The API Secret is provided by the processor and is used to generate a signature for authentication and security purposes. It helps verify the integrity of your requests and data.</li>
        </ol> */}
      </div>
      <div className="auth-type-flow-type">
        <div className="flow-type-header">Identifiers in Auth Header</div>
        <Dropdown
          options={[1, 2, 3, 4]}
          selectedOption={totalKeys}
          handleSelectChange={onAuthTypeChange}
          type="number of identifiers"
        />
      </div>
      <div className="auth-type-content">
        <div className="auth-type-header-map">
          <div className="header">
            <div className="heading">Authorization Header Mapping</div>
            <div className="subheading">
              Map processor identifiers to Hyperswitch identifiers
            </div>
          </div>
          <div className="content">{renderAuthKeyFields(content)}</div>
          <div className="footer">
            <div
              className="clear button"
              onClick={() => {
                setContent(AUTH_KEYS[selectedAuthType]);
                setAppContext({
                  ...appContext,
                  authType: {
                    ...appContext.authType,
                    value: {
                      type: selectedAuthType,
                      content: AUTH_KEYS[selectedAuthType],
                    },
                  },
                });
              }}
            >
              Clear
            </div>
            <div
              onClick={() => (!isSaved ? onSaveClick(content) : null)}
              className={`save button${isSaved ? ' disabled' : ''}`}
            >
              {isSaved ? 'Saved' : 'Save Mapping'}
            </div>
          </div>
        </div>
        {/* <div className="auth-type-code-snippets">
          <div className="code-snippet-header">
            {CODE_SNIPPETS.map((l) => (
              <div
                key={l}
                className={`integration${
                  l === codeIntegration ? ' selected' : ''
                }`}
                onClick={() => selectCodeIntegration(l)}
              >
                {l}
              </div>
            ))}
            <div className="copy-to-clipboard">...</div>
          </div>
          <div className="viewer">{}</div>
        </div> */}
      </div>
    </div>
  );
}

export default AuthType;
