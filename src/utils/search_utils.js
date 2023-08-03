import _ from 'lodash';

export const synonymMapping = {
    amount: ["amount", "authorization_amount"],
    auth_type_api_key: [],
    auth_type_key1: [],
    auth_type_secret_key: [],
    auth_type_key2: [],
    billing_address_firstname: ["name", "first_name", "firstname", "firstName", "username"],
    billing_address_lastname: ["last_name", "lastname", "lastName"],
    billing_address_line1: ["line1", "address_line_1"],
    billing_address_line2: ["line2"],
    billing_address_line3: ["line3"],
    billing_address_city: ["city"],
    billing_address_state: ["state"],
    billing_address_zip: ["zip", "pin_code", "pin", "postal_code"],
    browser_accept_header: ["accept_header", "acceptHeader"],
    browser_java_enabled: ["java_enabled", "javaEnabled"],
    browser_language: ["language"],
    browser_color_depth: ["color_depth", "colorDepth"],
    browser_screen_height: ["screen_height", "screenHeight"],
    browser_screen_width: ["screen_width", "screenWidth"],
    browser_time_zone: ["time_zone", "timeZone"],
    browser_user_agent: ["user_agent", "userAgent"],
    browser_javascript_enabled: ["javascript_enabled", "java_script_enabled", "javaScriptEnabled"],
    browser_ip_address: ["ip_address","ipAddress", "ip"],
    card_expiry_year_month: ["expiry"],
    card_exp_month: ["expiry_month", "expMonth", "expiryMonth", "expirationMonth", "expire_month"],
    card_exp_year: ["expiry_year", "expYear", "expiryYear", "expirationYear", "expire_year"],
    card_number: ["number", "cardNumber", "account_number"],
    card_cvc: ["cvc", "cvd","cvv", "CVV", "security_code", "securityCode", "card_verification_value"],
    card_holder_name: ["cardholderName", "holderName", "name_on_card", "cardHolderName"],
    capture: ["auto_capture", "capture", "submit_for_settlement"],
    country: ["country", "country_code"],
    currency: ["currency", "currency_code"],
    description: ["description", "softDescriptor"],
    email: ["email"],
    payment_id: ["reference", "reference_id", "payment_id", "order_id"],
    phone_number: ["phone", "contact_number", "phone_number"],
    setup_future_usage: ["storePaymentMethod"],
    return_url: ["returnUrl", ""]
};

export default function mapFieldNames(input) {
    if (_.isObject(input)) {
        if (_.isArray(input)) {
            let res = _.map(input, (item) => mapFieldNames(item));
            return res;
        } else {
            let res =  _.mapValues(input, (value, key) => {
                if (_.isObject(value)) {
                    return mapFieldNames(value);
                } else {
                    const synonymKey = _.map(synonymMapping, (value, kk) => _.find(value, (synonym) => synonym === key) ? kk : undefined).filter(a => a)
                    return synonymKey[0] ? "$"+synonymKey[0] : mapFieldNames(value);
                }
            });
            return res;
        }
    }
    return input;
}