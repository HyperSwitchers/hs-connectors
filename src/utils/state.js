// @ts-check

import { defaultConnectorProps } from 'components/composed/content/ConnectorTemplates';
import { atom } from 'recoil';

/// States required for code generation journey
// - Connector name
// - Loading status
// - Selected flow
// - Selected payment method option
// - cURL Request
// - AuthType mapping
// - Request fields + mapping
// - Request headers + mapping
// - Response fields + mapping
// - Status mapping

export const APP_CONTEXT = atom({
  key: 'context',
  default: {
    baseUrl: '',
    connectorPascalCase: 'DemoCon',
    connectorName: 'DemoCon',
    currencyUnit: 'Minor',
    currencyUnitType: 'i64',
    generatorInput: {},
    wasCodeUpdatedBeforeDownload: false,
    loading: false,
    selectedFlow: 'AuthType',
    selectedPaymentMethodOption: '',
    codeInvalidated: false,
    props: defaultConnectorProps('DemoCon'),
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
        description: `<div><p><b>Authorizing Payment with Hyperswitch</b></p>

        <p>Understanding how to authorize a payment to the processor through Hyperswitch is essential for smooth and secure transactions. In the case of card payments, you'll need to identify the specific object that the processor accepts for authorization, such as the "Charge" object. This "Charge" object represents a payment made with a credit or debit card.</p>
        
        <p><b>Here's a simplified breakdown of the request and response body mapping between the processor and Hyperswitch:</b></p>
        
        <p><b>Request to Processor:</b> When initiating a card payment, you'll send a request to the processor. This request typically includes information about the payment, such as the card details, the amount to be charged, and any additional required data.</p>
        
        <p><b>Response from Processor:</b> The processor will respond with a confirmation or authorization for the payment. This response may contain various details, including a unique transaction identifier, authorization codes, and any other relevant information.</p>
        
        <p>Hyperswitch acts as the intermediary, facilitating the communication between your system and the payment processor, ensuring that the authorization process is secure and compliant. Understanding the request and response body mapping is crucial for successful payment authorizations through Hyperswitch.</p></div>`,
        curlRequest: {
          url: '',
          method: '',
          headers: [],
          data: {},
        },
        statusVariable: null,
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
        statusVariable: null,
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
        statusVariable: null,
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
        statusVariable: null,
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
        statusVariable: null,
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
        statusVariable: null,
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

export const updateAppContextInLocalStorage = (appContext) => {
  try {
    const jsonStr = JSON.stringify(appContext);
    storeItem('app_context', jsonStr);
    console.info('Stored app_context in localStorage', jsonStr);
  } catch (error) {
    console.info('Failed to persist appContext in localStorage', error);
  }
};
