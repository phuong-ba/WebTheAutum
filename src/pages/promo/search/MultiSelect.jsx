import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";

const MultiSelect = ({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = "Chọn...",
  label = "",
  maxSelected = null,
  disabled = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lọc options theo search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Xử lý select/deselect option
  const handleOptionClick = (option) => {
    if (disabled) return;

    const newSelectedValues = selectedValues.includes(option.value)
      ? selectedValues.filter((val) => val !== option.value)
      : maxSelected && selectedValues.length >= maxSelected
      ? selectedValues
      : [...selectedValues, option.value];

    onChange(newSelectedValues);
  };

  // Xóa một giá trị đã chọn
  const removeValue = (valueToRemove) => {
    if (disabled) return;
    const newSelectedValues = selectedValues.filter(
      (val) => val !== valueToRemove
    );
    onChange(newSelectedValues);
  };

  // Xóa tất cả
  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Lấy label của option từ value
  const getOptionLabel = (value) => {
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div
        ref={dropdownRef}
        className={`relative border border-gray-200 rounded-lg ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        }`}
      >
        {/* Input hiển thị */}
        <div
          className={`flex items-center justify-between p-3 cursor-pointer ${
            disabled ? "cursor-not-allowed" : ""
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-h-[20px]">
            {selectedValues.length === 0 ? (
              <span className="text-gray-500 text-sm">{placeholder}</span>
            ) : (
              selectedValues.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                >
                  {getOptionLabel(value)}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeValue(value);
                      }}
                      className="hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 ml-2">
            {selectedValues.length > 0 && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Dropdown menu */}
        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  Không tìm thấy kết quả
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer ${
                      selectedValues.includes(option.value) ? "bg-green-50" : ""
                    }`}
                    onClick={() => handleOptionClick(option)}
                  >
                    <span className="text-sm text-gray-900">
                      {option.label}
                    </span>
                    {selectedValues.includes(option.value) && (
                      <Check size={16} className="text-green-600" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer info */}
            {maxSelected && (
              <div className="p-2 border-t border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500">
                  Đã chọn {selectedValues.length}/{maxSelected} mục
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;
