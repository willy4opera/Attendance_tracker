import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import theme from '../../../config/theme'

export function NotFoundState() {
  return (
    <div className="text-center py-12">
      <p style={{ color: theme.colors.text.secondary }}>Project not found</p>
      <Link 
        to="/projects" 
        className="mt-4 inline-flex items-center text-sm"
        style={{ color: theme.colors.secondary }}
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Projects
      </Link>
    </div>
  )
}
