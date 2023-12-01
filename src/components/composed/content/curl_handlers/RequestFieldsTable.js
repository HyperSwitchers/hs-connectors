import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Autocomplete,
  TextField,
  Tooltip,
} from '@mui/material';
import 'jsoneditor/dist/jsoneditor.css';
import {
  deepCopy,
  flattenObject,
  is_mapped_field,
  updateNestedJson,
} from 'utils/common';
import { DEFAULT_SECRETS_IN_SYNONYMS, TYPES_LIST } from 'utils/constants';
import jsonpath from 'jsonpath';
import { useRecoilState } from 'recoil';
import { APP_CONTEXT } from 'utils/state';

function IRequestFieldsTable({ suggestions = {} }) {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const defaultProps = {
    options: Object.keys(suggestions).map((s) => '$' + s),
    getOptionLabel: (option) => option,
  };

  const [fields, setFields] = useState([]);
  const [variantRequestor, setVariantRequestor] = useState(null);

  /**
   * Usecase - update the fields in connector response
   * Trigger - whenever appContext is updated
   */
  useEffect(() => {
    const requestFields = deepCopy(
      appContext.flows[appContext.selectedFlow].requestFields.value || {}
    );
    setFields(flattenObject(requestFields));
  }, [appContext.flows, appContext.selectedFlow]);

  const handleVariantAddition = (field) => {
    const input = document.getElementById(`variant-input-${field}`);
    if (input instanceof HTMLInputElement) {
      let row = {};
      try {
        row =
          jsonpath.query(
            appContext.flows[appContext.selectedFlow].requestFields.mapping,
            '$.' + field.replaceAll('.', '.value.').replaceAll('-', '')
          )[0] || {};
      } catch (error) {
        console.error('jsonpath query failed', error);
        return;
      }
      if (Array.isArray(row.value)) {
        let updatedMapping = {
          ...appContext.flows[appContext.selectedFlow].requestFields.mapping,
        };
        const newVariants = row.value.concat(
          input.value
            .split(',')
            .map((v) => v.trim())
            .filter((f) => !row.value.includes(f))
        );
        const fields = field.split('.');
        const keys = fields.flatMap((f) => [f, 'value']);
        updatedMapping = updateNestedJson(updatedMapping, keys, newVariants);
        setVariantRequestor(null);
        const updatedFlows = deepCopy(appContext.flows);
        updatedFlows[appContext.selectedFlow].requestFields.mapping =
          updatedMapping;
        setAppContext({ ...appContext, flows: updatedFlows });
      }
    }
  };

  const handleVariantDeletion = (field, variant) => {
    let updatedMapping = deepCopy(
      appContext.flows[appContext.selectedFlow].requestFields.mapping
    );
    let row = {};
    try {
      row =
        jsonpath.query(
          updatedMapping,
          '$.' + field.replaceAll('.', '.value.').replaceAll('-', '')
        )[0] || {};
    } catch (error) {
      console.error('jsonpath query failed', error);
      return;
    }
    if (Array.isArray(row.value)) {
      const index = row.value.indexOf(variant);
      if (index > -1) {
        row.value.splice(index, 1);
        const fields = field.split('.');
        const keys = fields.flatMap((f) => [f, 'value']);
        updatedMapping = updateNestedJson(updatedMapping, keys, row.value);
        const updatedFlows = deepCopy(appContext.flows);
        updatedFlows[appContext.selectedFlow].requestFields.mapping =
          updatedMapping;
        setAppContext({ ...appContext, flows: updatedFlows });
      }
    }
  };

  function updateRequestFields(row, update) {
    let updatedMapping = deepCopy(
      appContext.flows[appContext.selectedFlow].requestFields.mapping
    );
    const fields = row.split('.');
    const keys = fields.flatMap((f) => [f, 'value']);
    keys.pop();
    updatedMapping = updateNestedJson(updatedMapping, keys, update);
    const updatedFlows = deepCopy(appContext.flows);
    updatedFlows[appContext.selectedFlow].requestFields.mapping =
      updatedMapping;
    setAppContext({ ...appContext, flows: updatedFlows });
  }

  return (
    <div className="editor">
      <TableContainer component={Paper} sx={{ overflow: 'scroll' }}>
        <Table
          className="request-body-table"
          aria-label="simple table"
          stickyHeader
        >
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Connector Field Name</b>
              </TableCell>
              <TableCell>
                <b>Value</b>
              </TableCell>
              <TableCell>
                <b>Optional</b>
              </TableCell>
              <TableCell>
                <b>Secret</b>
              </TableCell>
              <TableCell>
                <b>DateType</b>
              </TableCell>
              {fields?.filter((row) => {
                if (
                  !appContext.flows[appContext.selectedFlow]?.requestFields
                    .mapping
                ) {
                  return false;
                }
                let field = {};
                try {
                  field =
                    jsonpath.query(
                      appContext.flows[appContext.selectedFlow].requestFields
                        .mapping,
                      '$.' + row.replaceAll('.', '.value.').replaceAll('-', '')
                    )[0] || {};
                } catch (error) {
                  console.error('jsonpath query failed', error);
                  return false;
                }
                return field.type === 'enum';
              }).length > 0 ? (
                <TableCell>
                  <b>Variants</b>
                </TableCell>
              ) : null}
              <TableCell>
                <b>Hyperswitch Field Name</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields?.map((row) => {
              if (
                !appContext.flows[appContext.selectedFlow]?.requestFields
                  .mapping
              ) {
                return null;
              }
              let field = {};
              let value = '';
              try {
                field =
                  jsonpath.query(
                    appContext.flows[appContext.selectedFlow].requestFields
                      .mapping,
                    '$.' + row.replaceAll('.', '.value.').replaceAll('-', '')
                  )[0] || {};
                value =
                  typeof field.value === 'string'
                    ? field.value.startsWith('$')
                      ? appContext.flows[appContext.selectedFlow].requestFields
                          .value[row]
                      : field.value
                    : field.value;
                value = Array.isArray(value)
                  ? `[ ${value.join(', ')} ]`
                  : typeof value === 'object'
                  ? JSON.stringify(value)
                  : value;
              } catch (error) {
                console.error('jsonpath query failed', error);
                return null;
              }
              return (
                <TableRow key={row}>
                  <TableCell>{row}</TableCell>
                  <TableCell>{value}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={field.optional}
                      key={`${row}-optional-${appContext.selectedFlow}`}
                      onChange={() =>
                        updateRequestFields(row, {
                          ...field,
                          optional: !field.optional,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={field.secret}
                      key={`${row}-secret-${appContext.selectedFlow}`}
                      onChange={() =>
                        updateRequestFields(row, {
                          ...field,
                          secret: !field.secret,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      defaultValue={field.type}
                      options={TYPES_LIST}
                      key={`${row}-type-${appContext.selectedFlow}`}
                      sx={{ width: 120 }}
                      freeSolo={false}
                      onChange={(event, newValue) => {
                        const updates = {
                          ...field,
                          type: newValue,
                        };
                        if (newValue === 'enum') {
                          updates['value'] = [field.value].flat();
                        }
                        updateRequestFields(row, updates);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="" variant="standard" />
                      )}
                    ></Autocomplete>
                  </TableCell>
                  {field.type === 'enum' && Array.isArray(field.value) ? (
                    <TableCell>
                      <div className="response-enum-variants">
                        <React.Fragment>
                          {field.value.map((variant) => (
                            <div
                              key={`${row}-type-${variant}-${appContext.selectedFlow}`}
                              className="variant-wrap"
                            >
                              <div className="variant-name">{variant}</div>
                              <div
                                className="variant-delete"
                                onClick={() =>
                                  handleVariantDeletion(row, variant)
                                }
                              >
                                x
                              </div>
                            </div>
                          ))}
                          {variantRequestor !== row && (
                            <div
                              className="variant-add"
                              onClick={() => setVariantRequestor(row)}
                            >
                              + Add more variants
                            </div>
                          )}
                        </React.Fragment>
                        {variantRequestor === row ? (
                          <input
                            placeholder="Eg: INR,GBP,USD"
                            id={`variant-input-${row}`}
                            className="material-input variant-input"
                            type="text"
                            onKeyUp={(e) =>
                              e.key === 'Enter'
                                ? handleVariantAddition(row)
                                : null
                            }
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Tooltip
                      title={is_mapped_field(field) ? 'Mapped' : 'Unmapped'}
                      placement="right"
                    >
                      <Autocomplete
                        defaultValue={field.value}
                        {...defaultProps}
                        key={`${row}-value-${appContext.selectedFlow}`}
                        sx={{ width: 280 }}
                        freeSolo={true}
                        onChange={(event, newValue) => {
                          const updates = {
                            ...field,
                            value: newValue,
                          };
                          if (DEFAULT_SECRETS_IN_SYNONYMS.includes(newValue)) {
                            updates['secret'] = true;
                          }
                          updateRequestFields(row, updates);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            sx={{
                              input: {
                                color: is_mapped_field(field)
                                  ? '#42A5F5'
                                  : '#000',
                              },
                            }}
                            label=""
                            variant="standard"
                          />
                        )}
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default IRequestFieldsTable;