import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteNote } from '../services/api';

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, noteId }: { date: string; noteId: string }) => deleteNote(date, noteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['entry', data.date] });
    },
  });
}
