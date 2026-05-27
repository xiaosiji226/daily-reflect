import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extractKeywords } from '../services/api';

export function useKeywords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => extractKeywords(date),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entry', data.date] });
    },
  });
}
