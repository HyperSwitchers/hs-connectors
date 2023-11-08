// @ts-check

import { atom, selector } from 'recoil';

/// States required for code generation journey
// - Selected flow
// - cURL Request
// - AuthType mapping
// - Request fields + mapping
// - Request headers + mapping
// - Response fields + mapping
// - Status mapping

export const APP_CONTEXT = atom({
  key: 'context',
  default: {
    connectorName: 'DemoCon',
    selectedFlow: 'AuthType',
    authType: {
      value: null,
      mapping: null,
    },
    flows: {
      AuthType: {
        curlCommand: null,
        curlRequest: null,
        requestFields: {
          value: null,
          mapping: null,
        },
        requestHeaderFields: {
          value: null,
          mapping: null,
        },
        responseFields: {
          value: null,
          mapping: null,
        },
        hsResponseFields: {
          value: {
            status: '',
            response: {
              resource_id: '',
              redirection_data: 'None',
              connector_response_reference_id: '',
            },
          },
          mapping: null,
        },
        status: {
          value: null,
          mapping: null,
        },
      },
      Authorize: {
        curlCommand: `curl --location --request POST 'https://api.sandbox.checkout.com/payments'     --header 'Authorization: Bearer sk_sbox_3w2n46fb6m4tlp3c6ukvixwoget'     --header 'Content-Type: application/json'     --data-raw '{
          "source": {
            "type": "card",
            "number": "4242424242424242",
            "expiry_month": 1,
            "expiry_year": 30,
            "name": "John Smith",
            "cvv": "100"
          },
          "processing_channel_id": "pc_gcjstkyrr4eudnjkqlro3kymcu",
          "amount": 1040,
          "currency": "GBP",
          "reference": "123lala",
          "capture": false
        }'`,
        curlRequest: {
          url: '',
          method: '',
          headers: [],
          data: {},
        },
        authType: {
          value: null,
          mapping: null,
        },
        requestFields: {
          value: null,
          mapping: null,
        },
        requestHeaderFields: {
          value: null,
          mapping: null,
        },
        responseFields: {
          value: null,
          mapping: null,
        },
        hsResponseFields: {
          value: {
            status: '',
            response: {
              resource_id: '',
              redirection_data: 'None',
              connector_response_reference_id: '',
            },
          },
          mapping: null,
        },
        status: {
          value: null,
          mapping: null,
        },
      },
      Capture: {
        curlCommand: null,
        curlRequest: null,
        authType: {
          value: null,
          mapping: null,
        },
        requestFields: {
          value: null,
          mapping: null,
        },
        requestHeaderFields: {
          value: null,
          mapping: null,
        },
        responseFields: {
          value: null,
          mapping: null,
        },
        hsResponseFields: {
          value: {
            status: '',
            response: {
              resource_id: '',
              redirection_data: 'None',
              connector_response_reference_id: '',
            },
          },
          mapping: null,
        },
        status: {
          value: null,
          mapping: null,
        },
      },
      Void: {
        curlCommand: null,
        curlRequest: null,
        authType: {
          value: null,
          mapping: null,
        },
        requestFields: {
          value: null,
          mapping: null,
        },
        requestHeaderFields: {
          value: null,
          mapping: null,
        },
        responseFields: {
          value: null,
          mapping: null,
        },
        hsResponseFields: {
          value: {
            status: '',
            response: {
              resource_id: '',
              redirection_data: 'None',
              connector_response_reference_id: '',
            },
          },
          mapping: null,
        },
        status: {
          value: null,
          mapping: null,
        },
      },
      Refund: {
        curlCommand: null,
        curlRequest: null,
        authType: {
          value: null,
          mapping: null,
        },
        requestFields: {
          value: null,
          mapping: null,
        },
        requestHeaderFields: {
          value: null,
          mapping: null,
        },
        responseFields: {
          value: null,
          mapping: null,
        },
        hsResponseFields: {
          value: {
            status: '',
            response: {
              resource_id: '',
              redirection_data: 'None',
              connector_response_reference_id: '',
            },
          },
          mapping: null,
        },
        status: {
          value: null,
          mapping: null,
        },
      },
      PSync: {
        curlCommand: null,
        curlRequest: null,
        authType: {
          value: null,
          mapping: null,
        },
        requestFields: {
          value: null,
          mapping: null,
        },
        requestHeaderFields: {
          value: null,
          mapping: null,
        },
        responseFields: {
          value: null,
          mapping: null,
        },
        hsResponseFields: {
          value: {
            status: '',
            response: {
              resource_id: '',
              redirection_data: 'None',
              connector_response_reference_id: '',
            },
          },
          mapping: null,
        },
        status: {
          value: null,
          mapping: null,
        },
      },
      RSync: {
        curlCommand: null,
        curlRequest: null,
        authType: {
          value: null,
          mapping: null,
        },
        requestFields: {
          value: null,
          mapping: null,
        },
        requestHeaderFields: {
          value: null,
          mapping: null,
        },
        responseFields: {
          value: null,
          mapping: null,
        },
        hsResponseFields: {
          value: {
            status: '',
            response: {
              resource_id: '',
              redirection_data: 'None',
              connector_response_reference_id: '',
            },
          },
          mapping: null,
        },
        status: {
          value: null,
          mapping: null,
        },
      },
    },
  },
});

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
