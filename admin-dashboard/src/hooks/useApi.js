import { useEffect, useState } from 'react';

export function useApi(loader, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    loader()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        const message = err.response?.data?.detail || err.message || 'Something went wrong';
        if (message.includes('session expired')) {
          window.location.assign('/login');
          return;
        }
        if (active) setError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, deps);

  return { data, setData, loading, error };
}
