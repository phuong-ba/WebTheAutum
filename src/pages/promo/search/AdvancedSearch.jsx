import React from "react";
import SearchFilter from "./SearchFilter";
import SearchInput from "./SearchInput";
import DateRangePicker from "./DateRangePicker";
import RangeSlider from "./RangeSlider";
import MultiSelect from "./MultiSelect";
import FilterChips from "./FilterChips";

const AdvancedSearch = ({
  // Search input props
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  searchIcon,

  // Date range props
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  showDateRange = false,

  // Range slider props
  rangeValue,
  onRangeChange,
  rangeMin = 0,
  rangeMax = 100,
  rangeStep = 1,
  rangeUnit = "",
  rangeLabel = "Giá trị",
  formatRangeValue = (val) => val,
  showRange = false,

  // Select dropdown props
  selectValue,
  onSelectChange,
  selectOptions = [],
  selectLabel = "Loại",
  showSelect = false,

  // Action props
  onReset,
  onExport,
  onCreate,
  showReset = true,
  showExport = false,
  showCreate = false,
  resetLabel = "Đặt lại bộ lọc",
  exportLabel = "Xuất Excel",
  createLabel = "Thêm mới",

  // MultiSelect props
  multiSelectValue,
  onMultiSelectChange,
  multiSelectOptions = [],
  multiSelectLabel = "Danh mục",
  showMultiSelect = false,

  // Filter chips props
  showFilterChips = false,
  activeFilters = [],
  onRemoveFilter,

  // Layout props
  title = "Bộ Lọc Tìm Kiếm",
  layout = "grid", // "grid" or "flex"
  className = "",
}) => {
  return (
    <SearchFilter
      title={title}
      onReset={onReset}
      onExport={onExport}
      onCreate={onCreate}
      showReset={showReset}
      showExport={showExport}
      showCreate={showCreate}
      resetLabel={resetLabel}
      exportLabel={exportLabel}
      createLabel={createLabel}
      className={className}
    >
      <div
        className={`${
          layout === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
            : "flex flex-wrap gap-4 md:gap-6"
        }`}
      >
        {/* Search Input */}
        <div className={showDateRange ? "sm:col-span-2 lg:col-span-1" : ""}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tìm kiếm
          </label>
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            icon={searchIcon}
          />
        </div>

        {/* Select Dropdown */}
        {showSelect && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectLabel}
            </label>
            <select
              value={selectValue}
              onChange={onSelectChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            >
              {selectOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Range */}
        {showDateRange && (
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khoảng thời gian
            </label>
            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={onDateFromChange}
              onDateToChange={onDateToChange}
            />
          </div>
        )}

        {/* MultiSelect */}
        {showMultiSelect && (
          <div className="sm:col-span-2 lg:col-span-1">
            <MultiSelect
              options={multiSelectOptions}
              selectedValues={multiSelectValue}
              onChange={onMultiSelectChange}
              placeholder={`Chọn ${multiSelectLabel.toLowerCase()}...`}
              label={multiSelectLabel}
            />
          </div>
        )}
      </div>

      {/* Range Slider */}
      {showRange && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {rangeLabel}: {formatRangeValue(rangeValue[0])}
            {rangeUnit} - {formatRangeValue(rangeValue[1])}
            {rangeUnit}
          </label>
          <RangeSlider
            value={rangeValue}
            onChange={onRangeChange}
            min={rangeMin}
            max={rangeMax}
            step={rangeStep}
            unit={rangeUnit}
            formatValue={formatRangeValue}
          />
        </div>
      )}

      {/* Filter Chips */}
      {showFilterChips && activeFilters.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <FilterChips
            filters={activeFilters}
            onRemoveFilter={onRemoveFilter}
            onClearAll={onReset}
          />
        </div>
      )}
    </SearchFilter>
  );
};

export default AdvancedSearch;
