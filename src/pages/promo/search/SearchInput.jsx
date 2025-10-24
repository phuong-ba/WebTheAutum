import React from "react";
import { Search } from "lucide-react";

const SearchInput = ({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className = "",
  icon = Search,
  disabled = false,
}) => {
  const Icon = icon;

  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        } ${className}`}
      />
    </div>
  );
};

export default SearchInput;
