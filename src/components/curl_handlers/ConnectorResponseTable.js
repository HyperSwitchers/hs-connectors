import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Autocomplete, TextField, Tooltip } from '@mui/material';
import "jsoneditor/dist/jsoneditor.css";
import { addFieldsToNodes, flattenObject, is_mapped_field, mapFieldNames, typesList } from 'utils/search_utils';
import jsonpath from 'jsonpath';

function IConnectorResponseTable({connectorResponse,  suggestions = {}, setConnectorResponse = (value) => {}}) {

  const defaultProps = {
    options: Object.keys(suggestions).map((s) => "$" + s),
    getOptionLabel: (option) => option,
  };
  
  const [mapping, setMapping] = useState({});
  const [fields, setFields ] = useState([]);
  useEffect(() => {
    setMapping(addFieldsToNodes(connectorResponse));
    setFields(flattenObject(connectorResponse));
  }, [connectorResponse]);
  function updateConnectorResponse() {
    let updated = { ...mapping };
    setMapping(updated)
    setConnectorResponse(updated);
  };
  return (
    <div className='editor'>
      <TableContainer component={Paper} sx={{maxHeight: '500px', overflow:'scroll'}}>
        <Table aria-label="simple table" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell><b>Field Name</b></TableCell>
              <TableCell><b>Value</b></TableCell>
              <TableCell><b>Type</b></TableCell>
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
                <TableCell sx={{maxWidth: '100px', wordBreak:'break-word'}}>
                  {field.value}
                </TableCell>
                <TableCell>
                <Autocomplete
                      defaultValue={field.type}
                      options={typesList}
                      id={row+"type"}
                      sx={{ width: 120 }}
                      freeSolo={false}
                      onChange={(event, newValue) => {
                        field.type = newValue;
                        updateConnectorResponse();
                      }}
                      renderInput={(params) => (
                          <TextField {...params} label="" variant="standard" />
                      )}></Autocomplete>
                </TableCell>
              </TableRow>);
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>

  );
};

export default IConnectorResponseTable;
