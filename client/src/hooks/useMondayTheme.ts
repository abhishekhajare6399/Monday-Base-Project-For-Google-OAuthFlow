import { useState, useEffect } from 'react';
import mondaySdk from 'monday-sdk-js';

const monday = mondaySdk();

export type MondayTheme = 'light' | 'dark' | 'black';

interface MondayContext {
  theme?: MondayTheme;
  [key: string]: any;
}

/**
 * Custom hook to get and listen to Monday.com theme changes
 * @returns The current Monday theme (light, dark, or black)
 */
export const useMondayTheme = (): MondayTheme => {
  const [theme, setTheme] = useState<MondayTheme>('light'); // Default to light theme

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeTheme = async () => {
      try {
        // Get initial context including theme
        const context = await monday.get('context') as { data?: MondayContext };
        
        if (context?.data?.theme) {
          setTheme(context.data.theme);
        }

        // Listen for theme changes
        unsubscribe = monday.listen('context', (res: { data?: MondayContext }) => {
          if (res?.data?.theme) {
            setTheme(res.data.theme);
          }
        });
      } catch (error) {
        console.error('Error getting Monday theme:', error);
        setTheme('light');
      }
    };

    initializeTheme();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return theme;
};

