import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reopenDiscussion } from '../services/api';
import type { EntryDetail } from '../types';

export function useReopen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => reopenDiscussion(date),
    onSuccess: (data: EntryDetail, date: string) => {
      queryClient.setQueryData(['entry', date], data);
    },
  });
}
