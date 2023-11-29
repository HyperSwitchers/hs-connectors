import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  TextField,
  Tooltip,
} from '@mui/material';
import 'jsoneditor/dist/jsoneditor.css';
import { deepCopy, flattenObject } from 'utils/common';
import jsonpath from 'jsonpath';
import { useRecoilState } from 'recoil';
import { APP_CONTEXT } from 'utils/state';

function IRequestHeadersTable({ suggestions = {} }) {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const defaultProps = {
    options: Object.keys(suggestions).map((s) => '$' + s),
    getOptionLabel: (option) => option,
  };
  const [fields, setFields] = useState([]);

  /**
   * Usecase - update the fields in connector response
   * Trigger - whenever appContext is updated
   */
  useEffect(() => {
    const requestHeaders =
      appContext.flows[appContext.selectedFlow]?.requestHeaderFields?.value ||
      {};
    setFields(flattenObject(requestHeaders));
  }, [appContext.flows]);

  return (
    <div className="editor">
      <TableContainer
        component={Paper}
        sx={{ maxHeight: '500px', overflow: 'scroll' }}
      >
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Connector Field Name</b>
              </TableCell>
              <TableCell>
                <b>Hyperswitch Field Name</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields?.map((row) => {
              if (
                !appContext.flows[appContext.selectedFlow]?.requestHeaderFields
                  .mapping
              ) {
                return;
              }
              let field =
                appContext.flows[appContext.selectedFlow].requestHeaderFields
                  .mapping[row] || {};
              try {
                field = jsonpath.query(
                  appContext.flows[appContext.selectedFlow].requestHeaderFields
                    .mapping,
                  `$.` + row
                )[0];
              } catch (e) {}
              return field?.value ? (
                <TableRow key={row + appContext.selectedFlow}>
                  <TableCell>{row}</TableCell>
                  <TableCell>
                    <Tooltip title={''} placement="right">
                      <Autocomplete
                        freeSolo
                        defaultValue={field?.value}
                        {...defaultProps}
                        key={`${row}-field-${appContext.selectedFlow}`}
                        sx={{ maxWidth: 500 }}
                        onInputChange={(event, newValue) => {
                          let updatedValue = deepCopy(
                            appContext.flows[appContext.selectedFlow]
                              ?.requestHeaderFields?.value
                          );
                          updatedValue[row] = newValue;
                          const updatedFlows = deepCopy(appContext.flows);
                          if (
                            !(
                              typeof newValue === 'string' &&
                              newValue.length > 0
                            )
                          ) {
                            delete updatedValue[row];
                          }
                          updatedFlows[
                            appContext.selectedFlow
                          ].requestHeaderFields.value = updatedValue;
                          setAppContext({ ...appContext, flows: updatedFlows });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            sx={{
                              input: {
                                color: field?.value?.includes('$')
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
              ) : null;
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default IRequestHeadersTable;
