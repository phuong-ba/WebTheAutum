import { useState, useCallback, useEffect, useRef } from "react";

const useSearchFilter = (initialFilters = {}, debounceDelay = 300) => {
  const [filters, setFilters] = useState({
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    rangeValue: [0, 100],
    selectedOption: "Tất cả",
    multiSelectValues: [],
    ...initialFilters,
  });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceTimeoutRef = useRef(null);

  // Debounce filters changes
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, debounceDelay);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [filters, debounceDelay]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      dateFrom: "",
      dateTo: "",
      rangeValue: [0, 100],
      selectedOption: "Tất cả",
      multiSelectValues: [],
      ...initialFilters,
    });
  }, [initialFilters]);

  const setSearchTerm = useCallback(
    (value) => updateFilter("searchTerm", value),
    [updateFilter]
  );
  const setDateFrom = useCallback(
    (value) => updateFilter("dateFrom", value),
    [updateFilter]
  );
  const setDateTo = useCallback(
    (value) => updateFilter("dateTo", value),
    [updateFilter]
  );
  const setRangeValue = useCallback(
    (value) => updateFilter("rangeValue", value),
    [updateFilter]
  );
  const setSelectedOption = useCallback(
    (value) => updateFilter("selectedOption", value),
    [updateFilter]
  );
  const setMultiSelectValues = useCallback(
    (value) => updateFilter("multiSelectValues", value),
    [updateFilter]
  );

  // Remove specific filter
  const removeFilter = useCallback(
    (key) => {
      setFilters((prev) => {
        const newFilters = { ...prev };

        // Reset to default values based on key
        switch (key) {
          case "searchTerm":
            newFilters.searchTerm = "";
            break;
          case "dateRange":
            newFilters.dateFrom = "";
            newFilters.dateTo = "";
            break;
          case "rangeValue":
            newFilters.rangeValue = [0, 100];
            break;
          case "selectedOption":
            newFilters.selectedOption = "Tất cả";
            break;
          case "multiSelectValues":
            newFilters.multiSelectValues = [];
            break;
          default:
            newFilters[key] = initialFilters[key] || "";
        }

        return newFilters;
      });
    },
    [initialFilters]
  );

  // Get active filters for chips display
  const getActiveFilters = useCallback(() => {
    const activeFilters = [];

    if (filters.searchTerm) {
      activeFilters.push({
        key: "searchTerm",
        label: "Tìm kiếm",
        value: filters.searchTerm,
      });
    }

    if (filters.dateFrom || filters.dateTo) {
      activeFilters.push({
        key: "dateRange",
        label: "Khoảng thời gian",
        value: `${filters.dateFrom || "..."} - ${filters.dateTo || "..."}`,
      });
    }

    if (filters.rangeValue[0] > 0 || filters.rangeValue[1] < 100) {
      activeFilters.push({
        key: "rangeValue",
        label: "Khoảng giá trị",
        value: `${filters.rangeValue[0]} - ${filters.rangeValue[1]}`,
      });
    }

    if (filters.selectedOption && filters.selectedOption !== "Tất cả") {
      activeFilters.push({
        key: "selectedOption",
        label: "Loại",
        value: filters.selectedOption,
      });
    }

    if (filters.multiSelectValues && filters.multiSelectValues.length > 0) {
      activeFilters.push({
        key: "multiSelectValues",
        label: "Danh mục",
        value: `${filters.multiSelectValues.length} mục`,
      });
    }

    return activeFilters;
  }, [filters]);

  return {
    filters,
    debouncedFilters,
    updateFilter,
    resetFilters,
    removeFilter,
    setSearchTerm,
    setDateFrom,
    setDateTo,
    setRangeValue,
    setSelectedOption,
    setMultiSelectValues,
    getActiveFilters,
  };
};

export default useSearchFilter;
