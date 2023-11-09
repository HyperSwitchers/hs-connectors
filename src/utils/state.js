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
    connectorName: '',
    selectedFlow: 'AuthType',
    authType: {
      value: null,
      mapping: null,
    },
    flows: {
      AuthType: {
        curlCommand: '',
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
        curlCommand: ``,
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
        curlCommand: '',
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
        curlCommand: '',
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
        curlCommand: '',
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
        curlCommand: '',
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
        curlCommand: '',
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
