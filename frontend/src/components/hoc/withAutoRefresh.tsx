import React, { ComponentType, useEffect } from 'react';
import { useRefresh, useAutoRefresh } from '../../contexts/RefreshContext';

interface WithAutoRefreshOptions {
  resourceType: string;
  refreshOnAction?: boolean;
  maxAge?: number;
}

export function withAutoRefresh<P extends object>(
  Component: ComponentType<P>,
  options: WithAutoRefreshOptions
) {
  return (props: P) => {
    const { resourceType, refreshOnAction = true, maxAge } = options;
    const { triggerRefresh } = useRefresh();

    // Wrap any action prop to trigger refresh after completion
    const wrappedProps = { ...props };
    
    if (refreshOnAction) {
      // Common action prop names
      const actionPropNames = ['onSave', 'onDelete', 'onUpdate', 'onSubmit', 'onChange'];
      
      actionPropNames.forEach(propName => {
        const originalProp = (props as any)[propName];
        if (typeof originalProp === 'function') {
          (wrappedProps as any)[propName] = async (...args: any[]) => {
            try {
              const result = await originalProp(...args);
              // Trigger refresh after successful action
              console.log(`✅ Action ${propName} completed, triggering refresh for ${resourceType}`);
              triggerRefresh(resourceType);
              return result;
            } catch (error) {
              console.error(`❌ Action ${propName} failed:`, error);
              throw error;
            }
          };
        }
      });
    }

    return <Component {...wrappedProps} />;
  };
}
