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
import { flattenObject, is_mapped_field, updateNestedJson } from 'utils/common';
import jsonpath from 'jsonpath';
import { useRecoilState } from 'recoil';
import { APP_CONTEXT } from 'utils/state';

function IResponseFieldsTable({ suggestions = {} }) {
  const defaultProps = {
    options: flattenObject(suggestions).map((s) => '$' + s),
    getOptionLabel: (option) => option,
  };

  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
  const [fields, setFields] = useState([]);

  /**
   * Usecase - update the fields in connector response
   * Trigger - whenever appContext is updated
   */
  useEffect(() => {
    const hsResponse = appContext.hsResponseFields.value;
    setFields(flattenObject(hsResponse));
  }, [appContext.selectedFlow, appContext.hsResponseFields]);

  return (
    <div className="editor">
      <TableContainer component={Paper} sx={{ overflow: 'scroll' }}>
        <Table aria-label="simple table" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Hyperswitch Field Name</b>
              </TableCell>
              <TableCell>
                <b>Connector Field Name</b>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields?.map((row) => {
              if (!appContext?.hsResponseFields.mapping) {
                return null;
              }
              let field = {};
              try {
                field =
                  jsonpath.query(
                    appContext.hsResponseFields.mapping,
                    '$.' + row.replaceAll('.', '.value.').replaceAll('-', '')
                  )[0] || {};
              } catch (error) {
                console.error('jsonpath query failed', error);
                return null;
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
                            ...appContext.hsResponseFields.mapping,
                          };
                          let updatedResponse = {
                            ...appContext.hsResponseFields.value,
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
                          const updates = {
                            hsResponseFields: {
                              value: updatedResponse,
                              mapping: updatedMapping,
                            },
                          };
                          if (row === 'status') {
                            updates.statusVariable = newValue.replace('$', '');
                          }
                          setAppContext({
                            ...appContext,
                            ...updates,
                          });
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
