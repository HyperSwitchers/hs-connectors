import { Checkbox } from '@mui/material';
import Dropdown from 'components/atomic/Dropdown';
import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { addFieldsToNodes, deepCopy, updateNestedJson } from 'utils/common';
import { APP_CONTEXT } from 'utils/state';

export default function DataViewer({ appContextField, headers, fieldNames }) {
  let [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const [headerFields, setHeaderFields] = useState([]);
  const [variantRequestor, setVariantRequestor] = useState(null);

  useEffect(() => {
    setHeaderFields(Object.keys(headers));
  }, [headers]);

  const handleVariantAddition = (field, currentField) => {
    const input = document.getElementById(`variant-input-${field}`);
    if (input instanceof HTMLInputElement) {
      let updatedMapping = appContext[appContextField].mapping;
      try {
        const fields = field.split('.').flatMap((f) => [f, 'value']);
        let value = deepCopy(currentField.value);
        value = Array.isArray(value) ? value : [value];
        const newVariants = value.concat(
          input?.value
            ?.split(',')
            ?.map((v) => v?.trim())
            .filter((f) => !value.includes(f))
        );
        updatedMapping = updateNestedJson(updatedMapping, fields, newVariants);
        setVariantRequestor(null);
        const updatedStatus = newVariants.reduce((obj, v) => {
          obj[v] = (appContext.status?.value || {})[v] || '';
          return obj;
        }, {});
        setAppContext((prevState) => ({
          ...prevState,
          codeInvalidated: true,
          status: {
            value: updatedStatus,
            mapping: addFieldsToNodes(updatedStatus),
          },
          [appContextField]: {
            ...appContext[appContextField],
            mapping: updatedMapping,
          },
        }));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleVariantDeletion = (field, variant, currentField) => {
    let updatedMapping = deepCopy(appContext[appContextField].mapping);
    if (Array.isArray(currentField.value)) {
      const index = currentField.value.indexOf(variant);
      if (index > -1) {
        const updatedCurrentField = deepCopy(currentField);
        updatedCurrentField.value.splice(index, 1);
        const fields = field.split('.');
        const keys = fields.flatMap((f) => [f, 'value']);
        updatedMapping = updateNestedJson(
          updatedMapping,
          keys,
          updatedCurrentField.value
        );
        const updatedStatus = updatedCurrentField.value.reduce((obj, v) => {
          obj[v] = (appContext.status?.value || {})[v] || '';
          return obj;
        }, {});
        setAppContext({
          ...appContext,
          codeInvalidated: true,
          status: {
            value: updatedStatus,
            mapping: addFieldsToNodes(updatedStatus),
          },
          [appContextField]: {
            ...appContext[appContextField],
            mapping: updatedMapping,
          },
        });
      }
    }
  };

  const updateFields = (field, updateField, mapUpdates) => {
    let updatedMapping = { ...appContext[appContextField].mapping };
    const fields = field.split('.');
    const keys = fields.flatMap((f) => [f, 'value']);
    keys.pop();
    updatedMapping = updateNestedJson(updatedMapping, keys, mapUpdates);
    const appUpdates = {};

    if (appContextField === 'hsResponseFields' && field === 'status') {
      appUpdates.statusVariable = mapUpdates[updateField];
      appUpdates.hsResponseFields = {
        mapping: updatedMapping,
        value: {
          ...appContext.hsResponseFields.value,
          status: mapUpdates[updateField],
        },
      };

      const responseStatusMappingUpdate = {
        ...keys.reduce(
          (obj, k) => obj[k],
          appContext.responseFields.mapping || {}
        ),
        type: 'enum',
      };
      if (
        !Array.isArray(responseStatusMappingUpdate.value) &&
        responseStatusMappingUpdate.value !== null &&
        responseStatusMappingUpdate.value !== undefined
      ) {
        responseStatusMappingUpdate.value = [responseStatusMappingUpdate.value];
      }
      appUpdates.responseFields = {
        ...appContext.responseFields,
        mapping: {
          ...appContext.responseFields.mapping,
          [field]: responseStatusMappingUpdate,
        },
      };
    }

    setAppContext((prevState) => ({
      ...prevState,
      codeInvalidated: true,
      [appContextField]: {
        ...prevState[appContextField],
        mapping: updatedMapping,
      },
      ...appUpdates,
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
                fieldSuggestions = [...(headers[header].suggestions || [])],
                updateField = headers[header].update;

              if (header !== 'type') {
                fieldSuggestions.push(value);
              }
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
                          updateFields(field, updateField, updates);
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
                          updateFields(field, updateField, updates);
                        }}
                        selectedOption={currentValue}
                        type={null}
                      />
                    </div>
                  );
                default:
                  return (
                    <div key={`${header}-${i}`} className="table-cell">
                      {header === 'value' && currentField.type === 'enum' ? (
                        <React.Fragment>
                          {currentValue !== null ||
                          currentValue !== undefined ? (
                            Array.isArray(currentValue) ? (
                              currentValue.map((v) => (
                                <div
                                  key={`variant-${i}-${v}`}
                                  className="variant-wrap"
                                >
                                  {v}
                                  <div
                                    className="variant-delete"
                                    onClick={() =>
                                      handleVariantDeletion(
                                        field,
                                        v,
                                        currentField
                                      )
                                    }
                                  >
                                    x
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="variant-wrap">
                                {currentValue.toString()}
                                <div
                                  className="variant-delete"
                                  onClick={() =>
                                    handleVariantDeletion(
                                      field,
                                      currentValue,
                                      currentField
                                    )
                                  }
                                >
                                  x
                                </div>
                              </div>
                            )
                          ) : null}
                          {variantRequestor === field ? (
                            <input
                              placeholder="Eg: INR,GBP,USD"
                              className="material-input variant-input"
                              id={`variant-input-${field}`}
                              type="text"
                              onKeyUp={(e) =>
                                e.key === 'Enter'
                                  ? handleVariantAddition(field, currentField)
                                  : null
                              }
                            />
                          ) : (
                            <div
                              className="variant-add"
                              onClick={() => setVariantRequestor(field)}
                            >
                              + Add more variants
                            </div>
                          )}
                        </React.Fragment>
                      ) : (
                        currentValue.toString()
                      )}
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
