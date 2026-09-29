import { useCallback, useEffect, useState } from 'react';
import { plannerApiRequest } from '../utils/apiConfig.js';

export const STAR_PODIUM_DAYS = 30;

// Bestenliste der zuletzt verdienten Sterne; lädt bei Änderungen neu.
export function useStarPodium({ days = STAR_PODIUM_DAYS, members } = {}) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await plannerApiRequest(
        `/api/stars/leaderboard?days=${encodeURIComponent(days)}`
      );
      setEntries(Array.isArray(data?.entries) ? data.entries : []);
      setError('');
    } catch (requestError) {
      setError(requestError?.message || 'error');
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await load();
    };
    run();
    return () => {
      active = false;
    };
    // members ändert sich, sobald Sterne gebucht werden – dann neu laden.
  }, [load, members]);

  return { entries, isLoading, error, reload: load };
}
