import React, { useEffect, useState, useRef } from 'react';
import handlebars from 'handlebars';
import { ConnectorCommon, ConnectorIntegration, ConnectorWebhook } from 'templates/ConnectorIntegration';
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs"; // Import a suitable style for SyntaxHighlighter
import copy from "copy-to-clipboard"; // Import the copy-to-clipboard library

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
        http_method: 'Post',
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: []
      }, 'PSync': {
        trait_name: 'api::PSync',
        data_type: 'types::PaymentsSyncData',
        router_type: 'types::PaymentsSyncRouterData',
        response_data: 'types::PaymentsResponseData',
        router_data_type: 'RouterData',
        http_method: 'Get',
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
        http_method: 'Post',
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
        http_method: 'Post',
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
        http_method: 'Get',
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
  const findCommonHeaders = (data) => {
    let maxHeaders = [];
    let maxHeadersCount = 0;

    for (const key in data) {
      if (data[key].headers && data[key].headers.length > maxHeadersCount) {
        maxHeaders = data[key].headers;
        maxHeadersCount = data[key].headers.length;
      }
    }
    return maxHeaders;
  }
  const build_auth_header_key = (data) => {
    if ('auth_type_api_key'.includes(data)) {
      return "auth.api_key.into_masked()";
    }
    else if ('auth_type_api_key'.includes(data)) {
      return "auth.api_key.into_masked()";
    }
    else if ('auth_type_key1'.includes(data)) {
      return "auth.key1.into_masked()";
    }
    else if ('auth_type_secret_key'.includes(data)) {
      return "auth.secret_key.into_masked()";
    }
    else if ('auth_type_key2'.includes(data)) {
      return "auth.key2.into_masked()";
    }
    else if ('auth_type_base_64_encode_api_key_colon_key1'.includes(data)) {
      return 'format!("{}", consts::BASE64_ENGINE.encode(format!("{}:{}", auth.api_key.peek(), auth.key1.peek()))).into_masked()'
    }
    else if ('auth_type_base_64_encode_key1_colon_api_key'.includes(data)) {
      return 'format!("{}", consts::BASE64_ENGINE.encode(format!("{}:{}", auth.key1.peek(), auth.api_key.peek()))).into_masked()'
    }
    return '';
  }
  const get_auth_header_key = (data) => {
    if(data === 'Authorization') return 'headers.AUTHORIZATION';
    if(data === 'X-API-KEY') return 'headers.X_API_KEY';
    if(data === 'API-KEY') return 'headers.API_KEY';
    if(data === 'apikey') return 'headers.APIKEY';
    if(data === 'X-CC-Api-Key') return 'headers.X_CC_API_KEY';
    if(data === 'X-Trans-Key') return 'headers.X_TRANS_KEY';
    return data;
  }
  const build_auth_headers = (data) => {
    for (const key in data) {
      let auth_value = build_auth_header_key(data[key]);
      if(auth_value){
        return {
          header_auth_key: get_auth_header_key(key),
          header_auth_value: auth_value
        }
      }
    }
    return {};
  }
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
          headers: findCommonHeaders(props.flows),
          content_type: props.content_type,
          ...build_auth_headers(props.flows)
        }) +
        Object.values(flows).map((flow) => template(flow)).join("\n")
        + connector_webhook_template({
          struct_name: toPascalCase(props.connector),
        });
      setGeneratedCode(renderedTemplate);
    }
  }, [templateContent, context]);

  const [isCopied, setIsCopied] = useState(false);
   // Function to handle the "Copy to Clipboard" button click event
   const handleCopyClick = () => {
    copy(generatedCode);
    setIsCopied(true);
    // Reset the "Copied to clipboard" notification after a short delay
    setTimeout(() => {
      setIsCopied(false);
    }, 500);
  };

  return (
    <div>
      <h3>Connectors.rs </h3>
      <div data-testid="generated-code">
        <button onClick={handleCopyClick}>Copy to Clipboard</button>
      {isCopied && <span style={{ marginLeft: '10px', color: 'green' }}>Copied to clipboard!</span>}
      <SyntaxHighlighter language="rust" style={githubGist}>
          {generatedCode}</SyntaxHighlighter>
      </div>
    </div>
  );
};

export default ConnectorTemplate;
