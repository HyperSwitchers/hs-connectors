import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Autocomplete, TextField, Tooltip } from '@mui/material';
import "jsoneditor/dist/jsoneditor.css";
import { addFieldsToNodes, flattenObject, mapFieldNames } from 'utils/search_utils';
import jsonpath from 'jsonpath';

function IRequestFieldsTable({requestFields,  suggestions = {}}) {

  const defaultProps = {
    options: Object.keys(suggestions).map((s) => "$" + s),
    getOptionLabel: (option) => option,
  };
  
  const [mapping, setMapping] = useState({});
  const [fields, setFields ] = useState([]);
  useEffect(() => {
    setMapping(addFieldsToNodes(mapFieldNames(requestFields)));
    setFields(flattenObject(requestFields));
  }, [requestFields]);
  console.log(requestFields);
  return (
    <div className='editor'>
      <TableContainer component={Paper} sx={{maxHeight: '500px', overflow:'scroll'}}>
        <Table aria-label="simple table" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell><b>Field Name</b></TableCell>
              <TableCell><b>Optional</b></TableCell>
              <TableCell><b>Secret</b></TableCell>
              <TableCell><b>Hyperswitch Field</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields?.map((row) => {
              const field = jsonpath.query(
                mapping,
                "$." + row.replaceAll(".", ".value.").replaceAll("-", "")
              )[0] || {};
              return (<TableRow key={row}>
                <TableCell>
                  {row}
                </TableCell>
                <TableCell>
                  <Checkbox checked={field.optional} onChange={() => {
                    field.optional = !field.optional;
                    setMapping({ ...mapping });
                  }} />
                </TableCell>
                <TableCell>
                  <Checkbox checked={field.secret} onChange={() => {
                    field.secret = !field.secret;
                    setMapping({ ...mapping });
                  }} />
                </TableCell>
                <TableCell>
                <Tooltip title={field?.value?.includes("$")? "Mapped" : "Unmapped"}  placement="right">
                  
                    <Autocomplete
                      defaultValue={field.value}
                      {...defaultProps}
                      id={row}
                      sx={{ width: 300 }}
                      onChange={(event, newValue) => {
                        field.value = newValue;
                        setMapping({ ...mapping });
                      }}
                      renderInput={(params) => (
                          <TextField {...params} sx={{ input: { color: field?.value?.includes("$") ? '#42A5F5' : "#000" } }} label="" variant="standard" />
                      )}
                    />
                  </Tooltip>
                </TableCell>
              </TableRow>);
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>

  );
};

export default IRequestFieldsTable;