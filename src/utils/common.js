// @ts-check

import _ from 'lodash';
import { DEFAULT_SECRETS_IN_SYNONYMS, SYNONYM_MAPPING } from './constants';

export function generateAuthTypeEncryption(keys) {
  let obj = {};
  for (let i = 0; i < keys.length; i++) {
    for (let j = 0; j < keys.length; j++) {
      if (i !== j) {
        obj[`base_64_encode_${keys[i]}_colon_${keys[j]}`] = [];
      }
    }
  }
  return obj;
}

export function isLeafNode(obj) {
  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  const keys = Object.keys(obj);
  return (
    keys.includes('value') &&
    keys.includes('optional') &&
    keys.includes('secret') &&
    keys.includes('type')
  );
}

export function mapFieldNodes(input) {
  if (_.isObject(input)) {
    if (_.isArray(input)) {
      let res = _.map(input, (item) => mapFieldNodes(item));
      return res;
    } else {
      let res = _.mapValues(input, (value, key) => {
        if (_.isObject(value)) {
          if (isLeafNode(value)) {
            const value_ = value.value;
            const synonymKey = Object.keys(SYNONYM_MAPPING).flatMap((flow) => {
              return _.map(SYNONYM_MAPPING[flow], (value, kk) =>
                _.find(value, (synonym) => synonym === key) ? kk : undefined
              ).filter((a) => a);
            });
            if (synonymKey[0]) {
              const val = '$' + synonymKey[0];
              return {
                ...value,
                secret: DEFAULT_SECRETS_IN_SYNONYMS.includes(val),
                value: val,
              };
            } else {
              return {
                ...value,
                value: mapFieldNodes(value_),
              };
            }
          }
          return mapFieldNodes(value);
        } else {
          const synonymKey = Object.keys(SYNONYM_MAPPING).flatMap((flow) => {
            return _.map(SYNONYM_MAPPING[flow], (value, kk) =>
              _.find(value, (synonym) => synonym === key) ? kk : undefined
            ).filter((a) => a);
          });
          if (synonymKey[0]) {
            const val = '$' + synonymKey[0];
            return {
              ...value,
              secret: DEFAULT_SECRETS_IN_SYNONYMS.includes(val),
              value: val,
            };
          } else {
            return {
              ...value,
              value: mapFieldNodes(value),
            };
          }
        }
      });
      return res;
    }
  }
  return input;
}

export function mapFieldNames(input) {
  if (_.isObject(input)) {
    if (_.isArray(input)) {
      let res = _.map(input, (item) => mapFieldNames(item));
      return res;
    } else {
      let res = _.mapValues(input, (value, key) => {
        if (_.isObject(value)) {
          return mapFieldNames(value);
        } else {
          const synonymKey = Object.keys(SYNONYM_MAPPING).flatMap((flow) => {
            return _.map(SYNONYM_MAPPING[flow], (value, kk) =>
              _.find(value, (synonym) => synonym === key) ? kk : undefined
            ).filter((a) => a);
          });
          return synonymKey[0] ? '$' + synonymKey[0] : mapFieldNames(value);
        }
      });
      return res;
    }
  }
  return input;
}

export const updateNestedJson = (json, keys, updatedValue) => {
  let updatedObj = { ...json };
  let updatedKeys = [...keys];
  if (updatedKeys.length === 1) {
    if (updatedValue === null || updatedValue === undefined) {
      delete updatedObj[updatedKeys[0]];
    } else {
      updatedObj[updatedKeys[0]] = updatedValue;
    }
  } else {
    const key = updatedKeys.shift();
    updatedObj[key] = updateNestedJson(json[key], updatedKeys, updatedValue);
  }

  return updatedObj;
};

export const deepJsonSwap = (json) => {
  if (typeof json === 'object') {
    let modifiedJson = { ...json };
    Object.keys(modifiedJson).map((m) => {
      const shouldSwap = modifiedJson[m]?.type === 'enum';
      const value = modifiedJson[m]?.value;
      if (shouldSwap && value) {
        modifiedJson[m].type = value;
        modifiedJson[m].value = m.startsWith('$') ? m : '$' + m;
      }
      modifiedJson[m] = deepJsonSwap(modifiedJson[m]);
    });
  }

  return json;
};

export function flattenObject(obj, parent = '', res = []) {
  for (let key in obj) {
    let propName = parent ? parent + '.' + key : key;
    if (typeof obj[key] == 'object') {
      flattenObject(obj[key], propName, res);
    } else {
      res.push(propName);
    }
  }
  return res;
}

export const deepCopy = (object) => {
  if (typeof object === 'object') {
    return JSON.parse(JSON.stringify(object));
  } else {
    return object;
  }
};

