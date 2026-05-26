import { useState, useCallback } from 'react';

interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
}

export function usePagination(defaultPageSize = 20) {
  const [state, setState] = useState<PaginationState>({
    page: 1,
    pageSize: defaultPageSize,
    totalCount: 0,
  });

  const totalPages = Math.max(1, Math.ceil(state.totalCount / state.pageSize));

  const setPage = useCallback((page: number) => {
    setState((s) => ({ ...s, page: Math.max(1, page) }));
  }, []);

  const setTotalCount = useCallback((count: number) => {
    setState((s) => ({ ...s, totalCount: count }));
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({ ...s, page: 1 }));
  }, []);

  return {
    ...state,
    totalPages,
    setPage,
    setTotalCount,
    reset,
  };
}
