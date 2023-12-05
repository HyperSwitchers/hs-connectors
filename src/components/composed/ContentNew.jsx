import React from 'react';

// userdef UI components
import ApiDataEditor from './content/ApiDataEditor';
import AuthTypeNew from './content/AuthTypeNew';
import CodePreviewNew from './content/CodePreviewNew';
import CurlEditor from './content/CurlEditor';
import { useRecoilState } from 'recoil';
import { APP_CONTEXT } from 'utils/state';

export default function ContentNew() {
  const [appContext, setAppContext] = useRecoilState(APP_CONTEXT);

  return (
    <div className="app-content">
      {appContext.selectedFlow === 'AuthType' ? (
        <AuthTypeNew />
      ) : (
        <React.Fragment>
          <CurlEditor />
          <ApiDataEditor />
          <CodePreviewNew />
        </React.Fragment>
      )}
    </div>
  );
}
