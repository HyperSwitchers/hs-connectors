const nestedStructsMap = new Map();
const structOccurrences = new Map();
var nestedFields = {}
var connectorName = localStorage.props.connector;
// const c_name = localStorage.props.connector;

const connectorImports = `use api_models::payments::Card;
use serde::{Deserialize, Serialize};
use cards::CardNumber;
use masking::Secret;
use crate::{connector::utils::PaymentsAuthorizeRequestData,core::errors,types::{self,api, storage::enums::{self, Currency}}};`;

const connectorAuthType = `//TODO: Fill the struct with respective fields
// Auth Struct
pub struct CheckoutAuthType {
    pub(super) api_key: Secret<String>,
    pub(super) processing_channel_id: Secret<String>,
    pub(super) api_secret: Secret<String>,
}

impl TryFrom<&types::ConnectorAuthType> for CheckoutAuthType {
    type Error = error_stack::Report<errors::ConnectorError>;
    fn try_from(auth_type: &types::ConnectorAuthType) -> Result<Self, Self::Error> {
        if let types::ConnectorAuthType::SignatureKey {
            api_key,
            api_secret,
            key1,
        } = auth_type
        {
            Ok(Self {
                api_key: api_key.to_owned(),
                api_secret: api_secret.to_owned(),
                processing_channel_id: key1.to_owned(),
            })
        } else {
            Err(errors::ConnectorError::FailedToObtainAuthType.into())
        }
    }
}`;


const connectorTemplate = `// PaymentsResponse
//TODO: Append the remaining status flags
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ${connectorName}PaymentStatus {
    Succeeded,
    Failed,
    #[default]
    Processing,
}

impl From<${connectorName}PaymentStatus> for enums::AttemptStatus {
    fn from(item: ${connectorName}PaymentStatus) -> Self {
        match item {
            ${connectorName}PaymentStatus::Succeeded => Self::Charged,
            ${connectorName}PaymentStatus::Failed => Self::Failure,
            ${connectorName}PaymentStatus::Processing => Self::Authorizing,
        }
    }
}

//TODO: Fill the struct with respective fields
#[derive(Default, Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ${connectorName}PaymentsResponse {
    status: ${connectorName}PaymentStatus,
    id: String,
}

impl<F,T> TryFrom<types::ResponseRouterData<F, ${connectorName}PaymentsResponse, T, types::PaymentsResponseData>> for types::RouterData<F, T, types::PaymentsResponseData> {
    type Error = error_stack::Report<errors::ConnectorError>;
    fn try_from(item: types::ResponseRouterData<F, ${connectorName}PaymentsResponse, T, types::PaymentsResponseData>) -> Result<Self,Self::Error> {
        Ok(Self {
            status: enums::AttemptStatus::from(item.response.status),
            response: Ok(types::PaymentsResponseData::TransactionResponse {
                resource_id: types::ResponseId::ConnectorTransactionId(item.response.id),
                redirection_data: None,
                mandate_reference: None,
                connector_metadata: None,
                network_txn_id: None,
                connector_response_reference_id: None,
            }),
            ..item.data
        })
    }
}

//TODO: Fill the struct with respective fields
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

const paymentsRequestTryFrom = `impl TryFrom<&types::PaymentsAuthorizeRouterData> for ${connectorName}PaymentsRequest {
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
// Define the replacements for dynamic values
const replacements = {
    amount_i64: "item.request.amount",
    amount_decimal_String: "item.request.amount",
    amount_base_String: "item.request.amount.to_string()",
    card_number_String: `ccard.card_number.clone()`,
    card_number_CardNumber: `ccard.card_number.clone()`,
    card_exp_month_String: "ccard.card_exp_month.clone()",
    card_exp_year_String: "ccard.card_exp_year.clone()",
    card_cvc_String: "ccard.card_cvc.clone()",
    card_holder_name: "ccard.card.card_holder_name.clone()",
    currency_Currency: "item.request.currency",
    description: `item.request.description`,
    email: `item.request.get_email()?`,
};

function toSnakeCase(str) {
    return str ? str.replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\-]+/g, '_')
        .toLowerCase() : ''
}
// function toSnakeCase(str) {
//     return str ? str.replace(/[A-Z]/g, (letter, index) => (index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`)) : '';
// }

