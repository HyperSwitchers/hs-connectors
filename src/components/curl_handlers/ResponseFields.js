import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete, TextField, Tooltip } from '@mui/material';
import "jsoneditor/dist/jsoneditor.css";
import { addFieldsToNodes, flattenObject, is_mapped_field, mapFieldNames } from 'utils/search_utils';
import jsonpath from 'jsonpath';

function IResponseFieldsTable({responseFields,  suggestions = {}, setResponseFields = (value) => {}}) {

  const defaultProps = {
    options: flattenObject(suggestions).map((s) => "$" + s),
    getOptionLabel: (option) => option,
  };
  
  const [mapping, setMapping] = useState({});
  const [fields, setFields ] = useState([]);
  useEffect(() => {
    setMapping(addFieldsToNodes(mapFieldNames(responseFields)));
    setFields(flattenObject(responseFields));
  }, [responseFields]);
  return (
    <div className='editor'>
      <TableContainer component={Paper} sx={{maxHeight: '500px', overflow:'scroll'}}>
        <Table aria-label="simple table" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell><b>Field Name</b></TableCell>
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
                <Tooltip title={is_mapped_field(field) ? "Mapped" : "Unmapped"}  placement="right">
                  
                    <Autocomplete
                      defaultValue={field.value}
                      {...defaultProps}
                      id={row}
                      sx={{ width: 300 }}
                      onChange={(event, newValue) => {
                        field.value = newValue;
                        let updated = { ...mapping };
                        setMapping(updated);
                        setResponseFields(updated);
                      }}
                      renderInput={(params) => (
                          <TextField {...params} sx={{ input: { color: is_mapped_field(field)  ? '#42A5F5' : "#000" } }} label="" variant="standard" />
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

export default IResponseFieldsTable;
