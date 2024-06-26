import { useEffect } from 'react';

const useTheme = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const applyTheme = () => {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (darkModeMediaQuery.matches) {
          document.documentElement.classList.add('dark-mode');
          document.documentElement.classList.remove('light-mode');
        } else {
          document.documentElement.classList.add('light-mode');
          document.documentElement.classList.remove('dark-mode');
        }
      };

      applyTheme();
      
      const mediaQueryListener = window.matchMedia('(prefers-color-scheme: dark)').addListener(applyTheme);

      
      return () => {
        window.matchMedia('(prefers-color-scheme: dark)').removeListener(mediaQueryListener);
      };
    }
  }, []);
};

export default useTheme;
