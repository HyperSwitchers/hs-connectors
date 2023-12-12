// @ts-check

import { toPascalCase } from './Parser';

export const AUTH_TYPES_MAPPING = {
  api_key: [],
  key1: [],
  secret_key: [],
  key2: [],
  base_64_encode_api_key_colon_key1: [],
  base_64_encode_key1_colon_api_key: [],
};

export const DEFAULT_SECRETS_IN_SYNONYMS = [
  '$card_expiry_year_month',
  '$card_exp_month',
  '$card_exp_year',
  '$card_number',
  '$card_cvc',
  '$card_holder_name',
  '$email',
];

export const HYPERSWITCH_STATUS_LIST = {
  Authorize: [
    'Started',
    'AuthenticationFailed',
    'RouterDeclined',
    'AuthenticationPending',
    'AuthenticationSuccessful',
    'Authorized',
    'AuthorizationFailed',
    'Charged',
    'Authorizing',
    'CodInitiated',
    'Voided',
    'VoidInitiated',
    'CaptureInitiated',
    'CaptureFailed',
    'VoidFailed',
    'AutoRefunded',
    'PartialCharged',
    'Unresolved',
    'Pending',
    'Failure',
    'PaymentMethodAwaited',
    'ConfirmationAwaited',
    'DeviceDataCollectionPending',
  ],
  Capture: [
    'Started',
    'AuthenticationFailed',
    'RouterDeclined',
    'AuthenticationPending',
    'AuthenticationSuccessful',
    'Authorized',
    'AuthorizationFailed',
    'Charged',
    'Authorizing',
    'CodInitiated',
    'Voided',
    'VoidInitiated',
    'CaptureInitiated',
    'CaptureFailed',
    'VoidFailed',
    'AutoRefunded',
    'PartialCharged',
    'Unresolved',
    'Pending',
    'Failure',
    'PaymentMethodAwaited',
    'ConfirmationAwaited',
    'DeviceDataCollectionPending',
  ],
  Void: [
    'Started',
    'AuthenticationFailed',
    'RouterDeclined',
    'AuthenticationPending',
    'AuthenticationSuccessful',
    'Authorized',
    'AuthorizationFailed',
    'Charged',
    'Authorizing',
    'CodInitiated',
    'Voided',
    'VoidInitiated',
    'CaptureInitiated',
    'CaptureFailed',
    'VoidFailed',
    'AutoRefunded',
    'PartialCharged',
    'Unresolved',
    'Pending',
    'Failure',
    'PaymentMethodAwaited',
    'ConfirmationAwaited',
    'DeviceDataCollectionPending',
  ],
  Refund: [
    'Failure',
    'ManualReview',
    'Pending',
    'Success',
    'TransactionFailure',
  ],
  PSync: [
    'Started',
    'AuthenticationFailed',
    'RouterDeclined',
    'AuthenticationPending',
    'AuthenticationSuccessful',
    'Authorized',
    'AuthorizationFailed',
    'Charged',
    'Authorizing',
    'CodInitiated',
    'Voided',
    'VoidInitiated',
    'CaptureInitiated',
    'CaptureFailed',
    'VoidFailed',
    'AutoRefunded',
    'PartialCharged',
    'Unresolved',
    'Pending',
    'Failure',
    'PaymentMethodAwaited',
    'ConfirmationAwaited',
    'DeviceDataCollectionPending',
  ],
  RSync: [
    'Failure',
    'ManualReview',
    'Pending',
    'Success',
    'TransactionFailure',
  ],
};

export const CODE_SNIPPETS = ['cURL'];

export const FLOW_OPTIONS = [
  'AuthType',
  'Authorize',
  'Capture',
  'Void',
  'Refund',
  'PSync',
  'RSync',
];

export const PAYMENT_METHOD_OPTIONS = ['Card'];

export const RESPONSE_TYPES = {
  status: ['status', 'payment_status'],
  response_id: ['id', 'payment_id', 'order_id'],
};

export const SYNONYM_MAPPING = {
  Authorize: {
    amount: ['amount', 'authorization_amount'],
    billing_address_firstname: [
      'first_name',
      'firstname',
      'firstName',
      'username',
      'phone_number',
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
      'name',
      'cardholderName',
      'holderName',
      'name_on_card',
      'cardHolderName',
    ],
    billing_country: ['country', 'country_code'],
    shipping_country: ['country', 'country_code'],
    currency: ['currency', 'currency_code'],
    description: ['description', 'softDescriptor'],
    email: ['email'],
    connector_request_reference_id: [
      'reference',
      'reference_id',
      'payment_id',
      'order_id',
    ],
    phone_number: ['phone', 'contact_number', 'phone_number'],
    setup_future_usage: ['storePaymentMethod'],
    return_url: ['returnUrl', ''],
    is_auto_capture: [
      'auto_capture',
      'capture',
      'submit_for_settlement',
      'captured',
    ],
  },
  Capture: {
    amount: ['amount', 'authorization_amount'],
    currency: ['currency', 'currency_code'],
  },
  Void: {
    amount: ['amount', 'authorization_amount'],
    currency: ['currency', 'currency_code'],
  },
  Refund: {
    refund_amount: ['refund_amount', 'authorization_amount', 'amount'],
    currency: ['currency', 'currency_code'],
  },
  PSync: {},
  RSync: {},
};

