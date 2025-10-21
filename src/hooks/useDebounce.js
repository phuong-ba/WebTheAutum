import { useEffect, useState } from "react";

export const useDebounce = (value, delay) => {
  const [searchValue, setSearchValue] = useState(value);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return searchValue;
};

