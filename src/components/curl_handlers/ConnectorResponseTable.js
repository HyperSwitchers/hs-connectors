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
  updateNestedJson,
} from 'utils/search_utils';
import jsonpath from 'jsonpath';
import { useRecoilValue } from 'recoil';
import { APP_CONTEXT } from 'utils/state';

function IConnectorResponseTable({ updateAppContext = (v) => {} }) {
  const appContext = useRecoilValue(APP_CONTEXT);
  const [fields, setFields] = useState([]);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [contextMenuRequestor, setContextMenuRequestor] = useState(null);
  const [selectedFields, setSelectedFields] = useState([]);
  const [variantRequestor, setVariantRequestor] = useState(null);

  useEffect(() => {
    const connectorResponse = deepCopy(
      appContext.flows[appContext.selectedFlow].responseFields.value || {}
    );
    setFields(flattenObject(connectorResponse));
  }, [appContext.flows[appContext.selectedFlow].responseFields]);

  function updateConnectorResponse(row, update) {
    let updatedMapping = deepCopy(
      appContext.flows[appContext.selectedFlow].responseFields.mapping
    );
    const fields = row.split('.');
    const keys = fields.flatMap((f) => [f, 'value']);
    keys.pop();
    updatedMapping = updateNestedJson(updatedMapping, keys, update);
    const updatedFlows = deepCopy(appContext.flows);
    updatedFlows[appContext.selectedFlow].responseFields.mapping =
      updatedMapping;
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
      let row = {};
      try {
        row =
          jsonpath.query(
            appContext.flows[appContext.selectedFlow].responseFields.mapping,
            '$.' + field.replaceAll('.', '.value.').replaceAll('-', '')
          )[0] || {};
      } catch (error) {
        console.error('jsonpath query failed', error);
        return;
      }
      if (Array.isArray(row.value)) {
        let updatedMapping = {
          ...appContext.flows[appContext.selectedFlow].responseFields.mapping,
        };
        const newVariants = row.value.concat(
          input?.value
            ?.split(',')
            ?.map((v) => v?.trim())
            .filter((f) => !row.value.includes(f))
        );
        const fields = field.split('.');
        const keys = fields.flatMap((f) => [f, 'value']);
        updatedMapping = updateNestedJson(updatedMapping, keys, newVariants);
        setVariantRequestor(null);
        const updatedFlows = deepCopy(appContext.flows);
        updatedFlows[appContext.selectedFlow].responseFields.mapping =
          updatedMapping;
        updateAppContext({ flows: updatedFlows });
      }
    }
  };

  const handleVariantDeletion = (field, variant) => {
    let updatedMapping = deepCopy(
      appContext.flows[appContext.selectedFlow].responseFields.mapping
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
        updatedFlows[appContext.selectedFlow].responseFields.mapping =
          updatedMapping;
        updateAppContext({ flows: updatedFlows });
      }
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
                let field = {};
                try {
                  field =
                    jsonpath.query(
                      appContext.flows[appContext.selectedFlow].responseFields
                        .mapping,
                      '$.' + row.replaceAll('.', '.value.').replaceAll('-', '')
                    )[0] || {};
                } catch (error) {
                  console.error('jsonpath query failed', error);
                  return;
                }
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
              let field = {};
              try {
                field =
                  jsonpath.query(
                    appContext.flows[appContext.selectedFlow].responseFields
                      .mapping,
                    '$.' + row.replaceAll('.', '.value.').replaceAll('-', '')
                  )[0] || {};
              } catch (error) {
                console.error('jsonpath query failed', error);
                return;
              }
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
                        key={appContext.selectedFlow + row + 'type'}
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
                          updateConnectorResponse(row, updates);
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
