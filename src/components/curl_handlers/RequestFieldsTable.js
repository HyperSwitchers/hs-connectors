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
  addFieldsToNodes,
  deepCopy,
  flattenObject,
  is_mapped_field,
  mapFieldNames,
  typesList,
  updateNestedJson,
} from 'utils/search_utils';
import jsonpath from 'jsonpath';
import { useRecoilValue } from 'recoil';
import { APP_CONTEXT } from 'utils/state';

function IRequestFieldsTable({
  suggestions = {},
  updateAppContext = (v) => {},
}) {
  const defaultProps = {
    options: Object.keys(suggestions).map((s) => '$' + s),
    getOptionLabel: (option) => option,
  };

  const appContext = useRecoilValue(APP_CONTEXT);

  const [fields, setFields] = useState([]);
  const [mapping, setMapping] = useState({});
  const [variantRequestor, setVariantRequestor] = useState(null);
  const [variants, setVariants] = useState({});

  useEffect(() => {
    const requestFields = deepCopy(
      appContext.flows[appContext.selectedFlow].requestFields.value || {}
    );
    const requestFieldsMapping = deepCopy(
      appContext.flows[appContext.selectedFlow].requestFields.mapping || {}
    );
    let mapping =
      Object.keys(requestFieldsMapping).length > 0
        ? requestFieldsMapping
        : addFieldsToNodes(mapFieldNames(requestFields));
    setMapping(mapping);
    setFields(flattenObject(requestFields));
  }, [appContext.flows[appContext.selectedFlow].requestFields]);

  const handleVariantAddition = (field) => {
    const input = document.getElementById(`variant-input-${field}`);
    if (input instanceof HTMLInputElement) {
      let updatedVariants = { ...variants };
      let updatedMapping = { ...mapping };
      const currentVal =
        jsonpath.query(
          mapping,
          '$.' + field.replaceAll('.', '.value.').replaceAll('-', '')
        )[0] || {};
      const newVariants = [currentVal].concat(
        input.value
          .split(',')
          .map((v) => v.trim())
          .filter((f) => f !== currentVal)
      );
      if (!updatedVariants[field]) {
        updatedVariants[field] = [];
      }
      const filteredVariants = newVariants.filter(
        (v) => v.length > 0 && !updatedVariants[field].includes(v)
      );
      updatedVariants[field] = updatedVariants[field].concat(filteredVariants);
      const fields = field.split('.');
      const keys = fields.flatMap((f) => [f, 'value']);
      updatedMapping = updateNestedJson(
        updatedMapping,
        keys,
        updatedVariants[field]
      );
      setMapping(updatedMapping);
      setVariantRequestor(null);
      setVariants(updatedVariants);
      const updatedFlows = deepCopy(appContext.flows);
      updatedFlows[appContext.selectedFlow].requestFields.mapping =
        updatedMapping;
      updateAppContext({ flows: updatedFlows });
    }
  };

  const handleVariantDeletion = (field, variant) => {
    let updatedVariants = deepCopy(variants);
    let updatedMapping = { ...mapping };
    const index = updatedVariants[field].indexOf(variant);
    if (index > -1) {
      updatedVariants[field].splice(index, 1);
      const fields = field.split('.');
      const keys = fields.flatMap((f) => [f, 'value']);
      if (updatedVariants[field].length === 0) {
        delete updatedVariants[field];
      }
      updatedMapping = updateNestedJson(
        updatedMapping,
        keys,
        updatedVariants[field]
      );
      setMapping(updatedMapping);
      setVariants(updatedVariants);
      const updatedFlows = deepCopy(appContext.flows);
      updatedFlows[appContext.selectedFlow].requestFields.mapping =
        updatedMapping;
      updateAppContext({ flows: updatedFlows });
    }
  };

  function updateRequestFields(row, update) {
    let updated = { ...mapping };
    setMapping(updated);
    const updatedFlows = deepCopy(appContext.flows);
    updatedFlows[appContext.selectedFlow].requestFields.mapping = updated;
    updateAppContext({ flows: updatedFlows });
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
                <b>Field Name</b>
              </TableCell>
              <TableCell>
                <b>Optional</b>
              </TableCell>
              <TableCell>
                <b>Secret</b>
              </TableCell>
              <TableCell>
                <b>Type</b>
              </TableCell>
              {fields?.filter((row) => {
                const field =
                  jsonpath.query(
                    mapping,
                    '$.' + row.replaceAll('.', '.value.').replaceAll('-', '')
                  )[0] || {};
                return field.type === 'enum';
              }).length > 0 ? (
                <TableCell>
                  <b>Variants</b>
                </TableCell>
              ) : null}
              <TableCell>
                <b>Hyperswitch Field</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields?.map((row) => {
              const field =
                jsonpath.query(
                  mapping,
                  '$.' + row.replaceAll('.', '.value.').replaceAll('-', '')
                )[0] || {};
              return (
                <TableRow key={row}>
                  <TableCell>{row}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={field.optional}
                      onChange={() => {
                        field.optional = !field.optional;
                        updateRequestFields();
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={field.secret}
                      onChange={() => {
                        field.secret = !field.secret;
                        updateRequestFields();
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      defaultValue={field.type}
                      options={typesList}
                      id={row + 'type'}
                      sx={{ width: 120 }}
                      freeSolo={false}
                      onChange={(event, newValue) => {
                        field.type = newValue;
                        updateRequestFields();
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="" variant="standard" />
                      )}
                    ></Autocomplete>
                  </TableCell>
                  {field.type === 'enum' ? (
                    <TableCell>
                      <div className="response-enum-variants">
                        {Object.keys(variants).includes(row) ? (
                          <React.Fragment>
                            {variants[row].map((variant) => (
                              <div
                                key={`${row}-${variant}`}
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
                        ) : null}

                        {!Object.keys(variants).includes(row) ||
                        variantRequestor === row ? (
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
                        id={row}
                        sx={{ width: 280 }}
                        freeSolo={true}
                        onChange={(event, newValue) => {
                          field.value = newValue;
                          updateRequestFields();
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
