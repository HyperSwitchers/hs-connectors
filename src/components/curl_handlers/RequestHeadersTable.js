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
  const [mapping, setMapping] = useState({});
  const [fields, setFields] = useState([]);
  useEffect(() => {
    const requestHeaders =
      appContext.flows[appContext.selectedFlow]?.requestHeaderFields?.value;
    const f = flattenObject(requestHeaders);
    const m = mapFieldNames(requestHeaders);
    console.log(requestHeaders, m, f);
    setMapping(m);
    setFields(f);
    // console.log(requestHeaders?.mapping, f, requestHeaders);
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
              let field = mapping[row];
              try {
                field = jsonpath.query(mapping, `$.` + row)[0];
              } catch (e) {}
              return field ? (
                <TableRow key={row}>
                  <TableCell>{row}</TableCell>
                  <TableCell>
                    <Tooltip title={''} placement="right">
                      <Autocomplete
                        freeSolo
                        defaultValue={field}
                        {...defaultProps}
                        id={row}
                        sx={{ maxWidth: 500 }}
                        onInputChange={(event, newValue) => {
                          let updated = { ...mapping, [row]: newValue };
                          setMapping(updated);
                          const updatedFlows = deepCopy(appContext.flows);
                          if (
                            !(
                              typeof newValue === 'string' &&
                              newValue.length > 0
                            )
                          ) {
                            delete updated[row];
                          }
                          updatedFlows[
                            appContext.selectedFlow
                          ].requestHeaderFields.value = updated;
                          updateAppContext({ flows: updatedFlows });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            sx={{
                              input: {
                                color: field?.includes('$')
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
