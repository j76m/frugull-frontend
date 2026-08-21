import { createContext, useContext, useState } from 'react';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [allSelected, setAllSelected] = useState(true);
  const [selectedSubs, setSelectedSubs] = useState(new Set());

  function clearSelections() {
    setAllSelected(true);
    setSelectedSubs(new Set());
  }

  function toggleAll() {
    setAllSelected((prev) => {
      const next = !prev;
      if (next) setSelectedSubs(new Set());
      return next;
    });
  }

  function toggleSub(subName) {
    setSelectedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(subName)) next.delete(subName);
      else next.add(subName);
      // Picking any specific item means we're no longer showing everything.
      // If they uncheck their way back down to nothing, fall back to "All".
      setAllSelected(next.size === 0);
      return next;
    });
  }

  const value = { allSelected, selectedSubs, toggleAll, toggleSub, clearSelections };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}