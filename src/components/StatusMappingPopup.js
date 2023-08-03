import React, { useState } from "react";

    const StatusMappingPopup = ({ initialValues, onClose, onSubmit }) => {
    const [jsonInput, setJsonInput] = useState(JSON.stringify(initialValues, null, 2));
  
    const handleSubmit = () => {
      // Parse the edited JSON and submit it
      const editedJson = JSON.parse(jsonInput);
      console.log(editedJson);
      onSubmit(editedJson);
    };

  return (
    <div className="popup-container">
      <div className="popup">
        <h2>Enter Connector Satus</h2>
        <textarea id="textarea-popup"
          rows={20}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Enter Status Mapping"
        />
        <div className="button-group">
          <button onClick={handleSubmit}>Submit</button>
          <button id="cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default StatusMappingPopup;
