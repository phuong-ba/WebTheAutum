import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

const SearchSuggestion = ({
  value,
  onChange,
  onSelect,
  suggestions = [],
  placeholder = "Tìm kiếm...",
  minLength = 2,
  maxSuggestions = 10,
  loading = false,
  className = "",
  icon = Search,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const Icon = icon;

  // Filter suggestions based on search term
  const filteredSuggestions = suggestions
    .filter((suggestion) =>
      suggestion.label.toLowerCase().includes(value.toLowerCase())
    )
    .slice(0, maxSuggestions);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setHighlightedIndex(-1);

    if (newValue.length >= minLength) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Handle suggestion select
  const handleSuggestionSelect = (suggestion) => {
    onSelect(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionSelect(filteredSuggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length >= minLength) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && (filteredSuggestions.length > 0 || loading) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mx-auto"></div>
              <span className="ml-2">Đang tìm kiếm...</span>
            </div>
          ) : (
            <>
              {filteredSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion.value}
                  className={`px-3 py-2 cursor-pointer text-sm transition-colors duration-150 ${
                    index === highlightedIndex
                      ? "bg-green-50 text-green-800"
                      : "hover:bg-gray-50 text-gray-900"
                  }`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <span>{suggestion.label}</span>
                    {suggestion.count && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({suggestion.count})
                      </span>
                    )}
                  </div>
                  {suggestion.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {suggestion.description}
                    </div>
                  )}
                </div>
              ))}

              {filteredSuggestions.length === 0 &&
                value.length >= minLength && (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    Không tìm thấy kết quả
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestion;

