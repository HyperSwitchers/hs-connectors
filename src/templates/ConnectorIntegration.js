import handlebars from 'handlebars';
handlebars.registerHelper('contains', function (array, value, options) {
    if (Array.isArray(array) && array.includes(value)) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
export const ConnectorCommon = `
pub mod transformers;

use std::fmt::Debug;
use common_utils::request::RequestContent;
use error_stack::{IntoReport, ResultExt};
use masking::ExposeInterface;
use transformers as {{connector_name}};

use diesel_models::enums;
use crate::{
    configs::settings,
    core::errors::{self, CustomResult},
    headers,
    services::{
        self,
        request::{self, Mask},
        ConnectorIntegration, ConnectorValidation
    },
    types::{
        self,
        api::{self, ConnectorCommon, ConnectorCommonExt},
        ErrorResponse, Response,
    },
    utils::{self, BytesExt},
};

#[derive(Debug, Clone)]
pub struct {{struct_name}};

impl api::Payment for {{struct_name}} {}
impl api::PaymentSession for {{struct_name}} {}
impl api::ConnectorAccessToken for {{struct_name}} {}
impl api::MandateSetup for {{struct_name}} {}
impl api::PaymentAuthorize for {{struct_name}} {}
impl api::PaymentSync for {{struct_name}} {}
impl api::PaymentCapture for {{struct_name}} {}
impl api::PaymentVoid for {{struct_name}} {}
impl api::Refund for {{struct_name}} {}
impl api::RefundExecute for {{struct_name}} {}
impl api::RefundSync for {{struct_name}} {}
impl api::PaymentToken for {{struct_name}} {}
impl<Flow, Request, Response> ConnectorCommonExt<Flow, Request, Response> for {{struct_name}}
where
    Self: ConnectorIntegration<Flow, Request, Response>,
{
    fn build_headers(
        &self,
        req: &types::RouterData<Flow, Request, Response>,
        _connectors: &settings::Connectors,
    ) -> CustomResult<Vec<(String, request::Maskable<String>)>, errors::ConnectorError> {

        let mut headers = vec![
            {{#contains headers "content_type"}}
            (
                headers::CONTENT_TYPE.to_string(),
                Self::get_content_type(self).to_string().into(),
            )
            {{/contains}}
            {{#contains headers "accept"}}
            (
                headers::ACCEPT.to_string(),
                Self::get_content_type(self).to_string().into(),
            )
            {{/contains}}
        ];
        {{#contains headers "authorization"}}
        let mut api_key = self.get_auth_header(&req.connector_auth_type)?;
        headers.append(&mut api_key);
        {{/contains}}
        Ok(headers)
    }
}
impl ConnectorCommon for {{struct_name}} {
    fn id(&self) -> &'static str {
        "{{connector_name}}"
    }

    fn common_get_content_type(&self) -> &'static str {
        "{{content_type}}"
    }

    fn get_currency_unit(&self) -> api::CurrencyUnit {
        todo!()
        //    TODO! Check connector documentation, on which unit they are processing the currency.
        //    If the connector accepts amount in lower unit ( i.e cents for USD) then return api::CurrencyUnit::Minor,
        //    if connector accepts amount in base unit (i.e dollars for USD) then return api::CurrencyUnit::Base
    }

    fn base_url<'a>(&self, connectors: &'a settings::Connectors) -> &'a str {
        connectors.{{connector_name}}.base_url.as_ref()
    }

    fn get_auth_header(
        &self,
        auth_type: &types::ConnectorAuthType,
    ) -> CustomResult<Vec<(String, request::Maskable<String>)>, errors::ConnectorError> {
        let auth = {{connector_name}}::{{struct_name}}AuthType::try_from(auth_type)
            .change_context(errors::ConnectorError::FailedToObtainAuthType)?;
        Ok(vec![(
            {{{header_auth_key}}},
            {{{header_auth_value}}},
        )])
    }

    fn build_error_response(
        &self,
        res: Response,
    ) -> CustomResult<ErrorResponse, errors::ConnectorError> {
        let response: {{connector_name}}::ErrorResponse =
            res.response
                .parse_struct("ErrorResponse")
                .change_context(errors::ConnectorError::ResponseDeserializationFailed)?;

        Ok(ErrorResponse {
            status_code: res.status_code,
            code: response.code,
            message: response.message,
            reason: response.reason,
            attempt_status: None,
            connector_transaction_id: None,
        })
    }
}

impl ConnectorValidation for {{struct_name}} {
    fn validate_capture_method(
        &self,
        capture_method: Option<enums::CaptureMethod>,
    ) -> CustomResult<(), errors::ConnectorError> {
        let capture_method = capture_method.unwrap_or_default();
        match capture_method {
            enums::CaptureMethod::Automatic | enums::CaptureMethod::Manual => Ok(()),
            enums::CaptureMethod::ManualMultiple | enums::CaptureMethod::Scheduled => Err(
                super::utils::construct_not_supported_error_report(capture_method, self.id()),
            ),
        }
    }
}
`

export const ConnectorIntegration = `impl ConnectorIntegration<{{trait_name}}, {{data_type}}, {{response_data}}> for {{struct_name}} {
    {{#contains enabled "get_headers"}}
    fn get_headers(
        &self,
        req: &{{{router_type}}},
        connectors: &settings::Connectors,
    ) -> CustomResult<Vec<(String, request::Maskable<String>)>, errors::ConnectorError> {
        self.build_headers(req, connectors)
    }
    {{/contains}}
    {{#contains enabled "get_content_type"}}
    fn get_content_type(&self) -> &'static str {
        self.common_get_content_type()
    }
    {{/contains}}
    {{#contains enabled "get_url"}}
    fn get_url(&self, req: &{{{router_type}}}, connectors: &settings::Connectors,) -> CustomResult<String,errors::ConnectorError> {
        {{#if url_path}}
            Ok(format!(
                "{}{{url_path}}",
                self.base_url(connectors)
            ))
        {{else}}
            Err(errors::ConnectorError::NotImplemented("get_url method".to_string()).into())
        {{/if}}
    }
    {{/contains}}
    {{#contains enabled "get_request_body"}}
        fn get_request_body(&self, req: &{{{router_type}}}, _connectors: &settings::Connectors,) -> CustomResult<RequestContent, errors::ConnectorError> {
        {{#contains enabled "convert_router_amount"}} 
        let connector_router_data = {{connector_name}}::{{struct_name}}RouterData::try_from((
            &self.get_currency_unit(),
            req.request.currency,
            {{#if refund_amount}}
            req.request.refund_amount,
            {{else}}
            req.request.amount,
            {{/if}}
            req,
        ))?;
        let req_obj = {{connector_name}}::{{struct_name}}{{request_type}}::try_from(&connector_router_data)?;
        {{else}}
        let req_obj = {{connector_name}}::{{struct_name}}{{request_type}}::try_from(req)?;
        {{/contains}}
        Ok(RequestContent::Json(Box::new(req_obj)))
    }
    {{/contains}}
    {{#contains enabled "build_request"}}
    fn build_request(
        &self,
        req: &{{{router_type}}},
        connectors: &settings::Connectors,
    ) -> CustomResult<Option<services::Request>, errors::ConnectorError> {
        Ok(Some(
            services::RequestBuilder::new()
                .method(services::Method::{{http_method}})
                .url(&{{flow_type}}::get_url(
                    self, req, connectors,
                )?)
                .attach_default_headers()
                .headers({{flow_type}}::get_headers(
                    self, req, connectors,
                )?)
                {{#contains enabled "get_request_body"}}
                .set_body({{flow_type}}::get_request_body(
                    self, req, connectors,
                )?)
                {{/contains}}
                .build(),
        ))
    }
    {{/contains}}
    {{#contains enabled "handle_response"}}
    fn handle_response(
        &self,
        data: &{{{router_type}}},
        res: Response,
    ) -> CustomResult<{{{router_type}}},errors::ConnectorError> {
        let response: {{connector_name}}::{{struct_name}}{{response_type}} = res.response.parse_struct("{{struct_name}}{{response_type}}").change_context(errors::ConnectorError::ResponseDeserializationFailed)?;
        types::{{router_data_type}}::try_from(types::ResponseRouterData {
            response,
            data: data.clone(),
            http_code: res.status_code,
        })
    }
    {{/contains}}
    {{#contains enabled "get_error_response"}}
    fn get_error_response(&self, res: Response) -> CustomResult<ErrorResponse,errors::ConnectorError> {
        self.build_error_response(res)
    }
    {{/contains}}
}

`;

export const ConnectorWebhook = `
#[async_trait::async_trait]
impl api::IncomingWebhook for {{struct_name}} {
    fn get_webhook_object_reference_id(
        &self,
        _request: &api::IncomingWebhookRequestDetails<'_>,
    ) -> CustomResult<api::webhooks::ObjectReferenceId, errors::ConnectorError> {
        Err(errors::ConnectorError::WebhooksNotImplemented).into_report()
    }

    fn get_webhook_event_type(
        &self,
        _request: &api::IncomingWebhookRequestDetails<'_>,
    ) -> CustomResult<api::IncomingWebhookEvent, errors::ConnectorError> {
        Err(errors::ConnectorError::WebhooksNotImplemented).into_report()
    }

    fn get_webhook_resource_object(
        &self,
        _request: &api::IncomingWebhookRequestDetails<'_>,
    ) -> CustomResult<Box<dyn masking::ErasedMaskSerialize>, errors::ConnectorError> {
        Err(errors::ConnectorError::WebhooksNotImplemented).into_report()
    }
}`;