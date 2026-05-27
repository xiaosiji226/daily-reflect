import { useMutation, useQueryClient } from '@tanstack/react-query';
import { summarizeDay } from '../services/api';

export function useSummarize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => summarizeDay(date),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entry', data.date] });
    },
  });
}
