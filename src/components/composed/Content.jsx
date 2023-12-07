import React from 'react';

// userdef UI components
import ApiDataEditor from './content/ApiDataEditor';
import AuthType from './content/AuthType';
import CodePreview from './content/CodePreview';
import CurlEditor from './content/CurlEditor';
import { useRecoilState } from 'recoil';
import { APP_CONTEXT } from 'utils/state';

export default function Content() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);

  return (
    <div className="app-content">
      {appContext.selectedFlow === 'AuthType' ? (
        <AuthType />
      ) : (
        <React.Fragment>
          <CurlEditor />
          {appContext.curlRequest ? <ApiDataEditor /> : null}
          {appContext.responseFields.value &&
          appContext.authType.value &&
          appContext.status.value ? (
            <CodePreview />
          ) : null}
        </React.Fragment>
      )}
    </div>
  );
}
