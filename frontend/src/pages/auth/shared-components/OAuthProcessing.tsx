import React from 'react'
import theme from '../../../config/theme'

interface OAuthProcessingProps {
  provider?: string | null
}

const OAuthProcessing: React.FC<OAuthProcessingProps> = ({ provider }) => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.default }}>
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: theme.colors.primary }}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: theme.colors.background.paper }}></div>
          </div>
        </div>
        <p className="mt-4 text-lg font-medium" style={{ color: theme.colors.secondary }}>
          {provider ? `Completing ${provider} authentication...` : 'Processing authentication...'}
        </p>
        <p className="mt-2 text-sm" style={{ color: theme.colors.secondary, opacity: 0.7 }}>
          Please wait while we securely log you in
        </p>
      </div>
    </div>
  )
}

export default OAuthProcessing
