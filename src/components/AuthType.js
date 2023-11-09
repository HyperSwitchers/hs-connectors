// @ts-check

import React, { useEffect, useState } from 'react';
import Dropdown from './Dropdown';
import 'jsoneditor/dist/jsoneditor.css';
import { APP_CONTEXT } from 'utils/state';
import { codeSnippets } from 'utils/constants';
import { useRecoilValue } from 'recoil';
import { deepCopy } from 'utils/search_utils';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

function AuthType({ updateAppContext = (v) => {} }) {
  const authTypes = ['HeaderKey', 'BodyKey', 'SignatureKey', 'MultiAuthKey'];
  const types = {
    HeaderKey: { api_key: '' },
    BodyKey: { api_key: '', key1: '' },
    SignatureKey: {
      api_key: '',
      key1: '',
      api_secret: '',
    },
    MultiAuthKey: {
      api_key: '',
      key1: '',
      api_secret: '',
      key2: '',
    },
  };
  const typesInfo = {
    HeaderKey: { api_key: 'API Key' },
    BodyKey: { api_key: 'API Key', key1: 'Additional Key' },
    SignatureKey: {
      api_key: 'API Key',
      key1: 'Additional Key',
      api_secret: 'API secret for generating signatures',
    },
    MultiAuthKey: {
      api_key: 'API Key',
      key1: 'Additional Key',
      api_secret: 'API secret for generating signatures',
      key2: 'Additional Key 2',
    },
  };
  const appContext = useRecoilValue(APP_CONTEXT);
  const auth = appContext.authType.value;
  const [selectedAuthType, setSelectedAuthType] = useState(
    auth?.type || 'HeaderKey'
  );
  const [content, setContent] = useState(auth?.content || types['HeaderKey']);
  const [codeIntegration, selectCodeIntegration] = useState(codeSnippets[0]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(false);
  }, [content]);

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
    const updatedAuthTypeContent = {
      type: selectedAuthType,
      content: requestData,
    };
    setIsSaved(true);
    const updatedAuthType = deepCopy(appContext.authType);
    updatedAuthType.value = updatedAuthTypeContent;
    updateAppContext({ authType: updatedAuthType });
  };
  const onAuthTypeChange = (e, jsonEditor) => {
    const authType = e.target.value;
    setSelectedAuthType(authType);
    const updatedContent = { ...types[authType], ...content };
    Object.keys(updatedContent).map((k) => {
      if (!Object.keys(types[authType]).includes(k)) {
        delete updatedContent[k];
      }
    });
    setContent(updatedContent);
    const updatedAuthType = deepCopy(appContext.authType);
    updatedAuthType.value = { type: authType, content: updatedContent };
    updateAppContext({ authType: updatedAuthType });
  };

  const renderAuthKeyFields = (content) => {
    return Object.keys(content).map((key) => (
      <React.Fragment key={key}>
        <div
          className="auth-key-field"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
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
        Map Processor Authorization Header to Hyperswitch
      </div>
      <div className="auth-type-subheader">
        Every processor requires certain number of identifiers to be passed in
        their Authorisation Header. Select the number of identifiers below that
        your selected processor accepts. Then map them to Hyperswitch. <br />
        <br /> Eg. Noon processor accepts 3 identifier{' '}
        <code>
          (BusinessIdentifier, ApplicationIdentifier, ApplicationKey).
        </code>{' '}
        These three identifiers will now be mapped to{' '}
        <code>(api_key, key1 and api_secret)</code> internally on Hyperswitch's
        end.
      </div>
      <div className="auth-type-flow-type">
        <div className="flow-type-header">Flow Type</div>
        <Dropdown
          options={authTypes}
          selectedOption={selectedAuthType}
          handleSelectChange={onAuthTypeChange}
          type="Flow Type"
        />
      </div>
      <div className="auth-type-content">
        <div
          className="auth-type-header-map"
          style={{
            width: '45%',
            minWidth: 'max-content',
          }}
        >
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
                Object.keys(types).map((type) => {});
                setContent(types[selectedAuthType]);
                const updatedAuthType = deepCopy(appContext.authType);
                updatedAuthType.value = {
                  type: selectedAuthType,
                  content: types[selectedAuthType],
                };
                updateAppContext({ authType: updatedAuthType });
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
            {codeSnippets.map((l) => (
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
