const nestedStructsMap = new Map();
const structOccurrences = new Map();
var nestedFields = {};
var connectorName = localStorage.props
    ? JSON.parse(localStorage.props)?.connector
    : '';

const connectorImports = `use api_models::payments::Card;
use serde::{Deserialize, Serialize};
use cards::CardNumber;
use masking::Secret;
use crate::{connector::utils::{PaymentsAuthorizeRequestData, RouterData},core::errors,types::{self,api, storage::enums::{self, Currency}}};`;


const connectorTemplate = `//TODO: Fill the struct with respective fields
// REFUND :
// Type definition for RefundRequest
#[derive(Default, Debug, Serialize)]
pub struct ${connectorName}RefundRequest {
    pub amount: i64
}

impl<F> TryFrom<&types::RefundsRouterData<F>> for ${connectorName}RefundRequest {
    type Error = error_stack::Report<errors::ConnectorError>;
    fn try_from(item: &types::RefundsRouterData<F>) -> Result<Self,Self::Error> {
        Ok(Self {
            amount: item.request.refund_amount,
        })
    }
}

// Type definition for Refund Response

#[allow(dead_code)]
#[derive(Debug, Serialize, Default, Deserialize, Clone)]
pub enum RefundStatus {
    Succeeded,
    Failed,
    #[default]
    Processing,
}

impl From<RefundStatus> for enums::RefundStatus {
    fn from(item: RefundStatus) -> Self {
        match item {
            RefundStatus::Succeeded => Self::Success,
            RefundStatus::Failed => Self::Failure,
            RefundStatus::Processing => Self::Pending,
            //TODO: Review mapping
        }
    }
}

//TODO: Fill the struct with respective fields
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct RefundResponse {
    id: String,
    status: RefundStatus
}

impl TryFrom<types::RefundsResponseRouterData<api::Execute, RefundResponse>>
    for types::RefundsRouterData<api::Execute>
{
    type Error = error_stack::Report<errors::ConnectorError>;
    fn try_from(
        item: types::RefundsResponseRouterData<api::Execute, RefundResponse>,
    ) -> Result<Self, Self::Error> {
        Ok(Self {
            response: Ok(types::RefundsResponseData {
                connector_refund_id: item.response.id.to_string(),
                refund_status: enums::RefundStatus::from(item.response.status),
            }),
            ..item.data
        })
    }
}

impl TryFrom<types::RefundsResponseRouterData<api::RSync, RefundResponse>> for types::RefundsRouterData<api::RSync>
{
     type Error = error_stack::Report<errors::ConnectorError>;
    fn try_from(item: types::RefundsResponseRouterData<api::RSync, RefundResponse>) -> Result<Self,Self::Error> {
        Ok(Self {
            response: Ok(types::RefundsResponseData {
                connector_refund_id: item.response.id.to_string(),
                refund_status: enums::RefundStatus::from(item.response.status),
            }),
            ..item.data
        })
     }
 }

//TODO: Fill the struct with respective fields
#[derive(Default, Debug, Serialize, Deserialize, PartialEq)]
pub struct ${connectorName}ErrorResponse {
    pub status_code: u16,
    pub code: String,
    pub message: String,
    pub reason: Option<String>,
}
`;
// Define the replacements for dynamic values
const replacements = {
    card_number: `ccard.card_number.clone()`,
    card_number_CardNumber: `ccard.card_number.clone()`,
    card_exp_month: "ccard.card_exp_month.clone()",
    card_exp_month_String: "ccard.card_exp_month.clone()",
    card_exp_year: "ccard.card_exp_year.clone()",
    card_exp_year_String: "ccard.card_exp_year.clone()",
    card_cvc: "ccard.card_cvc.clone()",
    card_cvc_String: "ccard.card_cvc.clone()",
    card_holder_name: "ccard.card_holder_name.clone()",
    card_holder_name_String: "ccard.card_holder_name.clone()",
    amount: "item.amount",
    amount_type_i64: "item.request.amount",
    amount_type_decimal: "utils::to_currency_base_unit_asf64(item.request.amount, item.request.currency)?",
    amount_type_decimal_string: "utils::to_currency_base_unit(item.request.amount, item.request.currency)?",
    amount_type_base_string: "item.request.amount.to_string()",
    email: `item.request.get_email()?`,
    email_Email: `item.request.get_email()?`,
    currency: "item.request.currency",
    currency_Currency: "item.request.currency",
    router_return_url: `item.request.get_return_url()?`,
    webhook_url: `item.request.get_webhook_url()?`,
    complete_authorize_url: `item.request.complete_authotrize_url`,
    browser_info_accept_header: `item.request.get_browser_info()?.get_accept_header()?`,
    browser_info_language: `item.request.get_browser_info()?.get_language()?`,
    browser_info_screen_height: `item.request.get_browser_info()?.get_screen_height()?`,
    browser_info_screen_width: `item.request.get_browser_info()?.get_screen_width()?`,
    browser_info_color_depth: `item.request.get_browser_info()?.get_color_depth()?`,
    browser_info_user_agent: `item.request.get_browser_info()?.get_user_agent()?`,
    browser_info_time_zone_i32: `item.request.get_browser_info()?.get_time_zone()?`,
    browser_info_java_enabled_bool: `item.request.get_browser_info()?.get_java_enabled()?`,
    browser_info_java_script_enabled_bool: `item.request.get_browser_info()?.get_java_script_enabled()?`,
    description: `item.get_description()?`,
    return_url: `item.get_return_url()?`,
    billing_country: `item.request.billing.address.get_country()?`,
    billing_country_CountryAlpha2: `item.request.billing.address.get_country()?`,
    billing_address_line1: `item.request.billing.address.get_line1()?`,
    billing_address_line2: `item.request.billing.address.get_line2()?`,
    billing_address_city: `item.request.billing.address.get_city()?`,
    billing_address_state: `item.request.billing.address.get_state()?`,
    billing_address_zip: `item.request.billing.address.get_zip()?`,
    billing_address_firstname: `item.request.billing.address.get_firstname()?`,
    billing_address_lastname: `item.request.billing.address.get_lastname()?`,
    shipping_country: `item.request.shipping.address.get_country()?`,
    shipping_country_CountryAlpha2: `item.request.shipping.address.get_country()?`,
    payment_id: "item.attempt_id.clone()",
    connector_request_reference_id: "item.connector_request_reference_id.clone()",
    connector_transaction_id: "item.request.connector_transaction_id.clone()",
    refund_reason: "item.router_data.request.reason.clone()"
};

