import React from 'react';
import { render, screen } from '@testing-library/react';
import ConnectorTemplates from './ConnectorTemplates';

test('should render connector integration trait for Authorize', () => {
  render(
    <ConnectorTemplates
      context={{
        trait_name: 'api::Authorize',
        data_type: 'types::PaymentsAuthorizeData',
        router_type: 'types::PaymentsAuthorizeRouterData',
        request_type: 'PaymentRequest',
        response_type: 'PaymentResponse',
        router_data_type: 'RouterData',
        response_data: 'types::PaymentsResponseData',
        flow_type: 'types::PaymentsAuthorizeType',
        struct_name: 'Shift4',
        connector_name: 'shift4',
      }}
    />
  );

  // Assert that the component renders
  expect(screen.getByTestId('generated-code')).toBeInTheDocument();

  // Assert that the generated code is present
  const generatedCodeElement = screen.getByTestId('generated-code');
  let expected = `impl ConnectorIntegration<api::Authorize, types::PaymentsAuthorizeData, types::PaymentsResponseData> for Shift4 { fn get_headers( &self, req: &types::PaymentsAuthorizeRouterData, connectors: &settings::Connectors, ) -> CustomResult<Vec<(String, request::Maskable<String>)>, errors::ConnectorError> { self.build_headers(req, connectors) } fn get_content_type(&self) -> &'static str { self.common_get_content_type() } fn get_url(&self, _req: &types::PaymentsAuthorizeRouterData, _connectors: &settings::Connectors,) -> CustomResult<String,errors::ConnectorError> { Err(errors::ConnectorError::NotImplemented("get_url method".to_string()).into()) } fn get_request_body(&self, req: &types::PaymentsAuthorizeRouterData) -> CustomResult<Option<types::RequestBody>, errors::ConnectorError> { let req_obj = shift4::Shift4PaymentRequest::try_from(req)?; let shift4_req = types::RequestBody::log_and_get_request_body(&req_obj, utils::Encode::<shift4::Shift4PaymentRequest>::encode_to_string_of_json) .change_context(errors::ConnectorError::RequestEncodingFailed)?; Ok(Some(shift4_req)) } fn build_request( &self, req: &types::PaymentsAuthorizeRouterData, connectors: &settings::Connectors, ) -> CustomResult<Option<services::Request>, errors::ConnectorError> { Ok(Some( services::RequestBuilder::new() .method(services::Method::Post) .url(&types::PaymentsAuthorizeType::get_url( self, req, connectors, )?) .attach_default_headers() .headers(types::PaymentsAuthorizeType::get_headers( self, req, connectors, )?) .body(types::PaymentsAuthorizeType::get_request_body(self, req)?) .build(), )) } fn handle_response( &self, data: &types::PaymentsAuthorizeRouterData, res: types::Response, ) -> CustomResult<types::PaymentsAuthorizeRouterData,errors::ConnectorError> { let response: shift4::Shift4PaymentResponse = res.response.parse_struct("Shift4PaymentResponse").change_context(errors::ConnectorError::ResponseDeserializationFailed)?; types::::try_from(types::ResponseRouterData { response, data: data.clone(), http_code: res.status_code, }) } fn get_error_response(&self, res: types::Response) -> CustomResult<ErrorResponse,errors::ConnectorError> { self.build_error_response(res) } }`;
  expect(generatedCodeElement).toHaveTextContent('Generated Code:' + expected);
});

