// @ts-check

import { atom } from 'recoil';
import { defaultConnectorProps } from 'components/composed/content/ConnectorTemplates';
import {
  AUTH_KEYS,
  DEFAULT_AUTH_TYPE,
  DEFAULT_CONNECTOR,
  DEFAULT_CURL,
} from './constants';

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
    connectorPascalCase: DEFAULT_CONNECTOR,
    connectorName: DEFAULT_CONNECTOR,
    curlCommand: "",
    curlRequest: null,
    currencyUnit: 'Minor',
    currencyUnitType: 'i64',
    generatorInput: {},
    wasCodeUpdatedBeforeDownload: false,
    loading: false,
    selectedFlow: 'AuthType',
    selectedPaymentMethodOption: '',
    codeInvalidated: false,
    props: defaultConnectorProps(DEFAULT_CONNECTOR),
    statusVariable: null,
    authType: {
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
    status: {
      value: null,
      mapping: null,
    },
    description: `<div><p><b>Authorizing Payment with Hyperswitch</b></p>

        <p>Understanding how to authorize a payment to the processor through Hyperswitch is essential for smooth and secure transactions. In the case of card payments, you'll need to identify the specific object that the processor accepts for authorization, such as the "Charge" object. This "Charge" object represents a payment made with a credit or debit card.</p>
        
        <p><b>Here's a simplified breakdown of the request and response body mapping between the processor and Hyperswitch:</b></p>
        
        <p><b>Request to Processor:</b> When initiating a card payment, you'll send a request to the processor. This request typically includes information about the payment, such as the card details, the amount to be charged, and any additional required data.</p>
        
        <p><b>Response from Processor:</b> The processor will respond with a confirmation or authorization for the payment. This response may contain various details, including a unique transaction identifier, authorization codes, and any other relevant information.</p>
        
        <p>Hyperswitch acts as the intermediary, facilitating the communication between your system and the payment processor, ensuring that the authorization process is secure and compliant. Understanding the request and response body mapping is crucial for successful payment authorizations through Hyperswitch.</p></div>`,
  },
});

export const FLOWS = atom({
  key: 'flows',
  default: {},
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
