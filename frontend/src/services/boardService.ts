import api from './api'
import type {
  Board,
  BoardsResponse,
  CreateBoardDto,
  UpdateBoardDto,
  BoardWithStats,
  BoardList,
  CreateBoardListDto,
  UpdateBoardListDto,
  BoardMember,
  BoardRole
} from '../types'
import { deduplicateRequest, cachedRequest } from '../utils/requestOptimizer'

export const boardService = {
  // Get all boards with deduplication
  async getBoards(params?: {
    page?: number
    limit?: number
    search?: string
    projectId?: string
    visibility?: string
  }): Promise<BoardsResponse> {
    // Create a unique key for this request
    const key = `boards:${JSON.stringify(params || {})}`;
    
    return deduplicateRequest(key, async () => {
      // Filter out empty/undefined parameters
      const filteredParams: any = {}
      if (params?.page) filteredParams.page = params.page
      if (params?.limit) filteredParams.limit = params.limit
      if (params?.search && params.search.trim()) filteredParams.search = params.search
      if (params?.projectId && params.projectId.trim()) filteredParams.projectId = params.projectId
      if (params?.visibility && params.visibility.trim()) filteredParams.visibility = params.visibility

      const response = await api.get('/boards', { params: filteredParams })
      return response.data.data // Access the nested data property
    });
  },

  // Get board by ID with caching
  async getBoard(id: string | number): Promise<Board> {
    const key = `board:${id}`;
    
    return cachedRequest(key, async () => {
      const response = await api.get(`/boards/${id}`)
      return response.data.data // Access the nested data property
    }, 5 * 60 * 1000); // Cache for 5 minutes
  },

  // Get board with stats
  async getBoardWithStats(id: string | number): Promise<BoardWithStats> {
    const key = `board-stats:${id}`;
    
    return cachedRequest(key, async () => {
      const response = await api.get(`/boards/${id}/stats`)
      return response.data.data // Access the nested data property
    }, 5 * 60 * 1000); // Cache for 5 minutes
  },

  // Create new board
  async createBoard(data: CreateBoardDto): Promise<Board> {
    const response = await api.post('/boards', data)
    return response.data.data // Access the nested data property
  },

  // Update board
  async updateBoard(id: string | number, data: UpdateBoardDto): Promise<Board> {
    const response = await api.put(`/boards/${id}`, data)
    // Invalidate cache
    const key = `board:${id}`;
    const keyStats = `board-stats:${id}`;
    return response.data.data // Access the nested data property
  },

  // Delete board
  async deleteBoard(id: string | number): Promise<void> {
    await api.delete(`/boards/${id}`)
  },

  // Archive/Unarchive board
  async archiveBoard(id: string | number): Promise<Board> {
    const response = await api.patch(`/boards/${id}/archive`)
    return response.data.data // Access the nested data property
  },

  async unarchiveBoard(id: string | number): Promise<Board> {
    const response = await api.patch(`/boards/${id}/unarchive`)
    return response.data.data // Access the nested data property
  },

  // Board lists management with caching
  async getBoardLists(boardId: string | number): Promise<BoardList[]> {
    const key = `board-lists:${boardId}`;
    
    return cachedRequest(key, async () => {
      const response = await api.get(`/boards/${boardId}/lists`)
      return response.data.data // Access the nested data property
    }, 10 * 60 * 1000); // Cache for 10 minutes
  },

  async createBoardList(boardId: string | number, data: CreateBoardListDto): Promise<BoardList> {
    const response = await api.post(`/boards/${boardId}/lists`, data)
    // Invalidate cache
    const key = `board-lists:${boardId}`;
    return response.data.data // Access the nested data property
  },

  async updateBoardList(boardId: string | number, listId: string | number, data: UpdateBoardListDto): Promise<BoardList> {
    const response = await api.put(`/boards/${boardId}/lists/${listId}`, data)
    // Invalidate cache
    const key = `board-lists:${boardId}`;
    return response.data.data // Access the nested data property
  },

  async deleteBoardList(boardId: string | number, listId: string | number): Promise<void> {
    await api.delete(`/boards/${boardId}/lists/${listId}`)
    // Invalidate cache
    const key = `board-lists:${boardId}`;
  },

  async archiveBoardList(boardId: string | number, listId: string | number): Promise<BoardList> {
    const response = await api.patch(`/boards/${boardId}/lists/${listId}/archive`)
    return response.data.data // Access the nested data property
  },

  async unarchiveBoardList(boardId: string | number, listId: string | number): Promise<BoardList> {
    const response = await api.patch(`/boards/${boardId}/lists/${listId}/unarchive`)
    return response.data.data // Access the nested data property
  },

  // Reorder lists
  async reorderLists(boardId: string | number, listIds: string[]): Promise<void> {
    await api.patch(`/boards/${boardId}/lists/reorder`, { listIds })
  },

  // Board members management with caching
  async getBoardMembers(boardId: string | number): Promise<BoardMember[]> {
    const key = `board-members:${boardId}`;
    
    return cachedRequest(key, async () => {
      const response = await api.get(`/boards/${boardId}/members`)
      return response.data.data // Access the nested data property
    }, 10 * 60 * 1000); // Cache for 10 minutes
  },

  async addBoardMember(boardId: string | number, userId: string | number, role: BoardRole): Promise<BoardMember> {
    const response = await api.post(`/boards/${boardId}/members`, { userId, role })
    return response.data.data // Access the nested data property
  },

  async updateBoardMember(boardId: string | number, memberId: string | number, role: BoardRole): Promise<BoardMember> {
    const response = await api.put(`/boards/${boardId}/members/${memberId}`, { role })
    return response.data.data // Access the nested data property
  },

  async removeBoardMember(boardId: string | number, memberId: string | number): Promise<void> {
    await api.delete(`/boards/${boardId}/members/${memberId}`)
  },

  // Board search with deduplication
  async searchBoards(query: string): Promise<Board[]> {
    const key = `search-boards:${query}`;
    
    return deduplicateRequest(key, async () => {
      const response = await api.get(`/boards/search`, { params: { q: query } })
      return response.data.data // Access the nested data property
    });
  },

  // Get project boards with caching
  async getProjectBoards(projectId: string | number): Promise<Board[]> {
    const key = `project-boards:${projectId}`;
    
    return cachedRequest(key, async () => {
      const response = await api.get(`/projects/${projectId}/boards`)
      return response.data.data // Access the nested data property
    }, 10 * 60 * 1000); // Cache for 10 minutes
  },

  // Get user boards with caching
  async getUserBoards(userId: string | number): Promise<Board[]> {
    const key = `user-boards:${userId}`;
    
    return cachedRequest(key, async () => {
      const response = await api.get(`/users/${userId}/boards`)
      return response.data.data // Access the nested data property
    }, 5 * 60 * 1000); // Cache for 5 minutes
  },

  // Duplicate board
  async duplicateBoard(boardId: string | number, name: string): Promise<Board> {
    const response = await api.post(`/boards/${boardId}/duplicate`, { name })
    return response.data.data // Access the nested data property
  }
}

export default boardService
export type CreateBoardData = CreateBoardDto;
