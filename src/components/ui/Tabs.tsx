import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs');
  }
  return context;
}

/**
 * Tabs Root Component
 */
export interface TabsProps {
  /**
   * Default active tab value
   */
  defaultValue: string;
  /**
   * Controlled active tab value
   */
  value?: string;
  /**
   * Callback when tab changes
   */
  onValueChange?: (value: string) => void;
  /**
   * Children (TabsList, TabsContent)
   */
  children: React.ReactNode;
  /**
   * Additional CSS class
   */
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  
  const activeTab = value !== undefined ? value : internalValue;
  
  const setActiveTab = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/**
 * TabsList Component
 */
export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1',
          className
        )}
        role="tablist"
        {...props}
      />
    );
  }
);
TabsList.displayName = 'TabsList';

/**
 * TabsTrigger Component
 */
export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Tab value
   */
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { activeTab, setActiveTab } = useTabsContext();
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-rose-500 focus-visible:ring-offset-2',
          isActive
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
          className
        )}
        onClick={() => setActiveTab(value)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

/**
 * TabsContent Component
 */
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Tab value
   */
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const { activeTab } = useTabsContext();

    if (activeTab !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn('mt-4', className)}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';
