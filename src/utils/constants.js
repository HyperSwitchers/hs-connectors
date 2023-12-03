// @ts-check

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
