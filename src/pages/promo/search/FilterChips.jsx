import React from "react";
import { X } from "lucide-react";

const FilterChips = ({
  filters = [],
  onRemoveFilter,
  onClearAll,
  showClearAll = true,
  className = "",
}) => {
  if (filters.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      <span className="text-sm text-gray-600 font-medium">
        Bộ lọc đang áp dụng:
      </span>

      {filters.map((filter, index) => (
        <div
          key={index}
          className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full border border-green-200"
        >
          <span className="font-medium">{filter.label}:</span>
          <span>{filter.value}</span>
          {onRemoveFilter && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemoveFilter(filter.key);
              }}
              className="ml-1 hover:bg-green-200 rounded-full p-0.5 transition-colors duration-150"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}

      {showClearAll && onClearAll && filters.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm text-gray-500 hover:text-gray-700 underline ml-2 transition-colors duration-150"
        >
          Xóa tất cả
        </button>
      )}
    </div>
  );
};

export default FilterChips;
