// @ts-check

import React, { useEffect, useState } from 'react';
import handlebars from 'handlebars';
import { ConnectorIntegration } from 'templates/ConnectorIntegration';

const Connector = ({
  context = {
    trait_name: 'api::PSync',
    data_type: 'types::PaymentsSyncData',
    router_type: 'types::PaymentsSyncRouterData',
    response_data: 'types::PaymentsResponseData',
    struct_name: 'Shift4',
    connector_name: 'shift4',
  },
}) => {
  const [templateContent] = useState(ConnectorIntegration);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    if (templateContent) {
      const template = handlebars.compile(templateContent);
      const renderedTemplate = template(context);
      setGeneratedCode(renderedTemplate);
    }
  }, [templateContent]);

  return (
    <div>
      <h1>Rust Code Generation</h1>
      <div data-testid="generated-code">
        <h2>Generated Code:</h2>
        <pre>{generatedCode}</pre>
      </div>
    </div>
  );
};

export default Connector;
