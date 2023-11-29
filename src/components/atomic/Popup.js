import * as React from 'react';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { download } from '../../utils/common';
import { APP_CONTEXT } from 'utils/state';
import { useRecoilValue } from 'recoil';

export default function BasicPopover({
  curl = '',
  updateAppContext = (u) => {},
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const appContext = useRecoilValue(APP_CONTEXT);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    if (appContext.wasCodeUpdatedBeforeDownload) {
      download(
        document.querySelector('#transformers')?.innerText,
        'transformer.rs',
        'text'
      );
      download(
        document.querySelector('#connectors')?.innerText,
        `${appContext.connectorName.toLowerCase()}.rs`,
        'text'
      );
      updateAppContext({ wasCodeUpdatedBeforeDownload: false });
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <button aria-describedby={id} onClick={handleClick}>
        Raise Github PR
      </button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Typography sx={{ p: 2, maxWidth: 800 }}>
          Please run below command in your terminal <br />
          <div>
            <b>
              <code>{curl}</code>
            </b>
          </div>
        </Typography>
      </Popover>
    </div>
  );
}
