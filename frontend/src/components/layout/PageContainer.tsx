import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export default function PageContainer({ children, noPadding = false }: PageContainerProps) {
  return (
    <div className={noPadding ? '' : 'px-4 lg:px-6 py-4 lg:py-6'}>
      {children}
    </div>
  );
}
