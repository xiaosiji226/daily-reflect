import { useQuery } from '@tanstack/react-query';
import { fetchEntry } from '../services/api';

export function useEntry(date: string | null) {
  return useQuery({
    queryKey: ['entry', date],
    queryFn: () => fetchEntry(date!),
    enabled: !!date,
    staleTime: 0,
  });
}
