import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Autocomplete, TextField, Tooltip } from '@mui/material';
import "jsoneditor/dist/jsoneditor.css";
import { addFieldsToNodes, flattenObject, is_mapped_field, mapFieldNames, typesList } from 'utils/search_utils';
import jsonpath from 'jsonpath';

function IRequestFieldsTable({ requestFields, suggestions = {}, setRequestFields = (value) => { } }) {

  const defaultProps = {
    options: Object.keys(suggestions).map((s) => "$" + s),
    getOptionLabel: (option) => option,
  };

  const [mapping, setMapping] = useState({});
  const [fields, setFields] = useState([]);
  useEffect(() => {
    setMapping(addFieldsToNodes(mapFieldNames(requestFields)));
    setFields(flattenObject(requestFields));
  }, [requestFields]);
  function updateRequestFields() {
    let updated = { ...mapping };
    setMapping(updated)
    setRequestFields(updated);
  };
  return (
    <div className='editor'>
      <TableContainer component={Paper} sx={{ maxHeight: '500px', overflow: 'scroll' }}>
        <Table aria-label="simple table" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell><b>Field Name</b></TableCell>
              <TableCell><b>Optional</b></TableCell>
              <TableCell><b>Secret</b></TableCell>
              <TableCell><b>Type</b></TableCell>
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
                    updateRequestFields();
                  }} />
                </TableCell>
                <TableCell>
                  <Checkbox checked={field.secret} onChange={() => {
                    field.secret = !field.secret;
                    updateRequestFields();
                  }} />
                </TableCell>
                <TableCell>
                  <Autocomplete
                    defaultValue={field.type}
                    options={typesList}
                    id={row + "type"}
                    sx={{ width: 120 }}
                    freeSolo={false}
                    onChange={(event, newValue) => {
                      field.type = newValue;
                      updateRequestFields();
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="" variant="standard" />
                    )}></Autocomplete>
                </TableCell>
                <TableCell>
                  <Tooltip title={is_mapped_field(field) ? "Mapped" : "Unmapped"} placement="right">
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
                        <TextField {...params} sx={{ input: { color: is_mapped_field(field) ? '#42A5F5' : "#000" } }} label="" variant="standard" />
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
