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
