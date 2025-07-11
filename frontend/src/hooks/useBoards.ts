import { useState, useEffect, useCallback } from 'react'
import { boardService } from '../services/boardService'
import type { Board, BoardsResponse, CreateBoardDto, UpdateBoardDto, BoardWithStats, BoardList } from '../types'

export const useBoards = (params?: {
  page?: number
  limit?: number
  search?: string
  projectId?: string
  visibility?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}) => {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchBoards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Only pass supported parameters to the API
      const apiParams: {
        page?: number
        limit?: number
        search?: string
        projectId?: string
        visibility?: string
      } = {}
      
      if (params?.page) apiParams.page = params.page
      if (params?.limit) apiParams.limit = params.limit
      if (params?.search) apiParams.search = params.search
      if (params?.projectId) apiParams.projectId = params.projectId
      if (params?.visibility && params.visibility !== 'all') apiParams.visibility = params.visibility
      
      const response: BoardsResponse = await boardService.getBoards(apiParams)
      
      // Handle client-side sorting since API doesn't support it
      let sortedBoards = response.boards
      if (params?.sortBy) {
        sortedBoards = [...response.boards].sort((a, b) => {
          let aValue: any = a[params.sortBy as keyof Board]
          let bValue: any = b[params.sortBy as keyof Board]
          
          // Handle date sorting
          if (params.sortBy === 'createdAt' || params.sortBy === 'updatedAt') {
            aValue = new Date(aValue).getTime()
            bValue = new Date(bValue).getTime()
          }
          
          // Handle string sorting
          if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase()
            bValue = bValue.toLowerCase()
          }
          
          if (params.sortOrder === 'DESC') {
            return bValue > aValue ? 1 : -1
          } else {
            return aValue > bValue ? 1 : -1
          }
        })
      }
      
      setBoards(sortedBoards)
      setTotal(response.total)
      setTotalPages(response.totalPages)
      setCurrentPage(response.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch boards')
    } finally {
      setLoading(false)
    }
  }, [params?.page, params?.limit, params?.search, params?.projectId, params?.visibility, params?.sortBy, params?.sortOrder])

  const createBoard = async (data: CreateBoardDto): Promise<Board | null> => {
    try {
      const newBoard = await boardService.createBoard(data)
      setBoards(prev => [newBoard, ...prev])
      return newBoard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board')
      return null
    }
  }

  const updateBoard = async (id: string | number, data: UpdateBoardDto): Promise<Board | null> => {
    try {
      const updatedBoard = await boardService.updateBoard(id, data)
      setBoards(prev => prev.map(board =>
        board.id === Number(id) ? updatedBoard : board
      ))
      return updatedBoard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update board')
      return null
    }
  }

  const deleteBoard = async (id: string | number): Promise<boolean> => {
    try {
      await boardService.deleteBoard(id)
      setBoards(prev => prev.filter(board => board.id !== Number(id)))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete board')
      return false
    }
  }

  const archiveBoard = async (id: string | number): Promise<Board | null> => {
    try {
      const archivedBoard = await boardService.archiveBoard(id)
      setBoards(prev => prev.map(board =>
        board.id === Number(id) ? archivedBoard : board
      ))
      return archivedBoard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive board')
      return null
    }
  }

  const duplicateBoard = async (id: string | number, name: string): Promise<Board | null> => {
    try {
      const duplicatedBoard = await boardService.duplicateBoard(id, name)
      setBoards(prev => [duplicatedBoard, ...prev])
      return duplicatedBoard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate board')
      return null
    }
  }

  const refreshBoards = () => {
    fetchBoards()
  }

  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  return {
    boards,
    loading,
    error,
    total,
    totalPages,
    currentPage,
    createBoard,
    updateBoard,
    deleteBoard,
    archiveBoard,
    duplicateBoard,
    refreshBoards,
    refetch: fetchBoards
  }
}

export const useBoard = (id: string | number) => {
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBoard = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)
    try {
      const response = await boardService.getBoard(id)
      setBoard(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch board')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  return {
    board,
    loading,
    error,
    refetch: fetchBoard
  }
}

export const useBoardWithStats = (id: string | number) => {
  const [board, setBoard] = useState<BoardWithStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBoardWithStats = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)
    try {
      const response = await boardService.getBoardWithStats(id)
      setBoard(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch board stats')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBoardWithStats()
  }, [fetchBoardWithStats])

  return {
    board,
    loading,
    error,
    refetch: fetchBoardWithStats
  }
}

export const useBoardLists = (boardId: string | number) => {
  const [lists, setLists] = useState<BoardList[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLists = useCallback(async () => {
    if (!boardId) return

    setLoading(true)
    setError(null)
    try {
      const response = await boardService.getBoardLists(boardId)
      setLists(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch board lists')
    } finally {
      setLoading(false)
    }
  }, [boardId])

  const createList = async (data: { name: string; position: number }): Promise<BoardList | null> => {
    try {
      const newList = await boardService.createBoardList(boardId, data)
      setLists(prev => [...prev, newList].sort((a, b) => a.position - b.position))
      return newList
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create list')
      return null
    }
  }

  const updateList = async (listId: string | number, data: { name?: string; position?: number }): Promise<BoardList | null> => {
    try {
      const updatedList = await boardService.updateBoardList(boardId, listId, data)
      setLists(prev => prev.map(list =>
        list.id === Number(listId) ? updatedList : list
      ).sort((a, b) => a.position - b.position))
      return updatedList
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update list')
      return null
    }
  }

  const deleteList = async (listId: string | number): Promise<boolean> => {
    try {
      await boardService.deleteBoardList(boardId, listId)
      setLists(prev => prev.filter(list => list.id !== Number(listId)))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete list')
      return false
    }
  }

  const reorderLists = async (listIds: string[]): Promise<boolean> => {
    try {
      await boardService.reorderLists(boardId, listIds)
      // Update local state to reflect new order
      setLists(prev => {
        const orderedLists = listIds.map(id => prev.find(list => list.id === Number(id))!).filter(Boolean)
        return orderedLists
      })
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder lists')
      return false
    }
  }

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  return {
    lists,
    loading,
    error,
    createList,
    updateList,
    deleteList,
    reorderLists,
    refreshLists: fetchLists
  }
}
