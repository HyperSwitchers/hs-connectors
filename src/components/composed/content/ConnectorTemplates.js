// @ts-check

import React, { useEffect, useState } from 'react';
import handlebars from 'handlebars';
import {
  ConnectorCommon,
  ConnectorIntegration,
  ConnectorWebhook,
} from 'templates/ConnectorIntegration';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs'; // Import a suitable style for SyntaxHighlighter
import copy from 'copy-to-clipboard'; // Import the copy-to-clipboard library
import { APP_CONTEXT, storeItem } from 'utils/state';
import { useRecoilState } from 'recoil';
import { parse_curl } from 'curl-parser';
import { convertToValidVariableName, deepCopy, getHeaders } from 'utils/common';

function toPascalCase(str) {
  return str
    .split(/\s|_|-/g) // Split by whitespace, underscore, or hyphen
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}
function toCamelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) => {
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export const defaultConnectorProps = (connector) => {
  let connectorPascalCase = toPascalCase(connector);
  return {
    connector: connector,
    url: '',
    content_type: '',
    flows: {
      PaymentMethodToken: {
        trait_name: 'api::PaymentMethodToken',
        data_type: 'types::PaymentMethodTokenizationData',
        response_data: 'types::PaymentsResponseData',
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: [],
      },
      AccessTokenAuth: {
        trait_name: 'api::AccessTokenAuth',
        data_type: 'types::AccessTokenRequestData',
        response_data: 'types::AccessToken',
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: [],
      },
      MandateSetup: {
        trait_name: 'api::SetupMandate',
        data_type: 'types::SetupMandateRequestData',
        response_data: 'types::PaymentsResponseData',
        struct_name: connectorPascalCase,
        connector_name: connector,
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
        struct_name: connectorPascalCase,
        connector_name: connector,
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
        struct_name: connectorPascalCase,
        connector_name: connector,
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
        struct_name: connectorPascalCase,
        connector_name: connector,
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
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: [],
      },
      Session: {
        trait_name: 'api::Session',
        data_type: 'types::PaymentsSessionData',
        response_data: 'types::PaymentsResponseData',
        router_type: 'types::PaymentsSyncRouterData',
        struct_name: connectorPascalCase,
        connector_name: connector,
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
        struct_name: connectorPascalCase,
        connector_name: connector,
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
        struct_name: connectorPascalCase,
        connector_name: connector,
        enabled: [],
      },
    },
  };
};
const ConnectorTemplate = () => {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);
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
  };
  const build_auth_header_key = (data) => {
    if (data.includes('$base_64_encode')) {
      let fields = data.split('_colon_');
      return (
        'consts::BASE64_ENGINE.encode(format!("{}:{}", auth.' +
        fields[0].substr('$base_64_encode_'.length) +
        '.peek(), auth.' +
        fields[1] +
        '.peek()))'
      );
    } else {
      return 'auth.' + data.substr(1) + '.expose()';
    }
  };
  const get_auth_header_key = (data) => {
    if (data === 'Authorization') return 'headers::AUTHORIZATION.to_string()';
    if (data === 'X-API-KEY') return 'headers::X_API_KEY.to_string()';
    if (data === 'API-KEY') return 'headers::API_KEY.to_string()';
    if (data === 'apikey') return 'headers::APIKEY.to_string()';
    if (data === 'X-CC-Api-Key') return 'headers::X_CC_API_KEY.to_string()';
    if (data === 'X-Trans-Key') return 'headers::X_TRANS_KEY.to_string()';
    return data;
  };
  const build_auth_headers = (data) => {
    for (const key in data) {
      let headers = data[key]?.curl?.headers || {};
      for (const header in headers) {
        let auth_value = build_auth_header_key(headers[header]);
        if (auth_value) {
          let contents = headers[header].split('$');
          auth_value =
            contents.length > 1 && contents[0]
              ? `format!("` + contents[0] + `{}", ` + auth_value + `)`
              : auth_value;
          return {
            header_auth_key: get_auth_header_key(header),
            header_auth_value: auth_value + '.into_masked()',
          };
        }
      }
    }
    return {};
  };

  useEffect(() => {
    let props = defaultConnectorProps(appContext.connectorPascalCase);
    props = {
      ...props,
      flows: { ...props.flows, ...deepCopy(appContext.props.flows) },
    };
    props.flows[appContext.selectedFlow].curl = {
      input: appContext.curlCommand,
      body: appContext.requestFields?.value,
      headers: appContext.requestHeaderFields?.value,
      response: appContext?.responseFields?.value,
      hsResponse: appContext.hsResponseFields?.value,
    };
    if (appContext?.responseFields?.value) {
      const flow = props.flows[appContext.selectedFlow] || {};
      let ss = appContext.curlCommand
        .replace(/\s*\\\s*/g, ' ')
        .replace(/\n/g, '')
        .replace(/--data-raw|--data-urlencode/g, '-d');
      const fetchRequest = parse_curl(ss);

      flow.url_path = new URL(fetchRequest.url).pathname;
      flow.http_method = toPascalCase(fetchRequest.method);
      let headers = getHeaders(fetchRequest.headers);
      props.content_type = headers['Content-Type'] || headers['content-type'];
      flow.headers = Object.keys(headers).map((key) =>
        convertToValidVariableName(key)
      );
      // if request body is present then build request body
      flow?.enabled.push(
        'get_headers',
        'get_content_type',
        'get_url',
        'build_request',
        'handle_response',
        'get_error_response'
      );
      if (Object.keys(JSON.parse(fetchRequest.data.ascii)).length > 0) {
        flow?.enabled.push('get_request_body');
      }
      props.flows[appContext.selectedFlow] = flow;
    }
    setAppContext({ ...appContext, props });
  }, [appContext.connectorPascalCase]);

  useEffect(() => {
    if (appContext.codeInvalidated) {
      const props = appContext.props;
      const template = handlebars.compile(ConnectorIntegration);
      const connector_common_template = handlebars.compile(ConnectorCommon);
      const connector_webhook_template = handlebars.compile(ConnectorWebhook);
      const flows = props.flows;
      const renderedTemplate =
        connector_common_template({
          struct_name: toPascalCase(props.connector),
          connector_name: toCamelCase(props.connector),
          headers: findCommonHeaders(props.flows),
          content_type: props.content_type,
          ...build_auth_headers(props.flows),
        }) +
        Object.values(flows)
          .map((flow) =>
            template({
              ...flow,
              connector_name: toCamelCase(flow?.connector_name || ' '),
            })
          )
          .join('\n') +
        connector_webhook_template({
          struct_name: toPascalCase(props.connector),
        });
      storeItem('props', JSON.stringify(props));
      if (renderedTemplate !== generatedCode) {
        setGeneratedCode(renderedTemplate);
      }
      setAppContext({
        ...appContext,
        wasCodeUpdatedBeforeDownload: renderedTemplate !== generatedCode,
        codeInvalidated: false,
      });
    }
  }, [appContext.codeInvalidated, appContext.generatorInput]);

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
      <h3>{appContext.connectorPascalCase.toLowerCase()}.rs</h3>
      <div data-testid="generated-code">
        <button onClick={handleCopyClick}>Copy to Clipboard</button>
        {isCopied && <span>Copied to clipboard!</span>}
        <SyntaxHighlighter id="connectors" language="rust" style={githubGist}>
          {generatedCode}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default ConnectorTemplate;
