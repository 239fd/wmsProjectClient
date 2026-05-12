import { useState, useEffect, useCallback } from 'react';

export const useDirectoryFetch = (fetcher, deps = [], { fallback = [] } = {}) => {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      const list = Array.isArray(res) ? res : (res?.content || res || fallback);
      setData(list);
      return list;
    } catch (err) {
      setError(err);
      setData(fallback);
      return null;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, setData };
};

export default useDirectoryFetch;
