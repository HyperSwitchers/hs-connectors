import React, { useState } from 'react';
import Dropdown from './Dropdown';
import "jsoneditor/dist/jsoneditor.css";
import JsonEditor from './JsonEditor';

function AuthType() {
  const authTypes = ['HeaderKey', 'BodyKey', 'SignatureKey', 'MultiAuthKey'];
  const types = { 'HeaderKey': { 'api_key': '' }, 'BodyKey': { 'api_key': '', 'key1': '' }, 'SignatureKey': { 'api_key': '', 'key1': '', 'api_secret': '' }, 'MultiAuthKey': { 'api_key': '', 'key1': '', 'api_secret': '', 'key2': '' } };
  const [authType, setAuthType] = useState(authTypes[0]);
  const [content, setContent] = useState(types['HeaderKey']);

  const onSaveClick = (jsonEditor) => {
    const requestData = jsonEditor.get();
    localStorage.auth_type = JSON.stringify(requestData);

  }
  const onAuthTypeChange = (e, jsonEditor) => {
    setAuthType(e.target.value);
    setContent(types[e.target.value]);
  }

  return (
    <div className='auth-type'>
      <div style={{marginBottom: '10px'}}><Dropdown options={authTypes} selectedOption={authType} handleSelectChange={onAuthTypeChange} type='Select Auth type' /></div>
      <JsonEditor is_saveable={true} onSave={onSaveClick} content={content}></JsonEditor>
    </div>
  );
};

export default AuthType;