import React from 'react';
import { CFormSwitch } from '@coreui/react';

const ToggleSwitch = ({ isChecked, onChange, className = '', ...props }) => {
  return (
    <CFormSwitch
      checked={isChecked}
      onChange={onChange}
      className={`mt-0 ${className}`}
      {...props}
    />
  );
};

export default ToggleSwitch;
