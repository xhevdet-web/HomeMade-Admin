import React from "react";
import Select from "react-select";
import PropTypes from "prop-types";
import { useTheme } from "../redux/selectors/uiSelector"; // adjust path as needed

const MultiSelect = ({ label, options, value, onChange, className }) => {
  const selectedOptions = options?.filter((opt) =>
    value?.some((v) => v.id === opt.value)
  );
  // console.log('selectedOptions',selectedOptions)
  const theme = useTheme();
  const isDark = theme === "dark";

  const customStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: isDark ? "#212631" : "#fff",
      color: isDark ? "#fff" : "#000",
      borderColor: isDark ? "#444" : "#ccc",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? "#212631" : "#fff",
      color: isDark ? "#fff" : "#000",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDark ? "#212631" : "#e0e0e0",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDark ? "#fff" : "#000",
    }),
    input: (base) => ({
      ...base,
      color: isDark ? "#fff" : "#000",
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? isDark
          ? "#212631"
          : "#007bff"
        : isFocused
          ? isDark
            ? "#212631"
            : "#e6f0ff"
          : isDark
            ? "#212631"
            : "#fff",
      color: isDark
        ? isSelected
          ? "#fff"
          : "#ddd"
        : isSelected
          ? "#fff"
          : "#000",
    }),
  };

  return (
    <div className={className}>
      {label && <label className="form-label mb-1">{label}</label>}
      <Select
        isMulti
        options={options}
        value={value}
        onChange={onChange}
        classNamePrefix="react-select"
        styles={{
          ...customStyles,
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
        }}
        menuPortalTarget={document.body}
      />
    </div>
  );
};

MultiSelect.propTypes = {
  label: PropTypes.string,
  options: PropTypes.array.isRequired,
  value: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default MultiSelect;
