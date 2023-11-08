import React, { useEffect, useState } from 'react';
import {
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  TextField,
} from '@mui/material';

import 'jsoneditor/dist/jsoneditor.css';
import {
  addFieldsToNodes,
  deepCopy,
  flattenObject,
  typesList,
} from 'utils/search_utils';
import jsonpath from 'jsonpath';
import { useRecoilValue } from 'recoil';
import { APP_CONTEXT } from 'utils/state';

function IConnectorResponseTable({ updateAppContext = (v) => {} }) {
  const appContext = useRecoilValue(APP_CONTEXT);
  const [fields, setFields] = useState([]);
  const [mapping, setMapping] = useState({});
  const [contextMenu, setContextMenu] = React.useState(null);
  const [contextMenuRequestor, setContextMenuRequestor] = useState(null);
  const [selectedFields, setSelectedFields] = useState([]);
  const [variantRequestor, setVariantRequestor] = useState(null);
  const [variants, setVariants] = useState({});

  useEffect(() => {
    const connectorResponse = deepCopy(
      appContext.flows[appContext.selectedFlow].responseFields.value || {}
    );
    const mapping = deepCopy(
      appContext.flows[appContext.selectedFlow].responseFields.mapping || {}
    );
    setFields(flattenObject(connectorResponse));
    setMapping(mapping);
  }, [appContext.flows[appContext.selectedFlow].responseFields]);

  function updateConnectorResponse() {
    let updated = { ...mapping };
    setMapping(updated);
    const updatedFlows = deepCopy(appContext.flows);
    updatedFlows[appContext.selectedFlow].responseFields.mapping = updated;
    updateAppContext({ flows: updatedFlows });
  }

  const handleFieldClick = (row) => {
    let updatedFields = [...selectedFields];
    let i = updatedFields.indexOf(row);
    if (i > -1) {
      updatedFields.splice(i, 1);
    } else {
      updatedFields.push(row);
    }
    setSelectedFields(updatedFields);
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    const requestor = event?.target?.parentElement?.id;
    if (requestor && !selectedFields.includes(requestor)) {
      setSelectedFields(selectedFields.concat(requestor));
    }
    setContextMenuRequestor(requestor);
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
          // Other native context menus might behave different.
          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
          null
    );
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleRemovalOfFields = () => {
    const updatedFields = fields.filter((f) => !selectedFields.includes(f));
    setSelectedFields([]);
    setFields(updatedFields);
  };

  const handleVariantAddition = (field) => {
    const input = document.getElementById(`variant-input-${field}`);
    if (input instanceof HTMLInputElement) {
      let updatedVariants = { ...variants };
      let updatedMapping = { ...mapping };
      const newVariants = [mapping[field].value].concat(
        input?.value
          ?.split(',')
          ?.map((v) => v?.trim())
          .filter((f) => f !== mapping[field].value)
      );
      if (!updatedVariants[field]) {
        updatedVariants[field] = [];
      }
      const filteredVariants = newVariants.filter(
        (v) => v?.length > 0 && !updatedVariants[field].includes(v)
      );
      updatedVariants[field] = updatedVariants[field].concat(filteredVariants);
      updatedMapping[field].value = updatedVariants[field];
      setMapping(updatedMapping);
      setVariantRequestor(null);
      setVariants(updatedVariants);
      const updatedFlows = deepCopy(appContext.flows);
      updatedFlows[appContext.selectedFlow].responseFields.mapping =
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
      if (updatedVariants[field].length === 0) {
        delete updatedVariants[field];
        updatedMapping[field] = addFieldsToNodes(
          deepCopy(
            appContext.flows[appContext.selectedFlow].responseFields.value || {}
          )
        )[field];
      } else {
        updatedMapping[field].value = updatedVariants[field];
      }
      setMapping(updatedMapping);
      const updatedFlows = deepCopy(appContext.flows);
      updatedFlows[appContext.selectedFlow].responseFields.mapping =
        updatedMapping;
      updateAppContext({ flows: updatedFlows });
      setVariants(updatedVariants);
    }
  };

  return (
    <div className="editor">
      <TableContainer
        component={Paper}
        sx={{ maxHeight: '500px', overflow: 'scroll' }}
      >
        <Table aria-label="simple table" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Field Name</b>
              </TableCell>
              <TableCell>
                <b>Value</b>
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
            </TableRow>
          </TableHead>
          <TableBody>
            {' '}
            {fields?.map((row) => {
              const field =
                jsonpath.query(
                  mapping,
                  '$.' + row.replaceAll('.', '.value.').replaceAll('-', '')
                )[0] || {};
              return (
                <React.Fragment key={row}>
                  <TableRow
                    id={row}
                    onContextMenu={handleContextMenu}
                    key={row}
                    selected={selectedFields.includes(row)}
                  >
                    <TableCell onClick={() => handleFieldClick(row)}>
                      {row}
                    </TableCell>
                    <TableCell
                      sx={{ maxWidth: '100px', wordBreak: 'break-word' }}
                    >
                      {field.value}
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
                          updateConnectorResponse();
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label="" variant="standard" />
                        )}
                      ></Autocomplete>
                    </TableCell>
                    <TableCell>
                      {field.type === 'enum' ? (
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
                      ) : null}
                    </TableCell>
                  </TableRow>
                  <Menu
                    open={contextMenu !== null && contextMenuRequestor === row}
                    onClose={handleContextMenuClose}
                    anchorReference="anchorPosition"
                    anchorPosition={
                      contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                    }
                  >
                    <MenuItem onClick={handleRemovalOfFields}>
                      Remove fields
                    </MenuItem>
                  </Menu>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default IConnectorResponseTable;
