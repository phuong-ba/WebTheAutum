# Hệ Thống Tìm Kiếm Tổng Quát

Hệ thống tìm kiếm được thiết kế để có thể tái sử dụng cho toàn bộ project với các component linh hoạt và dễ tùy chỉnh.

## Các Component Chính

### 1. SearchInput

Component input tìm kiếm với icon tùy chỉnh.

```jsx
import SearchInput from "@/components/search/SearchInput";

<SearchInput
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
  placeholder="Tìm kiếm..."
  icon={Search} // Lucide icon
/>;
```

### 2. DateRangePicker

Component chọn khoảng thời gian.

```jsx
import DateRangePicker from "@/components/search/DateRangePicker";

<DateRangePicker
  dateFrom={dateFrom}
  dateTo={dateTo}
  onDateFromChange={(e) => setDateFrom(e.target.value)}
  onDateToChange={(e) => setDateTo(e.target.value)}
/>;
```

### 3. RangeSlider

Component slider cho giá trị số.

```jsx
import RangeSlider from "@/components/search/RangeSlider";

<RangeSlider
  value={rangeValue}
  onChange={setRangeValue}
  min={0}
  max={100}
  step={1}
  unit="%"
  formatValue={(val) => val.toLocaleString()}
/>;
```

### 4. SearchFilter

Component container cho bộ lọc với các action buttons.

```jsx
import SearchFilter from "@/components/search/SearchFilter";

<SearchFilter
  title="Bộ Lọc Tìm Kiếm"
  onReset={resetFilters}
  onExport={handleExport}
  onCreate={handleCreate}
  showReset={true}
  showExport={true}
  showCreate={true}
>
  {/* Các input filter ở đây */}
</SearchFilter>;
```

### 5. MultiSelect

Component lựa chọn nhiều giá trị với tìm kiếm và gợi ý.

```jsx
import MultiSelect from "@/components/search/MultiSelect";

<MultiSelect
  options={[
    { value: "option1", label: "Tùy chọn 1" },
    { value: "option2", label: "Tùy chọn 2" },
  ]}
  selectedValues={selectedValues}
  onChange={setSelectedValues}
  placeholder="Chọn nhiều tùy chọn..."
  label="Danh mục"
  maxSelected={5}
/>;
```

### 6. FilterChips

Component hiển thị các filter đang active dưới dạng chips.

```jsx
import FilterChips from "@/components/search/FilterChips";

<FilterChips
  filters={[
    { key: "search", label: "Tìm kiếm", value: "áo thun" },
    { key: "category", label: "Danh mục", value: "Thời trang" },
  ]}
  onRemoveFilter={removeFilter}
  onClearAll={clearAllFilters}
/>;
```

### 7. SearchSuggestion

Component tìm kiếm với gợi ý và keyboard navigation.

```jsx
import SearchSuggestion from "@/components/search/SearchSuggestion";

<SearchSuggestion
  value={searchValue}
  onChange={setSearchValue}
  onSelect={handleSuggestionSelect}
  suggestions={[
    { value: "product1", label: "Sản phẩm 1", count: 10 },
    { value: "product2", label: "Sản phẩm 2", description: "Mô tả" },
  ]}
  placeholder="Tìm kiếm sản phẩm..."
  loading={isLoading}
/>;
```

### 8. AdvancedSearch

Component tổng hợp tất cả các tính năng tìm kiếm.

```jsx
import AdvancedSearch from "@/components/search/AdvancedSearch";

<AdvancedSearch
  title="Bộ Lọc Sản Phẩm"
  // Search input
  searchValue={filters.searchTerm}
  onSearchChange={(e) => setSearchTerm(e.target.value)}
  searchPlaceholder="Mã sản phẩm, tên sản phẩm..."
  // Date range
  showDateRange={true}
  dateFrom={filters.dateFrom}
  dateTo={filters.dateTo}
  onDateFromChange={(e) => setDateFrom(e.target.value)}
  onDateToChange={(e) => setDateTo(e.target.value)}
  // Range slider
  showRange={true}
  rangeValue={filters.rangeValue}
  onRangeChange={setRangeValue}
  rangeMin={0}
  rangeMax={2000000}
  rangeStep={10000}
  rangeUnit="₫"
  rangeLabel="Giá bán"
  formatRangeValue={(val) => val.toLocaleString("vi-VN")}
  // Select dropdown
  showSelect={true}
  selectValue={filters.selectedOption}
  onSelectChange={(e) => setSelectedOption(e.target.value)}
  selectOptions={statusOptions}
  selectLabel="Trạng thái"
  // MultiSelect
  showMultiSelect={true}
  multiSelectValue={filters.multiSelectValues}
  onMultiSelectChange={setMultiSelectValues}
  multiSelectOptions={categoryOptions}
  multiSelectLabel="Danh mục"
  // Filter chips
  showFilterChips={true}
  activeFilters={getActiveFilters()}
  onRemoveFilter={removeFilter}
  // Actions
  onReset={resetFilters}
  onExport={handleExport}
  onCreate={handleCreate}
  showReset={true}
  showExport={true}
  showCreate={true}
/>;
```

## Hook useSearchFilter

Hook để quản lý state tìm kiếm.

```jsx
import useSearchFilter from "@/hooks/useSearchFilter";

const {
  filters,
  debouncedFilters,
  setSearchTerm,
  setDateFrom,
  setDateTo,
  setRangeValue,
  setSelectedOption,
  setMultiSelectValues,
  resetFilters,
  removeFilter,
  getActiveFilters,
} = useSearchFilter(
  {
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    rangeValue: [0, 100],
    selectedOption: "Tất cả",
    multiSelectValues: [],
  },
  300
); // 300ms debounce delay
```

## Ví Dụ Sử Dụng Hoàn Chỉnh

Xem file `src/pages/product/Product.jsx` để có ví dụ đầy đủ về cách sử dụng hệ thống tìm kiếm.

## Tùy Chỉnh

### Thêm Custom Filter

Bạn có thể thêm các filter tùy chỉnh bằng cách sử dụng component `SearchFilter` làm container:

```jsx
<SearchFilter title="Custom Filter">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Custom inputs */}
    <div>
      <label>Custom Filter</label>
      <input type="text" />
    </div>
  </div>
</SearchFilter>
```

### Styling

Tất cả components sử dụng Tailwind CSS và có thể dễ dàng tùy chỉnh thông qua props `className`.

### Icons

Sử dụng Lucide React icons cho tất cả icons trong hệ thống.

## Tính Năng Mới

### Debounce Search

Hook `useSearchFilter` hỗ trợ debounce để tối ưu performance khi tìm kiếm.

### Multi-Select Filter

Component `MultiSelect` cho phép lựa chọn nhiều giá trị với tìm kiếm và giới hạn số lượng.

### Filter Chips

Component `FilterChips` hiển thị các filter đang active và cho phép xóa từng filter riêng lẻ.

### Search Suggestions

Component `SearchSuggestion` cung cấp gợi ý tìm kiếm với keyboard navigation.

### Enhanced Range Slider

Component `RangeSlider` được cải thiện với dual handles và input fields tùy chọn.

## Lưu Ý

1. Đảm bảo import đúng path khi sử dụng components
2. Sử dụng hook `useSearchFilter` để quản lý state một cách nhất quán
3. Các component được thiết kế responsive và hoạt động tốt trên mobile
4. Range slider có styling custom, đảm bảo include CSS styles trong component sử dụng
5. Sử dụng `debouncedFilters` cho API calls để tránh gọi quá nhiều lần
6. `getActiveFilters()` trả về array các filter đang active để hiển thị chips
