import React, { useState } from 'react';
import { List, ListItem, ListItemButton, Collapse, ListItemText } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const Sidebar = ({ connectors }) => {
  const [open, setOpen] = useState({});

  const handleClick = (connector) => {
    setOpen((prevOpen) => ({
      ...prevOpen,
      [connector]: !prevOpen[connector]
    }));
  };

  return (
    <List>
      {connectors && connectors.map((connector) => (
        <div key={connector.connector_name}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleClick(connector.connector_name)}>
              <ListItemText primary={connector.connector_name} />
              {open[connector.connector_name] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={open[connector.connector_name]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {connector.enabled.map((flow) => (
                <ListItem key={flow} disablePadding>
                  <ListItemText primary={flow} />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </div>
      ))}
    </List>
  );
};

export default Sidebar;
