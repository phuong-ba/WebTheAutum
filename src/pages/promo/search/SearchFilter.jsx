import React from "react";
import { Filter, RotateCcw, Download, Plus } from "lucide-react";
import SearchInput from "./SearchInput";
import DateRangePicker from "./DateRangePicker";
import RangeSlider from "./RangeSlider";

const SearchFilter = ({
  title = "Bộ Lọc Tìm Kiếm",
  children,
  onReset,
  onExport,
  onCreate,
  showReset = true,
  showExport = false,
  showCreate = false,
  resetLabel = "Đặt lại bộ lọc",
  exportLabel = "Xuất Excel",
  createLabel = "Thêm mới",
  className = "",
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 ${className}`}
    >
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-orange-600">{title}</h2>
      </div>

      {children}

      {/* Action buttons */}
      {(showReset || showExport || showCreate) && (
        <div className="flex justify-end items-end gap-3 mt-6">
          {showReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 bg-gray-200 text-gray-800 px-6 py-2.5 rounded-full hover:bg-gray-300 transition-all duration-200 font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              {resetLabel}
            </button>
          )}
          {showExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 bg-orange-400 text-white px-6 py-2.5 rounded-full hover:bg-orange-700 transition-all duration-200 font-medium"
            >
              <Download className="w-4 h-4" />
              {exportLabel}
            </button>
          )}
          {showCreate && (
            <button
              onClick={onCreate}
              className="flex items-center gap-2 bg-orange-400 text-white px-6 py-2.5 rounded-full hover:bg-orange-700 transition-all duration-200 font-medium"
            >
              <Plus className="w-4 h-4" />
              {createLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
