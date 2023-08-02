import React, { useState } from 'react';

function Dropdown({ options, handleSelectChange, selectedOption, type}) {
  return (
    <div className='dropdown'>
      <label htmlFor="dropdown">{type}: </label>
      <select className='dropdown-select' id="dropdown" value={selectedOption} onChange={handleSelectChange}>
        <option disabled value="">Select {type}</option>
        {
            options.map((option, index) => (
                <option key={index} value={option}>{option}</option>
            ))
        }
      </select>
    </div>
  );
};

export default Dropdown;