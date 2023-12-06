// @ts-check

import React, { useState } from 'react';

function Dropdown({ options, handleSelectChange, selectedOption, type }) {
  return (
    <div className="dropdown">
      <select
        className="dropdown-select"
        id="dropdown"
        value={selectedOption}
        onChange={handleSelectChange}
      >
        {type ? (
          <option disabled value="">
            Select {type}
          </option>
        ) : null}
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Dropdown;
