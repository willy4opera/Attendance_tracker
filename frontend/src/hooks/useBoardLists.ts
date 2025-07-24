import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BoardList, CreateBoardListDto, UpdateBoardListDto } from '../types';
import boardService from '../services/boardService';

export const useBoardLists = (boardId: number) => {
  const queryClient = useQueryClient();

  // Fetch board lists with caching
  const {
    data: lists = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['boardLists', boardId],
    queryFn: () => boardService.getBoardLists(boardId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    enabled: !!boardId,
    retry: (failureCount, error: any) => {
      // Don't retry on 429 errors
      if (error?.response?.status === 429) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: (data: CreateBoardListDto) => 
      boardService.createBoardList(boardId, data),
    onSuccess: (newList) => {
      queryClient.setQueryData(['boardLists', boardId], (old: BoardList[] = []) => 
        [...old, newList]
      );
    },
  });

  // Update list mutation
  const updateListMutation = useMutation({
    mutationFn: ({ listId, data }: { listId: number; data: UpdateBoardListDto }) =>
      boardService.updateBoardList(boardId, listId, data),
    onSuccess: (updatedList, { listId }) => {
      queryClient.setQueryData(['boardLists', boardId], (old: BoardList[] = []) =>
        old.map(list => list.id === listId ? updatedList : list)
      );
    },
  });

  // Delete list mutation
  const deleteListMutation = useMutation({
    mutationFn: (listId: number) => 
      boardService.deleteBoardList(boardId, listId),
    onSuccess: (_, listId) => {
      queryClient.setQueryData(['boardLists', boardId], (old: BoardList[] = []) =>
        old.filter(list => list.id !== listId)
      );
    },
  });

  return {
    lists,
    isLoading,
    error: error?.message || null,
    createList: createListMutation.mutateAsync,
    updateList: updateListMutation.mutateAsync,
    deleteList: deleteListMutation.mutateAsync,
    refetch,
  };
};
