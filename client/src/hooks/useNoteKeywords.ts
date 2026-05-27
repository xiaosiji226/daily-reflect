import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extractNoteKeywords } from '../services/api';

export function useNoteKeywords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, noteId }: { date: string; noteId: string }) => extractNoteKeywords(date, noteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entry', data.date] });
    },
  });
}
