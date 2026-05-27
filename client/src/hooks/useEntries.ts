import { useQuery } from '@tanstack/react-query';
import { fetchEntries } from '../services/api';

export function useEntries() {
  return useQuery({
    queryKey: ['entries'],
    queryFn: fetchEntries,
    staleTime: 30_000,
  });
}
