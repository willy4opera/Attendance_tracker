// Extend the Window interface for OAuth popup handling
interface Window {
  _timeout?: NodeJS.Timeout;
  processedOAuthCodes?: Set<string>;
}
