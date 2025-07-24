import React from 'react'
import { FaGoogle, FaFacebook, FaGithub, FaLinkedin, FaMicrosoft, FaApple } from 'react-icons/fa'
import theme from '../../../config/theme'
import { toastInfo } from '../../../utils/toastHelpers'

export interface SocialProvider {
  name: string
  icon: React.ReactNode
  color: string
  available: boolean
}

interface SocialLoginButtonsProps {
  onSocialLogin: (provider: string) => void
}

export const socialProviders: SocialProvider[] = [
  { name: 'Google', icon: <FaGoogle />, color: '#DB4437', available: true },
  { name: 'Facebook', icon: <FaFacebook />, color: '#1877F2', available: true },
  { name: 'GitHub', icon: <FaGithub />, color: '#333333', available: true },
  { name: 'LinkedIn', icon: <FaLinkedin />, color: '#0A66C2', available: true },
  { name: 'Microsoft', icon: <FaMicrosoft />, color: '#5E5E5E', available: false },
  { name: 'Apple', icon: <FaApple />, color: '#000000', available: false },
]

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ onSocialLogin }) => {
  const handleClick = (provider: SocialProvider) => {
    if (!provider.available) {
      toastInfo(`${provider.name} login coming soon!`)
      return
    }
    onSocialLogin(provider.name)
  }

  return (
    <>
      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2" style={{ backgroundColor: theme.colors.background.paper, color: theme.colors.secondary }}>
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {socialProviders.map((provider) => (
          <button
            key={provider.name}
            type="button"
            onClick={() => handleClick(provider)}
            className="group relative flex items-center justify-center py-2 px-3 border rounded-lg transition-all duration-300 transform hover:scale-95"
            style={{
              backgroundColor: theme.colors.secondary,
              borderColor: theme.colors.secondary,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (provider.available) {
                // Available providers: Switch colors on hover
                e.currentTarget.style.backgroundColor = theme.colors.primary
                e.currentTarget.style.borderColor = theme.colors.primary
                // Change icon color to secondary
                const icon = e.currentTarget.querySelector('svg')
                if (icon) {
                  icon.style.color = theme.colors.secondary
                }
              } else {
                // Unavailable providers: Show inactive state on hover
                e.currentTarget.style.opacity = '0.5'
                e.currentTarget.style.cursor = 'not-allowed'
              }
            }}
            onMouseLeave={(e) => {
              if (provider.available) {
                // Available providers: Restore original colors
                e.currentTarget.style.backgroundColor = theme.colors.secondary
                e.currentTarget.style.borderColor = theme.colors.secondary
                // Restore icon color to primary
                const icon = e.currentTarget.querySelector('svg')
                if (icon) {
                  icon.style.color = theme.colors.primary
                }
              } else {
                // Unavailable providers: Restore normal appearance
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.cursor = 'pointer'
              }
            }}
          >
            <span className="text-lg transition-all duration-300">
              {React.cloneElement(provider.icon as React.ReactElement, {
                className: "transition-colors duration-300",
                style: { color: theme.colors.primary }
              })}
            </span>
            {/* Hover effect overlay */}
            <div 
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"
              style={{ backgroundColor: 'white' }}
            />
          </button>
        ))}
      </div>
    </>
  )
}

export default SocialLoginButtons
