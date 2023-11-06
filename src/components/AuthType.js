// @ts-check

import React, { useState } from 'react';
import Dropdown from './Dropdown';
import 'jsoneditor/dist/jsoneditor.css';
import JsonEditor from './JsonEditor';

function AuthType() {
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
  let auth = JSON.parse(localStorage.auth_type || '{}');
  const [authType, setAuthType] = useState(auth?.type || 'HeaderKey');
  const [content, setContent] = useState(auth?.content || types['HeaderKey']);

  const onSaveClick = (jsonEditor) => {
    const requestData = jsonEditor.get();
    localStorage.auth_type = JSON.stringify({
      ...JSON.parse(localStorage.auth_type),
      type: authType,
      content: requestData,
    });
  };
  const onAuthTypeChange = (e, jsonEditor) => {
    setAuthType(e.target.value);
    setContent(types[e.target.value]);
  };

  const renderAuthKeyFields = (content) => {
    return Object.keys(content).map((key) => (
      <div className="auth-key" key={key}>
        <div className="auth-key-input">
          <input
            className="material-input"
            type="text"
            onKeyUp={(e) => {
              let updatedContent = { ...content };
              updatedContent[key] = e.target.value;
              setContent(updatedContent);
            }}
          />
        </div>
        <div className="auth-key-field">
          <div className="auth-key-field-value">{key}</div>
          <div className="auth-key-field-info">{typesInfo[authType][key]}</div>
        </div>
      </div>
    ));
  };

  return (
    <div className="auth-type">
      <div className="auth-type-header">
        <Dropdown
          options={authTypes}
          selectedOption={authType}
          handleSelectChange={onAuthTypeChange}
          type="Auth type"
        />
      </div>
      <div className="auth-keys">
        <div className="auth-keys-header">Map for {authType}</div>
        {renderAuthKeyFields(content)}
      </div>
      <JsonEditor
        is_saveable={true}
        onSave={onSaveClick}
        content={content}
      ></JsonEditor>
    </div>
  );
}

export default AuthType;