export const responseReplacements = {
    status: "status",
    transactionId: "transaction_id",
    redirectionData: "redirection_data",
    amountCaptured: "amount_captured"
};

const hsFieldTypes = {
    card_number: "CardNumber",
    email: "Email",
    ip_address: "pii::IpAddress",
    currency: "diesel_models::enums::Currency",
    shipping_country: "CountryAlpha2",
    billing_country: "CountryAlpha2"
};

function toSnakeCase(str) {
    return str ? str.replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\-]+/g, '_')
        .toLowerCase() : ''
}
// function toSnakeCase(str) {
//     return str ? str.replace(/[A-Z]/g, (letter, index) => (index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`)) : '';
// }

export const toPascalCase = (str) => {
    return str
        .split(/\s|_|-/g) // Split by whitespace, underscore, or hyphen
        .map(word => {
            if (/^[A-Z]+$/.test(word)) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Convert all-uppercase words
            } else if (/^[a-z]+$/.test(word)) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Convert all-lowercase words
            }
            else {
                return word; // Preserve other words
            }
        })
        .join('');
    // return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
    // console.log(str.replace(/(\w)(\w*)/g, function (_, firstChar, restOfString) {
    //     return firstChar.toUpperCase() + restOfString.toLowerCase();
    // }).replace(/\s+/g, ''));
    // return str
    //     ? str.replace(/(?:^|_)([a-z0-9A-Z])/g, (_, letter) => letter.toUpperCase())
    //     : '';
}

