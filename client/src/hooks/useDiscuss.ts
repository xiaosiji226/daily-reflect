import { useMutation, useQueryClient } from '@tanstack/react-query';
import { discussMessage } from '../services/api';
import type { EntryDetail } from '../types';

export function useDiscuss() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, message }: { date: string; message: string }) =>
      discussMessage(date, message),
    onMutate: async ({ date, message }) => {
      await queryClient.cancelQueries({ queryKey: ['entry', date] });
      const prev = queryClient.getQueryData<EntryDetail>(['entry', date]);
      if (prev) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        queryClient.setQueryData<EntryDetail>(['entry', date], {
          ...prev,
          discussion: [
            ...prev.discussion,
            { role: 'user', time: timeStr, content: message },
          ],
        });
      }
      return { prev };
    },
    onSuccess: (data: EntryDetail, { date }: { date: string }) => {
      queryClient.setQueryData(['entry', date], data);
    },
    onError: (_err, { date }: { date: string }, context: { prev?: EntryDetail } | undefined) => {
      if (context?.prev) {
        queryClient.setQueryData(['entry', date], context.prev);
      }
    },
  });
}
