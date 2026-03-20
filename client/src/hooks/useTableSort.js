import { useState, useMemo } from 'react';

/**
 * Custom hook for table sorting
 * @param {Array} data - The data array to sort
 * @param {Object} config - Configuration object with default sort column and direction
 * @returns {Object} - Sorted data, sort state, and sort handler
 */
export function useTableSort(data, config = {}) {
  const { defaultColumn = null, defaultDirection = 'asc' } = config;

  const [sortConfig, setSortConfig] = useState({
    key: defaultColumn,
    direction: defaultDirection,
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !data) return data;

    const sortableData = [...data];

    sortableData.sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue, undefined, { sensitivity: 'base' })
          : bValue.localeCompare(aValue, undefined, { sensitivity: 'base' });
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle dates
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // Fallback to string comparison
      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction;
  };

  return {
    sortedData,
    sortConfig,
    requestSort,
    getSortIndicator,
  };
}

/**
 * Helper function to get nested object values using dot notation
 * @param {Object} obj - The object to get value from
 * @param {string} path - The path to the value (e.g., 'user.name')
 * @returns {*} - The value at the path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
