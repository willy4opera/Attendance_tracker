const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/components/modals/EmailVerificationModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the input field section
const inputStart = content.indexOf('<input');
const inputEnd = content.indexOf('/>', inputStart) + 2;

// Replace the input with a custom implementation
const newInput = `<div className="relative">
              <input
                type="text"
                value={showCode ? otp : otp.split('').map(() => '•').join('')}
                onChange={(e) => {
                  // Only process if it's a real change, not the masked display
                  if (e.target.value.includes('•')) return;
                  const value = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
                  if (value.length <= 6) {
                    setOtp(value);
                  }
                }}
                onKeyPress={handleKeyPress}
                maxLength={6}
                placeholder="••••••"
                className="w-full px-4 py-3 text-center text-lg font-semibold tracking-widest uppercase border border-gray-300 rounded-md focus:ring-2 focus:ring-[#fddc9a] focus:border-transparent"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>`;

// Find the label closing tag and the help text
const labelEnd = content.lastIndexOf('</label>', inputStart);
const helpTextStart = content.indexOf('<p className="text-xs', inputEnd);

// Replace the section
content = content.slice(0, labelEnd + 8) + '\n              ' + newInput + '\n              ' + content.slice(helpTextStart);

fs.writeFileSync(filePath, content);
console.log('✅ Updated verification input to show masked characters');
