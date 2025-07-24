import { lazy } from 'react';

// Utility function to create lazy imports with better error handling
export const lazyImport = (importFunc: () => Promise<any>) => {
  return lazy(() => 
    importFunc().catch(err => {
      console.error('Failed to load component:', err);
      // Return a fallback component
      return {
        default: () => (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-red-500">Failed to load component</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      };
    })
  );
};
