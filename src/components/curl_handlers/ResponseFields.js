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
  deepCopy,
  flattenObject,
  is_mapped_field,
  updateNestedJson,
} from 'utils/search_utils';
import jsonpath from 'jsonpath';
import { useRecoilValue } from 'recoil';
import { APP_CONTEXT } from 'utils/state';

function IResponseFieldsTable({
  suggestions = {},
  updateAppContext = (v) => {},
}) {
  const defaultProps = {
    options: flattenObject(suggestions).map((s) => '$' + s),
    getOptionLabel: (option) => option,
  };

  const appContext = useRecoilValue(APP_CONTEXT);
  const [fields, setFields] = useState([]);
  useEffect(() => {
    const hsResponse =
      appContext.flows[appContext.selectedFlow].hsResponseFields.value;
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
              let field = {};
              try {
                field =
                  jsonpath.query(
                    appContext.flows[appContext.selectedFlow].hsResponseFields
                      .mapping,
                    '$.' + row.replaceAll('.', '.value.').replaceAll('-', '')
                  )[0] || {};
              } catch (error) {
                console.error('jsonpath query failed', error);
                return;
              }
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
                        key={`${row}-type-${appContext.selectedFlow}`}
                        sx={{ width: 300 }}
                        onChange={(event, newValue) => {
                          let updatedMapping = {
                            ...appContext.flows[appContext.selectedFlow]
                              .hsResponseFields.mapping,
                          };
                          let updatedResponse = {
                            ...appContext.flows[appContext.selectedFlow]
                              .hsResponseFields.value,
                          };
                          updatedResponse = updateNestedJson(
                            updatedResponse,
                            row.split('.'),
                            newValue
                          );
                          const keys = row
                            .split('.')
                            .flatMap((f) => [f, 'value']);
                          keys.pop();
                          updatedMapping = updateNestedJson(
                            updatedMapping,
                            keys,
                            { ...field, value: newValue }
                          );
                          const updatedFlows = deepCopy(appContext.flows);
                          updatedFlows[
                            appContext.selectedFlow
                          ].hsResponseFields.value = updatedResponse;
                          updatedFlows[
                            appContext.selectedFlow
                          ].hsResponseFields.mapping = updatedMapping;
                          if (newValue === '$status') {
                            updatedFlows[
                              appContext.selectedFlow
                            ].statusVariable = row;
                          }
                          updateAppContext({ flows: updatedFlows });
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
