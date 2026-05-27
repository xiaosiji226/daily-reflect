import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addNote } from '../services/api';

export function useSubmitNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ text, images, date }: { text: string; images: File[]; date?: string }) =>
      addNote(text, images, date),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['entry', data.date] });
    },
  });
}