export const TYPES_LIST = [
  'String',
  'i32',
  'i64',
  'f32',
  'f64',
  'bool',
  'array',
  'enum',
];

export const TYPES_MAPPING = {
  i64: [],
  f64: [],
  base_String: [],
  f64_String: [],
  CardNumber: [],
  Currency: [],
  Email: [],
  enum: [],
};

export const CURRENCY_UNIT = ['Minor', 'Base'];

export const CURRENCY_UNIT_TYPE = ['String', 'i64', 'f64'];

export const DEFAULT_CURL = {
  authorize: `curl --location --request POST 'https://api.sandbox.checkout.com/payments'     --header 'Authorization: Bearer sk_sbox_3w2n46fb6m4tlp3c6ukvixwoget'     --header 'Content-Type: application/json'     --data-raw '{
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
};

export const DEFAULT_CONNECTOR = 'DemoCon';

export const DEFAULT_AUTH_TYPE = 'HeaderKey';

export const AUTH_KEYS = {
  HeaderKey: { api_key: '' },
  BodyKey: { api_key: '', key1: '' },
  SignatureKey: {
    api_key: '',
    key1: '',
    api_secret: '',
  },
  MultiAuthKey: {
    api_key: '',
    key1: '',
    api_secret: '',
    key2: '',
  },
};

export const DEFAULT_FLOW = 'AuthType';

export const defaultConnectorProps = (connector) => {
  let connectorPascalCase = toPascalCase(connector);
  return {
    connector: connector,
    url: '',
    content_type: '',
    struct_name: connectorPascalCase,
    connector_name: connector,
    currency_unit: CURRENCY_UNIT[0],
    currency_unit_type: CURRENCY_UNIT_TYPE[0],
    flows: {
      PaymentMethodToken: {
        trait_name: 'api::PaymentMethodToken',
        data_type: 'types::PaymentMethodTokenizationData',
        response_data: 'types::PaymentsResponseData',
        enabled: [],
      },
      AccessTokenAuth: {
        trait_name: 'api::AccessTokenAuth',
        data_type: 'types::AccessTokenRequestData',
        response_data: 'types::AccessToken',
        enabled: [],
      },
      MandateSetup: {
        trait_name: 'api::SetupMandate',
        data_type: 'types::SetupMandateRequestData',
        response_data: 'types::PaymentsResponseData',
        enabled: [],
      },
      Authorize: {
        trait_name: 'api::Authorize',
        data_type: 'types::PaymentsAuthorizeData',
        router_type: 'types::PaymentsAuthorizeRouterData',
        request_type: 'AuthorizeRequest',
        response_type: 'AuthorizeResponse',
        router_data_type: 'RouterData',
        response_data: 'types::PaymentsResponseData',
        flow_type: 'types::PaymentsAuthorizeType',
        url_path: '',
        http_method: '',
        enabled: ['convert_router_amount'],
      },
      Void: {
        trait_name: 'api::Void',
        data_type: 'types::PaymentsCancelData',
        response_data: 'types::PaymentsResponseData',
        response_type: 'VoidResponse',
        router_data_type: 'RouterData',
        flow_type: 'types::PaymentsVoidType',
        http_method: 'Post',
        enabled: [],
      },
      PSync: {
        trait_name: 'api::PSync',
        data_type: 'types::PaymentsSyncData',
        router_type: 'types::PaymentsSyncRouterData',
        response_data: 'types::PaymentsResponseData',
        response_type: 'PsyncResponse',
        router_data_type: 'RouterData',
        http_method: 'Get',
        flow_type: 'types::PaymentsSyncType',
        enabled: [],
      },
      Capture: {
        trait_name: 'api::Capture',
        data_type: 'types::PaymentsCaptureData',
        router_type: `types::PaymentsCaptureRouterData`,
        router_data_type: 'RouterData',
        response_type: 'CaptureResponse',
        response_data: 'types::PaymentsResponseData',
        flow_type: 'types::PaymentsCaptureType',
        http_method: 'Post',
        enabled: [],
      },
      Session: {
        trait_name: 'api::Session',
        data_type: 'types::PaymentsSessionData',
        response_data: 'types::PaymentsResponseData',
        router_type: 'types::PaymentsSyncRouterData',
        enabled: [],
      },
      Refund: {
        trait_name: 'api::Execute',
        data_type: 'types::RefundsData',
        router_type: `types::RefundsRouterData<api::Execute>`,
        request_type: 'RefundRequest',
        response_type: 'RefundResponse',
        router_data_type: 'RefundsRouterData',
        response_data: 'types::RefundsResponseData',
        http_method: 'Post',
        flow_type: 'types::RefundExecuteType',
        enabled: ['convert_router_amount'],
        refund_amount: true,
      },
      RSync: {
        trait_name: 'api::RSync',
        data_type: 'types::RefundsData',
        router_type: `types::RefundSyncRouterData`,
        request_type: 'RefundRequest',
        response_type: 'RefundResponse',
        router_data_type: 'RefundsRouterData',
        response_data: 'types::RefundsResponseData',
        http_method: 'Get',
        flow_type: 'types::RefundSyncType',
        enabled: [],
      },
    },
  };
};

export const TOOLTIPS = {
  flowType: 'Type of API to be integrated',
  paymentMethodType: 'Method to be used for the payment',
};

export const DESCRIPTION = {
  authorize: `<div><p><b>Authorizing Payment with Hyperswitch</b></p>
  <p>Understanding how to authorize a payment to the processor through Hyperswitch is essential for smooth and secure transactions. In the case of card payments, you'll need to identify the specific object that the processor accepts for authorization, such as the "Charge" object. This "Charge" object represents a payment made with a credit or debit card.</p>
      
      <p><b>Here's a simplified breakdown of the request and response body mapping between the processor and Hyperswitch:</b></p>
      
      <p><b>Request to Processor:</b> When initiating a card payment, you'll send a request to the processor. This request typically includes information about the payment, such as the card details, the amount to be charged, and any additional required data.</p>
      
      <p><b>Response from Processor:</b> The processor will respond with a confirmation or authorization for the payment. This response may contain various details, including a unique transaction identifier, authorization codes, and any other relevant information.</p>
      
      <p>Hyperswitch acts as the intermediary, facilitating the communication between your system and the payment processor, ensuring that the authorization process is secure and compliant. Understanding the request and response body mapping is crucial for successful payment authorizations through Hyperswitch.</p></div>`,
};

export const DEFAULT_APP_CONTEXT = {
  connectorName: DEFAULT_CONNECTOR,
  connectorPascalCase: DEFAULT_CONNECTOR,
  curlCommand: DEFAULT_CURL[DEFAULT_FLOW.toLowerCase()],
  curlRequest: null,
  currencyUnit: 'Minor',
  currencyUnitType: 'i64',
  paymentMethodType: null,
  statusVariable: null,
  selectedFlow: DEFAULT_FLOW,
  codeInvalidated: false,
  downloadInvalidated: false,
  description: DESCRIPTION[DEFAULT_FLOW.toLowerCase()],
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
};

export const DEFAULT_TRANSFORMER_STATE = {
  [DEFAULT_CONNECTOR]: {
    connectorName: DEFAULT_CONNECTOR,
    authType: DEFAULT_AUTH_TYPE,
    authKeys: AUTH_KEYS[DEFAULT_AUTH_TYPE],
    amount: {
      unit: 'Minor',
      unitType: 'i64',
    },
    flows: {},
    attempStatus: {},
    refundStatus: {},
  },
};

export const AUTH_KEYS_INFO = {
  HeaderKey: {
    api_key:
      'This is the API Key provided by the processor. Think of it as a bearer token, which is like a secure key that grants access to your account.',
  },
  BodyKey: {
    api_key:
      'This is the API Key provided by the processor. Think of it as a bearer token, which is like a secure key that grants access to your account.',
    key1: 'API Key 1 is an additional key or authorization that you need to provide to the processor. It is an extra layer of security or identification required for specific transactions.',
  },
  SignatureKey: {
    api_key:
      'This is the API Key provided by the processor. Think of it as a bearer token, which is like a secure key that grants access to your account.',
    key1: 'API Key 1 is an additional key or authorization that you need to provide to the processor. It is an extra layer of security or identification required for specific transactions.',
    api_secret:
      'The API Secret is provided by the processor and is used to generate a signature for authentication and security purposes. It helps verify the integrity of your requests and data.',
  },
  MultiAuthKey: {
    api_key:
      'This is the API Key provided by the processor. Think of it as a bearer token, which is like a secure key that grants access to your account.',
    key1: 'API Key 1 is an additional key or authorization that you need to provide to the processor. It is an extra layer of security or identification required for specific transactions.',
    api_secret:
      'The API Secret is provided by the processor and is used to generate a signature for authentication and security purposes. It helps verify the integrity of your requests and data.',
    key2: 'Similar to API Key 1, API Key 2 is another additional key or authorization that you need to provide to the processor. It may serve a unique purpose or role in the authorization process.',
  },
};

export const CURL_FOR_PR =
  'curl https://raw.githubusercontent.com/HyperSwitchers/hs-connectors/main/src/raise_connector_pr.sh | sh -s -- {{connector_pascal_case}} {{base_url}}';
