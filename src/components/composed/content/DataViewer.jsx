import { Checkbox } from '@mui/material';
import Dropdown from 'components/atomic/Dropdown';
import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { deepCopy, updateNestedJson } from 'utils/common';
import { APP_CONTEXT } from 'utils/state';

export default function DataViewer({ appContextField, headers, fieldNames }) {
  let [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const [headerFields, setHeaderFields] = useState([]);

  useEffect(() => {
    setHeaderFields(Object.keys(headers));
  }, [headers]);

  const updateFields = (field, updates) => {
    let updatedMapping = { ...appContext[appContextField].mapping };
    const fields = field.split('.');
    const keys = fields.flatMap((f) => [f, 'value']);
    keys.pop();
    updatedMapping = updateNestedJson(updatedMapping, keys, updates);
    setAppContext((prevState) => ({
      ...prevState,
      [appContextField]: {
        ...appContext[appContextField],
        mapping: updatedMapping,
      },
    }));
  };

  return (
    <div className="data-viewer">
      <div className="table">
        <div className="table-row">
          {headerFields.map((header) => (
            <div key={header} className="table-cell">
              {headers[header].value}
            </div>
          ))}
        </div>
        {fieldNames.map((field) => (
          <div key={field} className="table-row">
            {headerFields.map((header, i) => {
              if (i === 0)
                return (
                  <div key={`${header}-${i}`} className="table-cell">
                    {field}
                  </div>
                );
              const mapping = appContext[appContextField].mapping,
                content = appContext[appContextField].value,
                fieldType = headers[header].type,
                value = field
                  .split('.')
                  .reduce(
                    (obj, k) =>
                      obj[k] !== null || obj[k] !== undefined ? obj[k] : {},
                    content
                  ),
                fieldSuggestions = [
                  ...(headers[header].suggestions || []),
                  value,
                ],
                updateField = headers[header].update;

              let currentValue = [];
              const fields = field.split('.').flatMap((f) => [f, 'value']);
              fields.pop();
              const currentField = fields.reduce(
                (obj, k) =>
                  obj[k] !== null || obj[k] !== undefined ? obj[k] : {},
                mapping
              );
              if (header === 'valueMap' || header === 'value') {
                currentValue = currentField.value;
              } else {
                currentValue = currentField[header];
              }
              currentValue =
                typeof currentValue === 'object'
                  ? JSON.stringify(currentValue)
                  : currentValue;
              switch (fieldType) {
                case 'checkbox':
                  return (
                    <div key={`${header}-${i}`} className="table-cell">
                      <Checkbox
                        checked={currentValue}
                        onChange={(e, newValue) => {
                          const updates = {
                            ...currentField,
                            [updateField]: newValue,
                          };
                          updateFields(field, updates);
                        }}
                      />
                    </div>
                  );
                case 'dropdown':
                  return (
                    <div key={`${header}-${i}`} className="table-cell">
                      <Dropdown
                        options={fieldSuggestions}
                        handleSelectChange={(e) => {
                          const updates = {
                            ...currentField,
                            [updateField]: e.target.value,
                          };
                          updateFields(field, updates);
                        }}
                        selectedOption={currentValue}
                        type={null}
                      />
                    </div>
                  );
                default:
                  return (
                    <div key={`${header}-${i}`} className="table-cell">
                      {currentValue}
                    </div>
                  );
              }
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
