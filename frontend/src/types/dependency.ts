export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF'

export interface TaskDependency {
  id: number
  predecessorTaskId: number
  successorTaskId: number
  dependencyType: DependencyType
  lagTime?: number // in hours, can be negative for lead time
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DependencyDisplay {
  id: number
  predecessorTask: {
    id: number
    title: string
    status: string
    dueDate?: string
    startDate?: string
  }
  successorTask: {
    id: number
    title: string
    status: string
    dueDate?: string
    startDate?: string
  }
  dependencyType: DependencyType
  lagTime?: number
  isActive: boolean
  violationStatus?: 'none' | 'warning' | 'violation'
  description: string
}

export interface DependencyRule {
  type: DependencyType
  name: string
  description: string
  icon: string
  color: string
  examples: string[]
  validationRules: {
    predecessor: string[]
    successor: string[]
  }
}

export interface DependencyValidation {
  isValid: boolean
  warnings: string[]
  errors: string[]
  suggestions: string[]
}

export interface CreateDependencyData {
  predecessorTaskId: number
  successorTaskId: number
  dependencyType: DependencyType
  lagTime?: number
}

export interface UpdateDependencyData {
  dependencyType?: DependencyType
  lagTime?: number
  isActive?: boolean
}
