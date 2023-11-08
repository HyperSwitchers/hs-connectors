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
  deepCopy,
  flattenObject,
  is_mapped_field,
  mapFieldNames,
  updateNestedJson,
} from 'utils/search_utils';
import jsonpath from 'jsonpath';
import { useRecoilValue } from 'recoil';
import { APP_CONTEXT } from 'utils/state';

function IResponseFieldsTable({
  suggestions = {},
  setSelectedStatusVariable = (v) => {},
  updateAppContext = (v) => {},
}) {
  const defaultProps = {
    options: flattenObject(suggestions).map((s) => '$' + s),
    getOptionLabel: (option) => option,
  };

  const appContext = useRecoilValue(APP_CONTEXT);

  const [mapping, setMapping] = useState({});
  const [fields, setFields] = useState([]);
  useEffect(() => {
    const hsResponse =
      appContext.flows[appContext.selectedFlow].hsResponseFields.value;
    setMapping(addFieldsToNodes(mapFieldNames(hsResponse)));
    setFields(flattenObject(hsResponse));
  }, [appContext.flows[appContext.selectedFlow].hsResponseFields.value]);
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
                          let updatedResponse = {
                            ...appContext.flows[appContext.selectedFlow]
                              .hsResponseFields.value,
                          };
                          const keys = row.split('.');
                          updatedResponse = updateNestedJson(
                            updatedResponse,
                            keys,
                            newValue
                          );
                          setMapping(updated);
                          const updatedFlows = deepCopy(appContext.flows);
                          updatedFlows[
                            appContext.selectedFlow
                          ].hsResponseFields.value = updatedResponse;
                          updatedFlows[
                            appContext.selectedFlow
                          ].hsResponseFields.mapping = updated;
                          updateAppContext({ flows: updatedFlows });
                          if (newValue === '$status') {
                            setSelectedStatusVariable(row);
                          }
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