function toPascalCase(str) {
    return str
        ? str.replace(/(?:^|_)([a-z0-9])/g, (_, letter) => letter.toUpperCase())
        : '';
}

function removeQuotes(jsonString) {
    let res = jsonString.replace(/\"([a-z]+?(\.|_)+.*?)\"/g, "$1");
    let res2 = res.replace(/\"\"/g, "");
    return res2.replace(/"([^"]+)":/g, '$1:');
}

function typeReplacement(fieldTypeValue) {
    if (fieldTypeValue?.toLowerCase() == "base_string" || fieldTypeValue?.toLowerCase() == "decimal_string") {
        return 'String';
    }
    else {
        return fieldTypeValue;
    }
}

function generateRustStructField(fieldName, fieldValue, parentName) {
    let fieldType = typeReplacement(fieldValue.type);

    if (Array.isArray(fieldValue.value)) {
        // fieldType = `Vec<${toPascalCase(`${parentName}_${fieldName}`)}>`;
        let fieldValueItem = fieldValue.value[0];
        // console.log(`$$$$$JSON.stringify(fieldValueItem)`);
        if (typeof fieldValueItem.value === 'object') {
            const structName = toPascalCase(`${parentName}_${fieldName}_item`);
            fieldType = `${structName}`;
            if (fieldValueItem.isSecret) {
                fieldType = `Secret<${fieldType}>`
            }
            if (fieldValueItem.isOption) {
                fieldType = `Option<${fieldType}>`
            }
            fieldType = `Vec<${fieldType}>`;
            const structFields = Object.entries(fieldValueItem.value);
            if (!nestedStructsMap.has(structName)) {
                nestedStructsMap.set(structName, generateRustStruct(structName, structFields));
            }
        } else {
            fieldType = `Vec<${typeReplacement(fieldValueItem.type)}>`;
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
        fieldType = typeReplacement(fieldValue.type);
    }


    if (fieldValue.isSecret) {
        fieldType = `Secret<${fieldType}>`
    }
    if (fieldValue.isOption) {
        fieldType = `Option<${fieldType}>`
    }

    if (fieldName == "type") {
        fieldName = `${parentName}_${fieldName}`
        return `    #[serde(rename = "type")]
    pub ${toSnakeCase(fieldName)}: ${fieldType},`;
    }
    return `    pub ${toSnakeCase(fieldName)}: ${fieldType},`;
}

function shouldAddCamelCaseHeader(fields) {
    return fields.some((field) => /^[a-z]/.test(field)) && fields.some((field) => /^[A-Z]/.test(field));
}


//(Name of the Struct, Array of [key, values] of fields inside that struct)
function generateRustStruct(name, fields) {
    let structFields = fields.map(([fieldName, fieldValue]) =>
        generateRustStructField(toSnakeCase(fieldName), fieldValue, name)
    );

    const header = shouldAddCamelCaseHeader(fields.map(([fieldName]) => fieldName))
        ? '#[serde(rename_all = "camelCase")]'
        : '';

    const rustStruct = `
${header}
#[derive(Default, Debug, Serialize, Deserialize)]
pub struct ${name} {
${structFields.join('\n')}
}
`;

    return rustStruct;
}

function generateNestedStructs(inputObject, parentName) {
    const structs = [];

    function processObject(inputObj, parentName) {
        // [[key, Value], [key, Value]]
        Object.entries(inputObj).forEach(([structName, structFields]) => {

            if (typeof structFields === 'object') {
                //Get [key, value] of nested objects, the map will return Array([key, value])
                const fields = Object.keys(structFields).map((fieldName) => [fieldName, structFields[fieldName]]);

                // Generate unique field names for nested structs
                const fullName = parentName ? `${parentName}_${structName}` : structName;
                const structDefinition = generateRustStruct(toPascalCase(fullName), fields);
                if (!nestedStructsMap.has(toPascalCase(fullName))) {
                    nestedStructsMap.set(toPascalCase(fullName), structDefinition);
                    structs.push(structDefinition);
                }
            } else {
                // If it's a primitive field, generate the field definition
                const rustStruct = `
    pub ${toSnakeCase(structName)}: String,`;
                structs.push(rustStruct);
            }
        });
    }

    processObject(inputObject, parentName);

    return structs;
}
function replaceDynamicFields(value, type) {
    if (typeof value === "string" && value.startsWith("$")) {
        // Extract the dynamic value name without the "$" prefix
        const dynamicValueName = value.substring(1);

        // Check if a replacement is available for the dynamic value
        const replacement = replacements[`${dynamicValueName}_${type}`] || value;

        // Store the replacement value for this field
        return replacement;
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
            if (typeof structFields.value === 'object') {
                //Get [key, value] of nested objects, the map will return Array([key, value])
                // const fields = Object.keys(structFields).map((fieldName) => [fieldName, structFields[fieldName]]);

                // // Generate unique field names for nested structs
                const fullName = parentName ? `${parentName}_${structName}` : structName;

                let internallyNestedFields = processObject(structFields.value, toPascalCase(fullName))
                // structs.push(`let ${toSnakeCase(fullName)} = ${toPascalCase(fullName)}${JSON.stringify(internallyNestedFields)};`);
                let variableValue = `${toPascalCase(fullName)}${removeQuotes(JSON.stringify(internallyNestedFields))}`;
                // if (structFields.isSecret) {
                //     variableValue = `$Secret::new(${variableValue})`
                // }
                // if (structFields.isOption) {
                //     variableValue = `Some(${variableValue})`
                // }
                structs.push(`let ${toSnakeCase(fullName)} = ${variableValue};`);
                nestedFields[toSnakeCase(structName)] = toSnakeCase(fullName)
            } else {
                // If it's a primitive field, generate the field definition
                if (structName == "type") {
                    structName = toSnakeCase(`${parentName}_${structName}`)
                }
                let variableValue = replaceDynamicFields(structFields.value, structFields.type);
                // if (structFields.isSecret) {
                //     variableValue = `$Secret::new(${variableValue})`
                // }
                // if (structFields.isOption) {
                //     variableValue = `Some(${variableValue})`
                // }
                nestedFields[toSnakeCase(structName)] = variableValue;
            }
        }) : '';

        return nestedFields;
    }
    const nestedFieldsStruct = processObject(inputObject, parentName);
    // console.log(`$$$$ ${JSON.stringify(nestedFieldsStruct)}`);
    // const structString = JSON.stringify(nestedFieldsStruct);
    const structString = removeQuotes(JSON.stringify(nestedFieldsStruct));
    structs.push(`let ${toSnakeCase(parentName)} = ${toPascalCase(parentName)}${structString};`)
    // console.log(structs.join('\n'))
    return structs;
}

