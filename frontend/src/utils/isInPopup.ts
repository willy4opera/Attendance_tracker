// Check if the current window is a popup
export function isInPopup(): boolean {
  // Check if window has an opener and is not the same as current window
  if (window.opener && window.opener !== window) {
    return true;
  }
  
  // Check window features that indicate it's a popup
  if (window.innerWidth < 800 || window.innerHeight < 800) {
    // Small window size might indicate popup
    return true;
  }
  
  // Check if window name matches our OAuth popup pattern
  if (window.name && (window.name.includes('_Login') || window.name.includes('oauth'))) {
    return true;
  }
  
  return false;
}
