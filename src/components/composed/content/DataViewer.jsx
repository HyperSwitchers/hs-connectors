import { Checkbox, Switch, styled } from '@mui/material';
import AntSwitch from 'components/atomic/AntSwitch';
import Dropdown from 'components/atomic/Dropdown';
import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { addFieldsToNodes, deepCopy, updateNestedJson } from 'utils/common';
import { SUPPORTED_HTTP_METHODS } from 'utils/constants';
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
        const updates = {
          codeInvalidated: true,
          [appContextField]: {
            ...appContext[appContextField],
            mapping: updatedMapping,
          },
        };
        if (appContext.statusVariable === '$' + field) {
          updates.status = {
            value: updatedStatus,
            mapping: addFieldsToNodes(updatedStatus),
          };
        }
        setAppContext((prevState) => ({
          ...prevState,
          ...updates,
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
        const updates = {
          codeInvalidated: true,
          [appContextField]: {
            ...appContext[appContextField],
            mapping: updatedMapping,
          },
        };
        if (appContext.statusVariable === '$' + field) {
          updates.status = {
            value: updatedStatus,
            mapping: addFieldsToNodes(updatedStatus),
          };
        }
        setAppContext({
          ...appContext,
          ...updates,
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
    const appUpdates = {
      codeInvalidated: true,
      [appContextField]: {
        ...appContext[appContextField],
        mapping: updatedMapping,
      },
    };

    if (appContextField === 'hsResponseFields') {
      let updatedValue = { ...appContext[appContextField].value };
      updatedValue = updateNestedJson(
        updatedValue,
        fields,
        mapUpdates[updateField]
      );
      appUpdates.hsResponseFields.value = updatedValue;

      if (field === 'status') {
        appUpdates.statusVariable = mapUpdates[updateField];
        const keys = (mapUpdates[updateField] || '')
          .replace('$', '')
          .split('.')
          .flatMap((f) => [f, 'value']);
        keys.pop();
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
          responseStatusMappingUpdate.value = [
            responseStatusMappingUpdate.value,
          ];
        }
        appUpdates.status = {
          ...appContext.status,
          value: responseStatusMappingUpdate.value.reduce((obj, m) => {
            obj[m] = null;
            return obj;
          }, {}),
        };
        let updateResponseFieldsMapping = {
          ...appContext.responseFields.mapping,
        };
        updateResponseFieldsMapping = updateNestedJson(
          updateResponseFieldsMapping,
          keys,
          responseStatusMappingUpdate
        );
        appUpdates.responseFields = {
          ...appContext.responseFields,
          mapping: updateResponseFieldsMapping,
        };
      }
    }
    setAppContext((prevState) => ({
      ...prevState,
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
                fieldSuggestions =
                  field === 'response.redirection_data.http_method'
                    ? SUPPORTED_HTTP_METHODS
                    : [...(headers[header].suggestions || [])],
                updateField = headers[header].update;

              if (
                header !== 'type' &&
                field !== 'response.redirection_data.http_method'
              ) {
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
              if (header === 'valueMap' && Array.isArray(currentField.value)) {
                return <div className="table-cell"></div>;
              }
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
                        size="small"
                        color="success"
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
                case 'switch':
                  return (
                    <div key={`${header}-${i}`} className="table-cell">
                      <AntSwitch
                        value={currentValue}
                        size="small"
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
                        value.toString()
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
