// @AI-HINT: Generic selection hook for tables/lists supporting toggle, select all on current page, and clear.
'use client';

import { useCallback, useMemo, useState } from 'react';

export function useSelection<T extends string | number>(allIds: T[]) {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const isSelected = useCallback((id: T) => selected.has(id), [selected]);
  const toggle = useCallback((id: T) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const selectMany = useCallback((ids: T[]) => {
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  const deselectMany = useCallback((ids: T[]) => {
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  const allSelected = useMemo(() => selected.size > 0 && allIds.every(id => selected.has(id)), [selected, allIds]);
  const count = selected.size;

  return { selected, isSelected, toggle, clear, selectMany, deselectMany, allSelected, count } as const;
}