it('should render connector integration trait for Payment sync', () => {
  render(
    <ConnectorTemplates
      context={{
        trait_name: 'api::PSync',
        data_type: 'types::PaymentsSyncData',
        router_type: 'types::PaymentsSyncRouterData',
        response_data: 'types::PaymentsResponseData',
        struct_name: 'Shift4',
        connector_name: 'shift4',
      }}
    />
  );

  // Assert that the component renders
  expect(screen.getByTestId('generated-code')).toBeInTheDocument();

  // Assert that the generated code is present
  const generatedCodeElement = screen.getByTestId('generated-code');
  let expected = `impl ConnectorIntegration<api::PSync, types::PaymentsSyncData, types::PaymentsResponseData> for Shift4 { fn get_headers( &self, req: &types::PaymentsSyncRouterData, connectors: &settings::Connectors, ) -> CustomResult<Vec<(String, request::Maskable<String>)>, errors::ConnectorError> { self.build_headers(req, connectors) } fn get_content_type(&self) -> &'static str { self.common_get_content_type() } fn get_url(&self, _req: &types::PaymentsSyncRouterData, _connectors: &settings::Connectors,) -> CustomResult<String,errors::ConnectorError> { Err(errors::ConnectorError::NotImplemented("get_url method".to_string()).into()) } fn get_request_body(&self, req: &types::PaymentsSyncRouterData) -> CustomResult<Option<types::RequestBody>, errors::ConnectorError> { let req_obj = shift4::Shift4::try_from(req)?; let shift4_req = types::RequestBody::log_and_get_request_body(&req_obj, utils::Encode::<shift4::Shift4>::encode_to_string_of_json) .change_context(errors::ConnectorError::RequestEncodingFailed)?; Ok(Some(shift4_req)) } fn build_request( &self, req: &types::PaymentsSyncRouterData, connectors: &settings::Connectors, ) -> CustomResult<Option<services::Request>, errors::ConnectorError> { Ok(Some( services::RequestBuilder::new() .method(services::Method::Post) .url(&::get_url( self, req, connectors, )?) .attach_default_headers() .headers(::get_headers( self, req, connectors, )?) .body(::get_request_body(self, req)?) .build(), )) } fn handle_response( &self, data: &types::PaymentsSyncRouterData, res: types::Response, ) -> CustomResult<types::PaymentsSyncRouterData,errors::ConnectorError> { let response: shift4::Shift4 = res.response.parse_struct("Shift4").change_context(errors::ConnectorError::ResponseDeserializationFailed)?; types::::try_from(types::ResponseRouterData { response, data: data.clone(), http_code: res.status_code, }) } fn get_error_response(&self, res: types::Response) -> CustomResult<ErrorResponse,errors::ConnectorError> { self.build_error_response(res) } }`;
  expect(generatedCodeElement).toHaveTextContent('Generated Code:' + expected);
});

it('should render connector integration trait for Refund execute', () => {
  render(
    <ConnectorTemplates
      context={{
        trait_name: 'api::Execute',
        data_type: 'types::RefundsData',
        router_type: `types::RefundsRouterData<api::Execute>`,
        request_type: 'RefundRequest',
        response_type: 'RefundResponse',
        router_data_type: 'RefundsRouterData',
        response_data: 'types::RefundsResponseData',
        flow_type: 'types::RefundExecuteType',
        struct_name: 'Shift4',
        connector_name: 'shift4',
      }}
    />
  );

  // Assert that the component renders
  expect(screen.getByTestId('generated-code')).toBeInTheDocument();

  // Assert that the generated code is present
  const generatedCodeElement = screen.getByTestId('generated-code');
  let expected = `impl ConnectorIntegration<api::Execute, types::RefundsData, types::RefundsResponseData> for Shift4 { fn get_headers( &self, req: &types::RefundsRouterData<api::Execute>, connectors: &settings::Connectors, ) -> CustomResult<Vec<(String, request::Maskable<String>)>, errors::ConnectorError> { self.build_headers(req, connectors) } fn get_content_type(&self) -> &'static str { self.common_get_content_type() } fn get_url(&self, _req: &types::RefundsRouterData<api::Execute>, _connectors: &settings::Connectors,) -> CustomResult<String,errors::ConnectorError> { Err(errors::ConnectorError::NotImplemented("get_url method".to_string()).into()) } fn get_request_body(&self, req: &types::RefundsRouterData<api::Execute>) -> CustomResult<Option<types::RequestBody>, errors::ConnectorError> { let req_obj = shift4::Shift4RefundRequest::try_from(req)?; let shift4_req = types::RequestBody::log_and_get_request_body(&req_obj, utils::Encode::<shift4::Shift4RefundRequest>::encode_to_string_of_json) .change_context(errors::ConnectorError::RequestEncodingFailed)?; Ok(Some(shift4_req)) } fn build_request( &self, req: &types::RefundsRouterData<api::Execute>, connectors: &settings::Connectors, ) -> CustomResult<Option<services::Request>, errors::ConnectorError> { Ok(Some( services::RequestBuilder::new() .method(services::Method::Post) .url(&types::RefundExecuteType::get_url( self, req, connectors, )?) .attach_default_headers() .headers(types::RefundExecuteType::get_headers( self, req, connectors, )?) .body(types::RefundExecuteType::get_request_body(self, req)?) .build(), )) } fn handle_response( &self, data: &types::RefundsRouterData<api::Execute>, res: types::Response, ) -> CustomResult<types::RefundsRouterData<api::Execute>,errors::ConnectorError> { let response: shift4::Shift4RefundResponse = res.response.parse_struct("Shift4RefundResponse").change_context(errors::ConnectorError::ResponseDeserializationFailed)?; types::::try_from(types::ResponseRouterData { response, data: data.clone(), http_code: res.status_code, }) } fn get_error_response(&self, res: types::Response) -> CustomResult<ErrorResponse,errors::ConnectorError> { self.build_error_response(res) } }`;
  expect(generatedCodeElement).toHaveTextContent('Generated Code:' + expected);
});