function printTemplateCode(nestedStructs2) {
    let generatedTryFrom = `impl TryFrom<(&types::PaymentsAuthorizeRouterData, &Card)> for ${connectorName}PaymentsRequest {
        type Error = error_stack::Report<errors::ConnectorError>;
        fn try_from(value: (&types::PaymentsAuthorizeRouterData, &Card)) -> Result<Self, Self::Error> {
            let (item, ccard) = value;
            ${nestedStructs2.join('\n\t\t\t')}
            Ok(${connectorName.toLowerCase()}_payments_request)
        }
    }    `;

    let output = `${connectorImports}\n\n${[...nestedStructsMap.values()].join('')}\n${generatedTryFrom}\n${paymentsRequestTryFrom}\n\n${connectorTemplate}`;
    // let output = `${connectorImports}\n\n${connectorAuthType}\n\n${[...nestedStructsMap.values()].join('')}\n${generatedTryFrom}\n${paymentsRequestTryFrom}\n\n${connectorTemplate}`;
    // let output = `${[...nestedStructsMap.values()]}\n${generatedTryFrom}\n${paymentsRequestTryFrom}`;
    console.log(output);
    return output;
}

export const generateRustCode = (connector, inputJson2) => {
    // const inputObject = JSON.parse(inputJson);
    connectorName = connector;
    const inputObject2 = JSON.parse(inputJson2);
    const nestedStructs = generateNestedStructs(inputObject2[connectorName]?.body, connectorName);
    const nestedStructs2 = generateNestedInitStructs(inputObject2[connectorName]?.body.paymentsRequest, `${toPascalCase(connectorName)}PaymentsRequest`);
    // console.log(`${[...nestedStructsMap.values()]}`);
    // console.log(`${[...structOccurrences.values()]}`);
    return printTemplateCode(nestedStructs2);
    // console.log(nestedStructs2.join('\n'))

    // return nestedStructs.join('\n');
}

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
}`

// const generatedCode = generateRustCode(inputJson, inputJson2);