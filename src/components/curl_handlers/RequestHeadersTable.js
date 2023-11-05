import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete, TextField, Tooltip } from '@mui/material';
import "jsoneditor/dist/jsoneditor.css";
import { flattenObject, mapFieldNames } from 'utils/search_utils';
import jsonpath from 'jsonpath';

function IRequestHeadersTable({ requestHeaders, suggestions = {}, setRequestHeaders = (value) => {}}) {
  const defaultProps = {
    options: Object.keys(suggestions).map((s) => "$" + s),
    getOptionLabel: (option) => option,
  };
  const [mapping, setMapping] = useState({});
  const [fields, setFields] = useState([]);
  useEffect(() => {
    setMapping(mapFieldNames(requestHeaders));
    setFields(flattenObject(requestHeaders));
  }, [requestHeaders]);
  console.log(requestHeaders);
  return (
    <div className='editor'>
      <TableContainer component={Paper} sx={{ maxHeight: '500px', overflow: 'scroll' }}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell><b>Field Name</b></TableCell>
              <TableCell><b>Hyperswitch Field</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields?.map((row) => {
              let field = mapping[row];
              try {
                field = jsonpath.query(mapping, `$.`+ row )[0];
              } catch (e) {}
              return field ? (<TableRow key={row}>
                <TableCell>
                  {row}
                </TableCell>
                <TableCell>
                  <Tooltip title={""} placement="right">
                    <Autocomplete
                      freeSolo
                      defaultValue={field}
                      {...defaultProps}
                      id={row}
                      sx={{ maxWidth: 500 }}
                      onInputChange={(event, newValue) => {
                        let updated = { ...mapping, [row]: newValue };
                        setMapping(updated);
                        setRequestHeaders(updated);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} sx={{ input: { color: field?.includes("$") ? '#42A5F5' : "#000" } }} label="" variant="standard" />
                      )}
                    />
                  </Tooltip>
                </TableCell>
              </TableRow>) : <></>;
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>

  );
};

export default IRequestHeadersTable;
