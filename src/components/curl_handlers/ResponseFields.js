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
import {
  addFieldsToNodes,
  flattenObject,
  is_mapped_field,
  mapFieldNames,
  updateNestedJson,
} from 'utils/search_utils';
import jsonpath from 'jsonpath';

function IResponseFieldsTable({
  hsResponse,
  suggestions = {},
  setHsMapping = (value) => {},
  setHsResponse = (value) => {},
}) {
  const defaultProps = {
    options: flattenObject(suggestions).map((s) => '$' + s),
    getOptionLabel: (option) => option,
  };

  const [mapping, setMapping] = useState({});
  const [fields, setFields] = useState([]);
  useEffect(() => {
    setMapping(addFieldsToNodes(mapFieldNames(hsResponse)));
    setFields(flattenObject(hsResponse));
  }, [hsResponse]);
  return (
    <div className="editor">
      <TableContainer component={Paper} sx={{ overflow: 'scroll' }}>
        <Table aria-label="simple table" stickyHeader>
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
              const field =
                jsonpath.query(
                  mapping,
                  '$.' + row.replaceAll('.', '.value.').replaceAll('-', '')
                )[0] || {};
              return (
                <TableRow key={row}>
                  <TableCell>{row}</TableCell>
                  <TableCell>
                    <Tooltip
                      title={is_mapped_field(field) ? 'Mapped' : 'Unmapped'}
                      placement="right"
                    >
                      <Autocomplete
                        defaultValue={field.value}
                        {...defaultProps}
                        id={row}
                        sx={{ width: 300 }}
                        onChange={(event, newValue) => {
                          field.value = newValue;
                          let updated = { ...mapping };
                          let updatedResponse = { ...hsResponse };
                          const keys = row.split('.');
                          updatedResponse = updateNestedJson(
                            updatedResponse,
                            keys,
                            newValue
                          );
                          debugger;
                          setHsResponse(updatedResponse);
                          setMapping(updated);
                          setHsMapping(updated);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            sx={{
                              input: {
                                color: is_mapped_field(field)
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
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default IResponseFieldsTable;
