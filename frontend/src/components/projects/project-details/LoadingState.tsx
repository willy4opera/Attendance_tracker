import React from 'react'
import theme from '../../../config/theme'

export function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
           style={{ borderColor: theme.colors.secondary }}></div>
    </div>
  )
}