function removeQuotes(jsonString) {
    // console.log(jsonString);
    let res = jsonString.replace(/\"([a-z&]+?(\.|_)+.*?)\"/g, "$1");
    // console.log(res);
    let res2 = res.replace(/\"\"/g, "");
    // console.log(res2);
    // console.log(res2.replace(/"([^"]+)":/g, '$1:'));
    let res3 = res2.replace(/"([^"]+)":/g, '$1:');
    return res3.replace(/&dq/g, '"');

}

function typeReplacement(fieldValue, fieldTypeValue) {
    // const lastIndex = fieldTypeValue.lastIndexOf("_");

    if (typeof fieldValue === "string") {
        if (fieldValue.startsWith("$")) {

            // Extract the dynamic value name without the "$" prefix
            const dynamicValueName = fieldValue.substring(1);

            // Check if a replacement is available for the dynamic value
            const replacement = hsFieldTypes[`${dynamicValueName}`] || fieldTypeValue;

            // Store the replacement value for this field
            return replacement;
        }
        else {
            // If the value is not a dynamic value or nested object, treat it as a regular value
            return fieldTypeValue;
        }
    } else {
        // If the value is not a dynamic value or nested object, treat it as a regular value
        return fieldTypeValue;
    }
    // if (lastIndex !== -1) {
    //     return fieldTypeValue.substring(lastIndex + 1);
    // }
    // return fieldTypeValue;
}

function generateAuthType(authKeys) {
    const jsonKeys = Object.keys(authKeys);
    const jsonValues = Object.values(authKeys);

    const numFields = jsonKeys.length;
    if (numFields === 1) {
        const [key1] = jsonKeys.map(item => toSnakeCase(item));
        const [value1] = jsonValues.map(item => toSnakeCase(item));
        return `
// Auth Struct
pub struct ${connectorName}AuthType {
    pub(super) ${value1}: Secret<String>,
}

impl TryFrom<&types::ConnectorAuthType> for ${connectorName}AuthType {
    type Error = error_stack::Report<errors::ConnectorError>;
    fn try_from(auth_type: &types::ConnectorAuthType) -> Result<Self, Self::Error> {
        match auth_type {
            types::ConnectorAuthType::HeaderKey { ${key1} } => Ok(Self {
                ${value1}: ${key1}.to_owned(),
            }),
            _ => Err(errors::ConnectorError::FailedToObtainAuthType.into()),
        }
    }
}`;
    } else if (numFields === 2) {
        const [key1, key2] = jsonKeys.map(item => toSnakeCase(item));
        const [value1, value2] = jsonValues.map(item => toSnakeCase(item));

        return `
// Auth Struct
pub struct ${connectorName}AuthType {
    pub(super) ${value1}: Secret<String>,
    pub(super) ${value2}: Secret<String>,
}

impl TryFrom<&types::ConnectorAuthType> for ${connectorName}AuthType {
    type Error = error_stack::Report<errors::ConnectorError>;
    fn try_from(auth_type: &types::ConnectorAuthType) -> Result<Self, Self::Error> {
        match auth_type {
            types::ConnectorAuthType::BodyKey { ${key1}, ${key2} } => Ok(Self {
                ${value1}: ${key1}.to_owned(),
                ${value2}: ${key2}.to_owned(),
            }),
            _ => Err(errors::ConnectorError::FailedToObtainAuthType.into()),
        }
    }
}`;
    } else if (numFields === 3) {
        const [key1, key2, key3] = jsonKeys.map(item => toSnakeCase(item));
        const [value1, value2, value3] = jsonValues.map(item => toSnakeCase(item));

        return `
// Auth Struct
pub struct ${connectorName}AuthType {
    pub(super) ${value1}: Secret<String>,
    pub(super) ${value2}: Secret<String>,
    pub(super) ${value3}: Secret<String>,
}

impl TryFrom<&types::ConnectorAuthType> for ${connectorName}AuthType {
    type Error = error_stack::Report<errors::ConnectorError>;
    fn try_from(auth_type: &types::ConnectorAuthType) -> Result<Self, Self::Error> {
        match auth_type {
            types::ConnectorAuthType::SignatureKey { ${key1}, ${key2}, ${key3} } => Ok(Self {
                ${value1}: ${key1}.to_owned(),
                ${value2}: ${key2}.to_owned(),
                ${value3}: ${key3}.to_owned(),
            }),
            _ => Err(errors::ConnectorError::FailedToObtainAuthType.into()),
        }
    }
}`;
    }
}

function generateConnectorAmount(connectorAmount) {
    let amount = null;
    let unused_var = '_';

    switch (connectorAmount.unitType.toLowerCase()) {
        case "f64": amount = `utils::get_amount_as_f64(currency_unit, amount, currency)`; unused_var = ''; break;
        case "string": amount = `utils::get_amount_as_string(currency_unit, amount, currency)`; unused_var = ''; break;
    };
    return `
impl<T>
    TryFrom<(
        &types::api::CurrencyUnit,
        types::storage::enums::Currency,
        i64,
        T,
    )> for ${connectorName}RouterData<T>
{
    type Error = error_stack::Report<errors::ConnectorError>;
    fn try_from(
        (${unused_var}currency_unit, ${unused_var}currency, amount, item): (
            &types::api::CurrencyUnit,
            types::storage::enums::Currency,
            i64,
            T,
        ),
    ) -> Result<Self, Self::Error> {
        ${amount == null ? '' : `let amount = ${amount}?;`}
        Ok(Self {
            amount,
            router_data: item,
        })
    }
}`;
}

function generateTryFroms(flowType, request, hsResponse) {
    let requestRouterDataType = `PaymentsAuthorizeRouterData`;
    let responseRouterDataType = `ResponseRouterData`;
    let apiType = "Authorize";

    switch (flowType) {
        case "Authorize": requestRouterDataType = `PaymentsAuthorizeRouterData`; responseRouterDataType = `PaymentsResponseRouterData`; apiType = `Authorize`; break;
        case "Capture": requestRouterDataType = `PaymentsCaptureRouterData`; responseRouterDataType = `PaymentsCaptureResponseRouterData`; apiType = `Capture`; break;
        case "Psync": requestRouterDataType = `PaymentsSyncRouterData`; responseRouterDataType = `PaymentsSyncResponseRouterData`; apiType = `Psync`; break;
        case "Void": requestRouterDataType = `PaymentsCancelRouterData`; responseRouterDataType = `PaymentsCancelResponseRouterData`; apiType = `Void`; break;
        case "Refund": requestRouterDataType = `RefundsRouterData`; responseRouterDataType = `RefundsResponseRouterData`; apiType = `Execute`; break;
        case "Rsync": requestRouterDataType = `RefundSyncRouterData`; responseRouterDataType = `RefundsResponseRouterData`; apiType = `RSync`; break;
    };
    let generatedRequestTryFrom = '';
    let generatedResponseTryFrom = '';
    if (request.length !== 0) {
        generatedRequestTryFrom = `impl TryFrom<&types::${requestRouterDataType}> for ${connectorName}${flowType}Request {
        type Error = error_stack::Report<errors::ConnectorError>;
        fn try_from(item: &types::${requestRouterDataType}) -> Result<Self, Self::Error> {
            ${request.join('\n\t\t\t')}
            Ok(${connectorName.toLowerCase()}_${flowType.toLowerCase()}_request)
        }
    }    `;

        if (flowType === "Authorize") {

            generatedRequestTryFrom = `impl TryFrom<(&types::PaymentsAuthorizeRouterData, &Card)> for ${connectorName}${flowType}Request {
            type Error = error_stack::Report<errors::ConnectorError>;
            fn try_from(value: (&types::PaymentsAuthorizeRouterData, &Card)) -> Result<Self, Self::Error> {
                let (item, ccard) = value;
                ${request.join('\n\t\t\t')}
                Ok(${connectorName.toLowerCase()}_${flowType.toLowerCase()}_request)
            }
        }    
impl TryFrom<&types::PaymentsAuthorizeRouterData> for ${connectorName}${flowType}Request {
    type Error = error_stack::Report<errors::ConnectorError>;
    fn try_from(item: &types::PaymentsAuthorizeRouterData) -> Result<Self, Self::Error> {
        match &item.request.payment_method_data {
            api_models::payments::PaymentMethodData::Card(card) => Self::try_from((item, card)),
            _ => Err(errors::ConnectorError::NotImplemented(
                "payment method".to_string(),
            ))?,
        }
    }
}`;
        }
    }
    if (hsResponse != undefined && (hsResponse.status || hsResponse.response.resource_id)) {
        generatedResponseTryFrom = `impl TryFrom<types::${responseRouterDataType}<${connectorName}${flowType}Response>> 
    for types::${requestRouterDataType}
{
    type Error = error_stack::Report<errors::ConnectorError>;
    fn try_from(item: types::${responseRouterDataType}<${connectorName}${flowType}Response>>,
    ) -> Result<Self,Self::Error> {
        Ok(Self {
            status: enums::AttemptStatus::from(item.response.${hsResponse.status.substring(1)}),
            response: Ok(types::PaymentsResponseData::TransactionResponse {
                resource_id: types::ResponseId::ConnectorTransactionId(item.response.${hsResponse.response.resource_id.substring(1)}),
                redirection_data: item.response.${hsResponse.response.redirection_data.substring(1)},
                mandate_reference: None,
                connector_metadata: None,
                network_txn_id: None,
                connector_response_reference_id: item.response.${hsResponse.response.connector_response_reference_id.substring(1)},
            }),
            ..item.data
        })
    }
}`;

        if (flowType === "Refund") {
            generatedResponseTryFrom = `impl TryFrom<types::RefundsResponseRouterData<api::${apiType}, ${connectorName}${flowType}Response>>
    for types::RefundsRouterData<api::${apiType}>
{
    type Error = error_stack::Report<errors::ConnectorError>;
    fn try_from(
        item: types::RefundsResponseRouterData<api::${apiType}, ${connectorName}${flowType}Response>>,
    ) -> Result<Self, Self::Error> {
        Ok(Self {
            response: Ok(types::RefundsResponseData {
                connector_refund_id: item.response.${hsResponse.response.resource_id.substring(1)},
                refund_status: enums::RefundStatus::from(item.response.${hsResponse.status.substring(1)}),
            }),
            ..item.data
        })
    }
}`;
        }
    }
    return `${generatedRequestTryFrom}\n\n${generatedResponseTryFrom}`;
}

function generateStatusMapping(statusType, inputJson) {
    let statusArray = [];
    let tryFromArray = [];
    Object.entries(inputJson).forEach(([AttempStatus, ConnectorStatus]) => {
        statusArray.push(`${toPascalCase(ConnectorStatus)}`);
        tryFromArray.push(`${toPascalCase(connectorName)}${statusType}::${ConnectorStatus} => Self::${AttempStatus}`);
    });
    const header = shouldAddCamelCaseHeader(Object.values(inputJson).map(([fieldName]) => fieldName))
        ? '#[serde(rename_all = "camelCase")]'
        : '';
    return `#[derive(Debug, Serialize, Deserialize)]
${header}
pub enum ${connectorName}${statusType} {
    ${statusArray.join(',\n\t')}
}
impl From<${toPascalCase(connectorName)}${statusType}> for enums::${statusType} {
    fn from(item: ${toPascalCase(connectorName)}${statusType}) -> Self {
        match item {
            ${tryFromArray.join(',\n\t\t\t')}
        }
    }
}`
}

function generateRustEnumStruct(name, fields) {
    let structFields = fields.type.map((element) => toPascalCase(element));
    const header = addCasingHeader(fields.type.map((element) => element), true);

    const rustStruct = `
#[derive(Debug, Serialize, Deserialize)]
${header}
pub enum ${name} {
${structFields.join(',\n')}
}
`;
    return rustStruct;
}
//(toSnakeCase(amount),  {value:, optional:, ..}, $parentName)
function generateRustStructField(fieldName, fieldValue, parentName) {
    let fieldType = typeReplacement(fieldValue.value, fieldValue.type);

    if (Array.isArray(fieldValue.type)) {
        const structName = toPascalCase(`${parentName}_${fieldName}`);
        fieldType = structName;
        if (!nestedStructsMap.has(structName)) {
            // console.log(`${structName}\n---------\n`)
            nestedStructsMap.set(structName, generateRustEnumStruct(structName, fieldValue));
        }
    } else if (Array.isArray(fieldValue.value)) {
        // fieldType = `Vec<${toPascalCase(`${parentName}_${fieldName}`)}>`;
        let fieldValueItem = fieldValue.value[0];
        // console.log(`$$$$$JSON.stringify(fieldValueItem)`);
        if (typeof fieldValueItem.value === 'object') {
            const structName = toPascalCase(`${parentName}_${fieldName}_item`);
            fieldType = `${structName}`;
            if (fieldValueItem.secret) {
                fieldType = `Secret<${fieldType}>`
            }
            if (fieldValueItem.optional) {
                fieldType = `Option<${fieldType}>`
            }
            fieldType = `Vec<${fieldType}>`;
            const structFields = Object.entries(fieldValueItem.value);
            if (!nestedStructsMap.has(structName)) {
                nestedStructsMap.set(structName, generateRustStruct(structName, structFields));
            }
        } else {
            fieldType = `Vec<${typeReplacement(fieldValueItem.value, fieldValueItem.type)}>`;
        }
    } else if (typeof fieldValue.value === 'object') {
        const structName = toPascalCase(`${parentName}_${fieldName}`);
        fieldType = structName;
        const structFields = Object.entries(fieldValue.value);
        if (!nestedStructsMap.has(structName)) {
            // console.log(`${structName}\n---------\n`)
            nestedStructsMap.set(structName, generateRustStruct(structName, structFields));
        }
    } else {
        fieldType = typeReplacement(fieldValue.value, fieldValue.type);
    }


    if (fieldValue.secret) {
        fieldType = `Secret<${fieldType}>`
    }
    if (fieldValue.optional) {
        fieldType = `Option<${fieldType}>`
    }

    if (fieldName == "type") {
        fieldName = `${parentName}_${fieldName}`
        return `    #[serde(rename = "type")]
    pub ${toSnakeCase(fieldName)}: ${fieldType},`;
    }
    if (fieldName == "self") {
        fieldName = `${parentName}_${fieldName}`
        return `    #[serde(rename = "self")]
    pub ${toSnakeCase(fieldName)}: ${fieldType},`;
    }
    return `    pub ${toSnakeCase(fieldName)}: ${fieldType},`;
}

function shouldAddCamelCaseHeader(fields) {
    return fields.some((field) => /^[a-z]/.test(field)) && fields.some((field) => /^[A-Z]/.test(field));
}

function addCasingHeader(fields, isEnum) {
    const casingRegex = {
        camelCase: /^[a-z][a-zA-Z0-9]*$/,
        snake_case: /^[a-z_][a-z0-9_]*$/,
        SCREAMING_SNAKE_CASE: /^[A-Z_][A-Z0-9_]*$/,
        PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
        lowercase: /^[a-z]*$/,
        UPPERCASE: /^[A-Z]*$/,
        kebabCase: /^[a-z][a-z0-9-]*[a-z0-9]$/
    };

    const casingOrder = {
        "lowercase": isEnum ? '#[serde(rename_all = "lowercase")]' : '',
        "camelCase": '#[serde(rename_all = "camelCase")]',
        "snake_case": isEnum ? '#[serde(rename_all = "snake_case")]' : '',
        "kebabCase": '#[serde(rename_all = "kebabCase")]',
        "UPPERCASE": '#[serde(rename_all = "UPPERCASE")]',
        "SCREAMING_SNAKE_CASE": '#[serde(rename_all = "SCREAMING_SNAKE_CASE")]',
        "PascalCase": isEnum ? '' : '#[serde(rename_all = "PascalCase")]',
    };

    for (const casingStyle in casingOrder) {
        if (fields.every(field => casingRegex[casingStyle].test(field))) {
            return casingOrder[casingStyle];
        }
    }

    return "";
}


//(Name of the Struct, Array of [key, values] of fields inside that struct)
//($parentName_structName, [[amount, {value: , optional:, ...}], [card, {value: {}, optional:, ...}] ])
function generateRustStruct(name, fields) {
    let structFields = fields.map(([fieldName, fieldValue]) =>  //[amount, {value:, optional:, ..}]
        generateRustStructField(toSnakeCase(fieldName), fieldValue, name)
    );

    const header = addCasingHeader(fields.map(([fieldName]) => fieldName), false);

    const rustStruct = `
#[derive(Debug, Serialize, Deserialize)]
${header}
pub struct ${name} {
${structFields.join('\n')}
}
`;

    return rustStruct;
}

function generateNestedStructs(inputObject, parentName) {
    const structs = [];

    function processObject(inputObj, parentName) { //( { paymentsRequest: {}, paymentsResponse: {} }, ConnectorName)
        // [[key, Value], [key, Value]]
        inputObj && Object.entries(inputObj).forEach(([structName, structFields]) => { // [structname, structFields] = [paymentsRequest, {amount: {}, card:{}, currency:{}, }]
            if (structName == "hsResponse") return;

            if (Object.keys(inputObj[structName]).length === 0) return;


            if (typeof structFields === 'object') {
                //Get [key, value] of nested objects, the map will return Array([key, value])
                // fields = [[amount, {value: , optional:, ...}], [card, {value: {}, optional:, ...}] ]
                const fields = Object.keys(structFields).map((fieldName) => [fieldName, structFields[fieldName]]);

                // Generate unique field names for nested structs
                const fullName = parentName ? `${parentName}_${structName.substring(8)}` : structName;
                const structDefinition = generateRustStruct(toPascalCase(fullName), fields);
                if (!nestedStructsMap.has(toPascalCase(fullName))) {
                    nestedStructsMap.set(toPascalCase(fullName), structDefinition);
                    structs.push(structDefinition);
                }

                // for (const [fieldName, fieldValue] of fields) {
                //     if (typeof fieldValue === 'object' && (!fieldValue.hasOwnProperty("optional") || !fieldValue.hasOwnProperty("secret"))) {
                //         if (Array.isArray(fieldValue)) {
                //             fieldValue.forEach((element) => {
                //                 if (typeof element === 'object') {
                //                     processObject({ [fieldName]: element }, fullName);
                //                 }
                //             });
                //         } else {
                //             processObject({ [fieldName]: fieldValue }, fullName);
                //         }
                //     }
                // }
            }
            //         else {
            //             // If it's a primitive field, generate the field definition
            //             const rustStruct = `
            // pub ${toSnakeCase(structName)}: String,`;
            //             structs.push(rustStruct);
            //         }
        });
    }

    processObject(inputObject, parentName);

    return structs;
}
function replaceDynamicFields(value, type) {
    if (typeof value === "string") {
        if (value.startsWith("$")) {

            // Extract the dynamic value name without the "$" prefix
            const dynamicValueName = value.substring(1);

            if (type.startsWith("$")) {
                type = type.substring(1);
            }

            // Check if a replacement is available for the dynamic value
            const replacement = replacements[`${dynamicValueName}`] || replacements[`${dynamicValueName}_${type}`] || value;

            // Store the replacement value for this field
            return replacement;
        } else {
            return `&dq${value}&dq.to_string()`
            // return `"${value}".to_string()`
        }

    } else {
        // If the value is not a dynamic value or nested object, treat it as a regular value
        return value;
    }
}

function generateNestedInitStructs(inputObject, parentName) {
    const structs = [];
    // const structOccurrences = {};
    function processObject(inputObj, parentName) {
        const nestedFields = {};
        // [[key, Value], [key, Value]]
        const a = inputObj ? Object.entries(inputObj).forEach(([structName, structFields]) => {
            // console.log(`${structName}-----${structFields}`);
            if (Array.isArray(structFields.type)) {
                const fullName = parentName ? `${parentName}_${structName}` : structName;
                let variableValue = `${toPascalCase(fullName)}::${toPascalCase(structFields.type[0])}`;
                structs.push(`let ${toSnakeCase(fullName)} = ${variableValue};`);
                if (structName == "type" || structName == "self") {
                    structName = toSnakeCase(`${parentName}_${structName}`)
                }
                nestedFields[toSnakeCase(structName)] = toSnakeCase(fullName)
            } else if (typeof structFields.value === 'object') {
                //Get [key, value] of nested objects, the map will return Array([key, value])
                // const fields = Object.keys(structFields).map((fieldName) => [fieldName, structFields[fieldName]]);

                // // Generate unique field names for nested structs
                const fullName = parentName ? `${parentName}_${structName}` : structName;
                // const structDefinition = processObject(toPascalCase(fullName), fields);
                // if (!nestedStructsMap.has(toPascalCase(fullName))) {
                //     nestedStructsMap.set(toPascalCase(fullName), structDefinition);
                //     structs.push(structDefinition);
                // }

                // for (const [fieldName, fieldValue] of fields) {
                //     if (typeof fieldValue === 'object') {
                //         if (Array.isArray(fieldValue)) {
                //             fieldValue.forEach((element) => {
                //                 if (typeof element === 'object') {
                //                     processObject({ [fieldName]: element }, fullName);
                //                 }
                //             });
                //         } else {
                //             processObject({ [fieldName]: fieldValue }, fullName);
                //         }
                //     }
                // }
                let internallyNestedFields = processObject(structFields.value, toPascalCase(fullName));
                // console.log(`iiiii ${JSON.stringify(internallyNestedFields)}`);
                // structs.push(`let ${toSnakeCase(fullName)} = ${toPascalCase(fullName)}${JSON.stringify(internallyNestedFields)};`);
                let variableValue = `${toPascalCase(fullName)}${removeQuotes(JSON.stringify(internallyNestedFields))}`;
                // console.log(`vvvvv ${variableValue}`);
                // if (structFields.secret) {
                //     variableValue = `$Secret::new(${variableValue})`
                // }
                // if (structFields.optional) {
                //     variableValue = `Some(${variableValue})`
                // }
                structs.push(`let ${toSnakeCase(fullName)} = ${variableValue};`);
                nestedFields[toSnakeCase(structName)] = toSnakeCase(fullName);
            } else {
                // If it's a primitive field, generate the field definition
                if (structName == "type" || structName == "self") {
                    structName = toSnakeCase(`${parentName}_${structName}`)
                }
                let variableValue = replaceDynamicFields(structFields.value, structFields.type);
                // console.log(`vnvnvnvn ${variableValue}`);

                // if (structFields.secret) {
                //     variableValue = `$Secret::new(${variableValue})`
                // }
                if (structFields.optional) {
                    variableValue = `Some(${variableValue})`
                }
                nestedFields[toSnakeCase(structName)] = variableValue;
                // console.log(`nnnnnn ${JSON.stringify(nestedFields)}`);
            }
        }) : '';

        return nestedFields;
    }
    const nestedFieldsStruct = processObject(inputObject, parentName);
    console.log(`$$$$ ${JSON.stringify(nestedFieldsStruct)}`);
    // const structString = JSON.stringify(nestedFieldsStruct);
    const structString = removeQuotes(JSON.stringify(nestedFieldsStruct));
    structs.push(`let ${toSnakeCase(parentName)} = ${toPascalCase(parentName)}${structString};`)
    // console.log(structs.join('\n'))
    return structs;
}

function generatedResponseVariables(inputObject, parentName) {
    const structs = [];
    function processObject(inputObj, parentName) {
        // const nestedFields = {};
        // [[key, Value], [key, Value]]
        const a = inputObj ? Object.entries(inputObj).forEach(([structName, structFields]) => {
            // console.log(`${structName}-----${structFields}`);
            if (typeof structFields.value === 'object') {
                const fullName = parentName ? `${parentName}.${structName}` : structName;
                processObject(structFields.value, toSnakeCase(fullName))
            } else {
                // If it's a primitive field, generate the field definition
                if (structName == "type" || structName == "self") {
                    structName = toSnakeCase(`${parentName}_${structName}`)
                }

                if (typeof structFields.value === "string" && structFields.value.startsWith("$")) {
                    // Extract the dynamic value name without the "$" prefix
                    const dynamicValueName = structFields.value.substring(1);
                    // console.log(dynamicValueName);
                    // Check if a replacement is available for the dynamic value
                    const replacement = responseReplacements[`${dynamicValueName}`] || dynamicValueName;

                    // Store the replacement value for this field
                    // nestedFields[toSnakeCase(replacement)] = `${parentName}.${toSnakeCase(structName)}`;
                    let variableValue = `${parentName}.${toSnakeCase(structName)}`;
                    if (dynamicValueName == "status") {
                        variableValue = `enums::AttemptStatus::from(${variableValue})`
                    }
                    structs.push(`let ${toSnakeCase(replacement)} = ${variableValue};`);
                }
            }
        }) : '';

        return;
    }
    processObject(inputObject, parentName);
    // console.log(`$$$$ ${JSON.stringify(nestedFieldsStruct)}`);
    // const structString = JSON.stringify(nestedFieldsStruct);
    // const structString = removeQuotes(JSON.stringify(nestedFieldsStruct));
    // structs.push(`let ${toSnakeCase(parentName)} = ${toPascalCase(parentName)}${structString};`)
    // console.log(structs.join('\n'))
    return structs;
}

function printTemplateCode(connectorAuthCode, connectorAmount, tryFromsArray, connectorTemplateCode, attemptStatusMapping, refundStatusMapping) {

    let output = `${connectorImports}\n\n${connectorAuthCode}\n\n${connectorAmount}\n\n${[...nestedStructsMap.values()].join('')}\n${tryFromsArray.join('\n\n')}\n${attemptStatusMapping}\n\n${refundStatusMapping}\n${connectorTemplateCode}`;
    return output;

    // console.log(`${connectorAuthCode}\n\n${[...nestedStructsMap.values()].join('')}\n${generatedTryFrom}\n${paymentsRequestTryFrom}\n${generatedResponseTryFrom}\n${statusMapping}\n`);
}

export const generateRustCode = (connector, inputJson) => {
    const inputObject = JSON.parse(inputJson);
    connectorName = connector;

    inputObject[connectorName].attemptStatus = Object.keys(inputObject[connectorName]?.attemptStatus).reduce((acc, key) => {
        if (inputObject[connectorName]?.attemptStatus[key] !== null) {
            acc[key] = inputObject[connectorName]?.attemptStatus[key];
        }
        return acc;
    }, {});

    const attemptStatusMapping = inputObject[connectorName]?.attemptStatus && generateStatusMapping("AttemptStatus", inputObject[connectorName]?.attemptStatus);
    let refundStatusMapping = inputObject[connectorName]?.refundStatus && generateStatusMapping("RefundStatus", inputObject[connectorName]?.refundStatus);

    const tryFromsArray = [];

    let connectorAuthCode = inputObject[connectorName]?.authKeys && generateAuthType(inputObject[connectorName]?.authKeys);

    let connectorAmount = generateConnectorAmount(inputObject[connectorName]?.amount);
    // console.log(`$$$ ${inputObject2[connectorName.toLowerCase()]} ${connectorName}`);
    let refundFlag = false;
    let nestedStructs2 = [];
    let nestedStructs3 = [];
    Object.entries(inputObject[connectorName]?.flows).forEach(([flowType, requestResposne]) => {
        if (flowType === "Refund") {
            refundFlag = true;
        }
        if (Object.keys(inputObject[connectorName]?.flows[flowType]?.paymentsRequest).length === 0 && Object.keys(inputObject[connectorName]?.flows[flowType]?.paymentsResponse).length === 0) {
            return;
        }
        let parentObjectName = `${connectorName}${flowType}`
        const nestedStructs = generateNestedStructs(inputObject[connectorName]?.flows[flowType], `${toPascalCase(parentObjectName)}`);
        if ((Object.keys(inputObject[connectorName]?.flows[flowType]?.paymentsRequest).length !== 0)) {

            nestedStructs2 = inputObject[connectorName]?.flows[flowType].paymentsRequest && generateNestedInitStructs(inputObject[connectorName]?.flows[flowType].paymentsRequest, `${toPascalCase(connectorName)}${flowType}Request`);
        }
        if ((Object.keys(inputObject[connectorName]?.flows[flowType]?.paymentsResponse).length !== 0)) {
            nestedStructs3 = inputObject[connectorName]?.flows[flowType].paymentsResponse && generatedResponseVariables(inputObject[connectorName]?.flows[flowType].paymentsResponse, `item.response`);
        }


        // tryFromsArray.push(generateTryFroms(flowType, nestedStructs2, nestedStructs3));
        tryFromsArray.push(generateTryFroms(flowType, nestedStructs2, inputObject[connectorName]?.flows[flowType].hsResponse));

        // printTemplateCode(nestedStructs2, nestedStructs3, connectorAuthCode, attemptStatusMapping);
    });
    // const nestedStructs = generateNestedStructs(inputObject[connectorName]?.body, connectorName);
    // const nestedStructs2 = generateNestedInitStructs(inputObject[connectorName]?.body.paymentsRequest, `${toPascalCase(connectorName)}PaymentsRequest`);
    // const nestedStructs3 = inputObject[connectorName]?.body.paymentsResponse && generatedResponseVariables(inputObject[connectorName]?.body.paymentsResponse, `item.response`);


    // console.log(`#### ${nestedStructs3.join('\n')}`);
    // console.log(`${[...nestedStructsMap.values()]}`);
    // console.log(`${[...structOccurrences.values()]}`);
    let connectorTemplateCode = '';
    if (!refundFlag) {
        connectorTemplateCode = connectorTemplate;
        refundStatusMapping = '';
    }
    return printTemplateCode(connectorAuthCode, connectorAmount, tryFromsArray, connectorTemplateCode, attemptStatusMapping, refundStatusMapping);
    // console.log(nestedStructs2.join('\n'))

    // return nestedStructs.join('\n');
    // return 0;
};

// Test case with nested structures
const inputJson = `
{
    "checkout": {
        "body":{
            "paymentsRequest": {
                "source": {
                    "type": "card",
                    "card": {
                        "number": "4111111111111111",
                        "expMonth": 10,
                        "expYear": 2023,
                        "cvv": 123
                    }
                },
                "amount": 6500,
                "currency": "USD",
                "processing_channel_id": "pc_ovo75iz4hdyudnx6tu74mum3fq",
                "reference": "ORD-5023-4E89",
                "metadata": {
                    "udf1": "TEST123",
                    "coupon_code": "NY2018",
                    "partner_id": 123989
                },
                "customer":{
                    "email": "ams@gmail.com"
                }
            },
            "paymentsResponse" : {
                "id": "char_B2HjKLBZl6lz6JLCeglyAi8t",
                "objectType": "charge",
                "amount": 499,
                "amountRefunded": 0,
                "currency": "EUR",
                "description": "asdasd",
                "card": {
                  "id": "card_2I5UIYmUMvKPeBfgdY3R8CTI",
                  "cardholderName": "john",
                  "brand": "Visa",
                  "type": "Credit Card",
                  "country": "CH"
                },
                "captured": true,
                "refunded": false,
                "disputed": false,
                "fraudDetails": {
                  "status": "in_progress"
                },
                "status": "successful",
                "clientObjectId": "client_char_5jxlhatBdid2UyyoOqctrXqu"
            }
        }
    }
}
`;

const inputJson2 = `{
    "paymentsRequest": {
        "source":{
            "value":{
                "type": {"value": "card", "isOption": false, "isSecret": false, "type": "String"},
                "number": {"value": "$card_number", "isOption": false, "isSecret": false, "type": "CardNumber"},
                "expiry_month": {"value": "$card_exp_month", "isOption": false, "isSecret": true, "type": "String"},
                "expiry_year": {"value": "$card_exp_year", "isOption": false, "isSecret": true, "type": "String"},
                "name": {"value": "$card_holder_name", "isOption": false, "isSecret": true, "type": "String"},
                "cvv": {"value": "$card_cvc", "isOption": false, "isSecret": true, "type": "String"}
            },
            "isOption": false,
            "isSecret": false,
            "type": "Object"
        },
        "amount": {"value": "$amount", "isOption": false, "isSecret": false, "type": "i64"},
        "currency": {"value": "$currency", "isOption": false, "isSecret": false, "type": "Currency"},
        "capture": {"value": "true", "isOption": false, "isSecret": false, "type": "bool"}
    }
}`;

// const generatedCode = generateRustCode(inputJson, inputJson2);
