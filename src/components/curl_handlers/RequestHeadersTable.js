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
import { deepCopy, flattenObject, mapFieldNames } from 'utils/search_utils';
import jsonpath from 'jsonpath';
import { useRecoilValue } from 'recoil';
import { APP_CONTEXT } from 'utils/state';

function IRequestHeadersTable({
  suggestions = {},
  updateAppContext = (v) => {},
}) {
  const appContext = useRecoilValue(APP_CONTEXT);
  const defaultProps = {
    options: Object.keys(suggestions).map((s) => '$' + s),
    getOptionLabel: (option) => option,
  };
  const [fields, setFields] = useState([]);
  useEffect(() => {
    const requestHeaders =
      appContext.flows[appContext.selectedFlow]?.requestHeaderFields?.value ||
      {};
    setFields(flattenObject(requestHeaders));
  }, [appContext]);
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
                <b>Field Name</b>
              </TableCell>
              <TableCell>
                <b>Hyperswitch Field</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields?.map((row) => {
              let field =
                appContext.flows[appContext.selectedFlow]?.requestHeaderFields
                  ?.mapping[row] || {};
              try {
                field = jsonpath.query(
                  appContext.flows[appContext.selectedFlow]?.requestHeaderFields
                    ?.mapping,
                  `$.` + row
                )[0];
              } catch (e) {}
              return field?.value ? (
                <TableRow key={row}>
                  <TableCell>{row}</TableCell>
                  <TableCell>
                    <Tooltip title={''} placement="right">
                      <Autocomplete
                        freeSolo
                        defaultValue={field?.value}
                        {...defaultProps}
                        key={appContext.selectedFlow + row + 'field'}
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
                          updateAppContext({ flows: updatedFlows });
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
              ) : (
                <></>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default IRequestHeadersTable;
