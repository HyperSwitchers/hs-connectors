// @ts-check

import _ from 'lodash';

export const synonymMapping = {
  amount: ['amount', 'authorization_amount'],
  billing_address_firstname: [
    'name',
    'first_name',
    'firstname',
    'firstName',
    'username',
  ],
  billing_address_lastname: ['last_name', 'lastname', 'lastName'],
  billing_address_line1: ['line1', 'address_line_1'],
  billing_address_line2: ['line2'],
  billing_address_line3: ['line3'],
  billing_address_city: ['city'],
  billing_address_state: ['state'],
  billing_address_zip: ['zip', 'pin_code', 'pin', 'postal_code'],
  browser_accept_header: ['accept_header', 'acceptHeader'],
  browser_java_enabled: ['java_enabled', 'javaEnabled'],
  browser_language: ['language'],
  browser_color_depth: ['color_depth', 'colorDepth'],
  browser_screen_height: ['screen_height', 'screenHeight'],
  browser_screen_width: ['screen_width', 'screenWidth'],
  browser_time_zone: ['time_zone', 'timeZone'],
  browser_user_agent: ['user_agent', 'userAgent'],
  browser_javascript_enabled: [
    'javascript_enabled',
    'java_script_enabled',
    'javaScriptEnabled',
  ],
  browser_ip_address: ['ip_address', 'ipAddress', 'ip'],
  card_expiry_year_month: ['expiry'],
  card_exp_month: [
    'expiry_month',
    'expMonth',
    'expiryMonth',
    'expirationMonth',
    'expire_month',
  ],
  card_exp_year: [
    'expiry_year',
    'expYear',
    'expiryYear',
    'expirationYear',
    'expire_year',
  ],
  card_number: ['number', 'cardNumber', 'account_number'],
  card_cvc: [
    'cvc',
    'cvd',
    'cvv',
    'CVV',
    'security_code',
    'securityCode',
    'card_verification_value',
  ],
  card_holder_name: [
    'cardholderName',
    'holderName',
    'name_on_card',
    'cardHolderName',
  ],
  capture: ['auto_capture', 'capture', 'submit_for_settlement'],
  billing_country: ['country', 'country_code'],
  shipping_country: ['country', 'country_code'],
  currency: ['currency', 'currency_code'],
  description: ['description', 'softDescriptor'],
  email: ['email'],
  payment_id: ['reference', 'reference_id', 'payment_id', 'order_id'],
  phone_number: ['phone', 'contact_number', 'phone_number'],
  setup_future_usage: ['storePaymentMethod'],
  return_url: ['returnUrl', ''],
  is_auto_capture: [
    'auto_capture',
    'captured',
    'submit_for_settlement',
    'intent',
  ],
};

export const responseTypes = {
  status: ['status', 'payment_status'],
  response_id: ['id', 'payment_id', 'order_id'],
};

export const typesMapping = {
  i64: [],
  f64: [],
  base_String: [],
  f64_String: [],
  CardNumber: [],
  Currency: [],
  Email: [],
  enum: [],
};

export const authTypesMapping = {
  api_key: [],
  key1: [],
  secret_key: [],
  key2: [],
  base_64_encode_api_key_colon_key1: [],
  base_64_encode_key1_colon_api_key: [],
};

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
          const synonymKey = _.map(synonymMapping, (value, kk) =>
            _.find(value, (synonym) => synonym === key) ? kk : undefined
          ).filter((a) => a);
          return synonymKey[0] ? '$' + synonymKey[0] : mapFieldNames(value);
        }
      });
      return res;
    }
  }
  return input;
}

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

export const typesList = [
  'String',
  'i32',
  'i64',
  'f32',
  'f64',
  'bool',
  'array',
  'enum',
];

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
        secret: false, // Set this to true or false based on your requirement
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