export function addFieldsToNodes(jsonObj) {
  // Helper function to check if a value is an object (excluding arrays)
  function isObject(val) {
    return typeof val === 'object' && !Array.isArray(val);
  }

  // Recursive function to traverse the JSON object
  function traverse(obj) {
    for (const key in obj) {
      if (isObject(obj[key])) {
        traverse(obj[key]); // Recursively traverse nested objects
      }

      // Add fields to leaf nodes
      obj[key] = {
        value: obj[key],
        optional: false, // Set this to true or false based on your requirement
        secret: DEFAULT_SECRETS_IN_SYNONYMS.includes(obj[key]), // Set this to true or false based on your requirement
        type: getRustType(obj[key]),
      };
    }
  }

  // Make a deep copy of the JSON object to avoid modifying the original object
  const newObj = JSON.parse(JSON.stringify(jsonObj));

  // Start traversing the object
  traverse(newObj);

  return newObj;
}

export function is_mapped_field(field) {
  return typeof field?.value === 'string' && field?.value?.includes('$');
}

function getRustType(value) {
  const type = typeof value;
  switch (type) {
    case 'string':
      return 'String';
    case 'number':
      return 'i64';
    case 'boolean':
      return 'bool';
    case 'object':
      if (Array.isArray(value)) {
        return 'Vec<T>';
      } else {
        return 'HashMap<String, T>';
      }
    default:
      return 'Unknown';
  }
}
export function download(content, filename, contentType) {
  if (!contentType) contentType = 'application/octet-stream';
  var a = document.createElement('a');
  var blob = new Blob([content], { type: contentType });
  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export const getHeaders = (headers) => {
  return headers.reduce((acc, item) => {
    const [key, value] = item.split(':').map((item) => item.trim());
    acc[key] = value;
    return acc;
  }, {});
};

export const convertToValidVariableName = (str) => {
  return str.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
};

export const storeItem = (key, value) => {
  localStorage[key] = value;
};

export const fetchItem = (key) => {
  let value = localStorage[key];
  try {
    value = JSON.parse(value);
  } catch (err) {
    console.error(`Failed to parse ${key} from localStorage`);
  }
  return value;
};

export const updateAppContextInLocalStorage = (appContext) => {
  try {
    const jsonStr = JSON.stringify(appContext);
    storeItem('app_context', jsonStr);
    console.info('Stored app_context in localStorage', jsonStr);
  } catch (error) {
    console.info('Failed to persist appContext in localStorage', error);
  }
};

export const toCamelCase = (str) =>
  str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) => {
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    })
    .replace(/\s+/g, '');

export const findCommonHeaders = (data) => {
  let maxHeaders = [];
  let maxHeadersCount = 0;

  for (const key in data) {
    if (data[key].headers && data[key].headers.length > maxHeadersCount) {
      maxHeaders = data[key].headers;
      maxHeadersCount = data[key].headers.length;
    }
  }
  return maxHeaders;
};

export const buildAuthHeaders = (data) => {
  for (const key in data) {
    let headers = data[key]?.curl?.headers || {};
    for (const header in headers) {
      let auth_value = buildAuthHeaderKey(headers[header].value);
      if (auth_value) {
        let contents = headers[header].value.split('$');
        auth_value =
          contents.length > 1 && contents[0]
            ? `format!("` + contents[0] + `{}", ` + auth_value + `)`
            : auth_value;
        return {
          header_auth_key: getAuthHeaderKey(header),
          header_auth_value: auth_value + '.into_masked()',
        };
      }
    }
  }
  return {};
};

export const buildAuthHeaderKey = (data) => {
  if (data.includes('$base_64_encode')) {
    let fields = data.split('_colon_');
    return (
      'consts::BASE64_ENGINE.encode(format!("{}:{}", auth.' +
      fields[0].substr('$base_64_encode_'.length) +
      '.peek(), auth.' +
      fields[1] +
      '.peek()))'
    );
  } else {
    return 'auth.' + data.substr(1) + '.expose()';
  }
};

export const getAuthHeaderKey = (data) => {
  if (data === 'Authorization') return 'headers::AUTHORIZATION.to_string()';
  if (data === 'X-API-KEY') return 'headers::X_API_KEY.to_string()';
  if (data === 'API-KEY') return 'headers::API_KEY.to_string()';
  if (data === 'apikey') return 'headers::APIKEY.to_string()';
  if (data === 'X-CC-Api-Key') return 'headers::X_CC_API_KEY.to_string()';
  if (data === 'X-Trans-Key') return 'headers::X_TRANS_KEY.to_string()';
  return data;
};
