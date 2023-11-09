import * as React from 'react';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { download } from './search_utils';

export default function BasicPopover({ isCodeUpdated = true, setIsCodeUpdated = (state) => {}, curl = 'curl https://raw.githubusercontent.com/HyperSwitchers/hs-connectors/main/src/raise_connector_pr.sh | sh' }) {
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event) => {
        setIsCodeUpdated(false);
        setAnchorEl(event.currentTarget);
        if(isCodeUpdated) {
            download(document.querySelector("#transformers")?.innerText, 'transformer.rs', 'text');
            download(document.querySelector("#connectors")?.innerText, 'connector.rs', 'text');
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
                <Typography sx={{ p: 2, maxWidth: 800 }}
                >Please run below command in your terminal <br />
                    <div style={{ width: '80%' }}><b><code>{curl}</code></b></div>
                </Typography>
            </Popover>
        </div>
    );
}