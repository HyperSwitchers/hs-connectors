// @ts-check

import React, { useEffect, useState } from 'react';
import copy from 'copy-to-clipboard';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useRecoilState } from 'recoil';

// userdef utils
import { APP_CONTEXT } from 'utils/state';
import { generateRustCode } from 'utils/Parser';
import ConnectorTemplates from './ConnectorTemplates';

const CodePreview = () => {
  const generateCodeSnippet = () => {
    return `fn main() {
    let name: &str = "John";
    let age: u32 = 30;

    println!("Name: {}, Age: {}", name, age);
}
    impl TryFrom<&types::ConnectorAuthType> for ZenAuthType {
      type Error = error_stack::Report<errors::ConnectorError>;
      fn try_from(auth_type: &types::ConnectorAuthType) -> Result<Self, Self::Error> {
          if let types::ConnectorAuthType::HeaderKey { api_key } = auth_type {
              Ok(Self {
                  api_key: api_key.to_owned(),
              })
          } else {
              Err(errors::ConnectorError::FailedToObtainAuthType.into())
          }
      }
  }`;

    // In a real scenario, you might generate the code dynamically based on some logic
  };

  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);

  // Component specific states
  const [isCopied, setIsCopied] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState(generateCodeSnippet());

  /**
   * Usecase - generate rust code
   * Trigger - whenever generatorInput is updated
   */
  useEffect(() => {
    try {
      if (
        appContext.connectorPascalCase &&
        Object.keys(appContext.generatorInput).length > 0
      ) {
        const rustCode = generateRustCode(
          appContext.connectorPascalCase,
          JSON.stringify(appContext.generatorInput)
        );
        if (codeSnippet !== rustCode) {
          setCodeSnippet(rustCode);
          setAppContext({ ...appContext, wasCodeUpdatedBeforeDownload: true });
        }
      }
    } catch (error) {
      console.error('Failed to generate Rust code from input', error);
    }
  }, [appContext.generatorInput]);

  // Function to handle the "Copy to Clipboard" button click event
  const handleCopyClick = () => {
    copy(codeSnippet);
    setIsCopied(true);
    // Reset the "Copied to clipboard" notification after a short delay
    setTimeout(() => {
      setIsCopied(false);
    }, 500);
  };

  return (
    <div className="rust-code-preview">
      <h3 id="generated-code-snippet">Generated Code Snippet</h3>
      <div className="connector-code">
        <div>
          <ConnectorTemplates />
        </div>
      </div>
      <div className="transformers-code">
        <h3 id="generated-code-snippet">transformers.rs</h3>
        <button onClick={handleCopyClick}>Copy to Clipboard</button>
        {isCopied && <span>Copied to clipboard!</span>}
        <SyntaxHighlighter id="transformers" language="rust" style={githubGist}>
          {codeSnippet}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodePreview;
