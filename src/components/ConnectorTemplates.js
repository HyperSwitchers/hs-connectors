import React, { useEffect, useState } from 'react';
import handlebars from 'handlebars';
import { ConnectorCommon, ConnectorIntegration, ConnectorWebhook } from 'templates/ConnectorIntegration';
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";

function toPascalCase(str) {
  return str
    .split(/\s|_|-/g) // Split by whitespace, underscore, or hyphen
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export const defaultConnectorProps = (connector) => {
  let connectorPascalCase = toPascalCase(connector);
  return {
    connector: connector,
    url: '',
    content_type: '',
    flows: {
      'PaymentMethodToken': {
        trait_name: 'api::PaymentMethodToken',
        data_type: 'types::PaymentMethodTokenizationData',
        response_data: 'types::PaymentsResponseData',
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: []
      },
      'AccessTokenAuth': {
        trait_name: 'api::AccessTokenAuth',
        data_type: 'types::AccessTokenRequestData',
        response_data: 'types::AccessToken',
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: []
      },
      'Verify': {
        trait_name: 'api::Verify',
        data_type: 'types::VerifyRequestData',
        response_data: 'types::PaymentsResponseData',
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: []
      },
      'Authorize': {
        trait_name: 'api::Authorize',
        data_type: 'types::PaymentsAuthorizeData',
        router_type: 'types::PaymentsAuthorizeRouterData',
        request_type: 'PaymentRequest',
        response_type: 'PaymentResponse',
        router_data_type: 'RouterData',
        response_data: 'types::PaymentsResponseData',
        flow_type: 'types::PaymentsAuthorizeType',
        struct_name: connectorPascalCase,
        connector_name: connector,
        url_path: '',
        http_method: '',
        enabled: ['get_headers', 'get_content_type', 'get_url', 'build_request', 'handle_response', 'get_error_response']
      },
      'Void': {
        trait_name: 'api::Void',
        data_type: 'types::PaymentsCancelData',
        response_data: 'types::PaymentsResponseData',
        router_data_type: 'RouterData',
        flow_type: 'types::PaymentsVoidType',
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: []
      }, 'PSync': {
        trait_name: 'api::PSync',
        data_type: 'types::PaymentsSyncData',
        router_type: 'types::PaymentsSyncRouterData',
        response_data: 'types::PaymentsResponseData',
        router_data_type: 'RouterData',
        flow_type: 'types::PaymentsSyncType',
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: ['get_headers', 'get_content_type', 'get_url', 'build_request', 'handle_response', 'get_error_response']
      }, 'Capture': {
        trait_name: 'api::Capture',
        data_type: 'types::PaymentsCaptureData',
        router_type: `types::PaymentsCaptureRouterData`,
        router_data_type: 'RouterData',
        response_data: 'types::PaymentsResponseData',
        flow_type: 'types::PaymentsCaptureType',
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: ['get_headers', 'get_content_type', 'get_url', 'build_request', 'handle_response', 'get_error_response']
      }, 'Session': {
        trait_name: 'api::Session',
        data_type: 'types::PaymentsSessionData',
        response_data: 'types::PaymentsResponseData',
        router_type: 'types::PaymentsSyncRouterData',
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: []
      }, 'Execute': {
        trait_name: 'api::Execute',
        data_type: 'types::RefundsData',
        router_type: `types::RefundsRouterData<api::Execute>`,
        request_type: 'RefundRequest',
        response_type: 'RefundResponse',
        router_data_type: 'RefundsRouterData',
        response_data: 'types::RefundsResponseData',
        flow_type: 'types::RefundExecuteType',
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: ['get_headers', 'get_content_type', 'get_url', 'build_request', 'handle_response', 'get_error_response']
      }, 'RSync': {
        trait_name: 'api::RSync',
        data_type: 'types::RefundsData',
        router_type: `types::RefundSyncRouterData`,
        request_type: 'RefundRequest',
        response_type: 'RefundResponse',
        router_data_type: 'RefundsRouterData',
        response_data: 'types::RefundsResponseData',
        flow_type: 'types::RefundSyncType',
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: ['get_headers', 'get_content_type', 'get_url', 'build_request', 'handle_response', 'get_error_response']
      }
    }
  }
};

const ConnectorTemplate = ({ context = {
  trait_name: 'api::PSync',
  data_type: 'types::PaymentsSyncData',
  router_type: 'types::PaymentsSyncRouterData',
  response_data: 'types::PaymentsResponseData',
  struct_name: 'Shift4',
  connector_name: 'shift4'
} }) => {
  const [templateContent] = useState(ConnectorIntegration);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    if (templateContent) {
      const template = handlebars.compile(ConnectorIntegration);
      const connector_common_template = handlebars.compile(ConnectorCommon);
      const connector_webhook_template = handlebars.compile(ConnectorWebhook);
      const connector = localStorage.connector || 'tttt';
      const props = localStorage.props ? JSON.parse(localStorage.props) : defaultConnectorProps(connector);
      const flows = props.flows;
      const renderedTemplate =
        connector_common_template({
          struct_name: toPascalCase(props.connector),
          connector_name: props.connector,
          headers: props.headers,
          content_type: props.content_type
        }) +
        Object.values(flows).map((flow) => template(flow)).join("\n")
        + connector_webhook_template({
          struct_name: toPascalCase(props.connector),
        });
      setGeneratedCode(renderedTemplate);
    }
  }, [templateContent]);

  return (
    <div>
      <h3>Connectors.rs </h3>
      <div data-testid="generated-code">
      <SyntaxHighlighter language="rust">
        {generatedCode}</SyntaxHighlighter>
      </div>
    </div>
  );
};

export default ConnectorTemplate;
