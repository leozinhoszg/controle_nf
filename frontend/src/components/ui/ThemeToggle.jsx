import { useState, useEffect, useCallback, useRef } from 'react';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, []);

  // Limpa timeout pendente ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const applyTheme = useCallback((newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setIsTransitioning(true);

    // View Transitions API — cross-fade via GPU, sem wildcard selector
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        applyTheme(newTheme);
      });
      transition.finished.then(() => setIsTransitioning(false));
      return;
    }

    // Fallback: transição via classe em elementos-chave
    document.documentElement.classList.add('theme-transitioning');

    // Double rAF garante que o browser aplicou a classe antes da mudança
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applyTheme(newTheme);
      });
    });

    timeoutRef.current = setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 400);
  }, [theme, applyTheme]);

  return (
    <button
      onClick={toggleTheme}
      disabled={isTransitioning}
      className={`btn btn-ghost btn-sm btn-square ${className}`}
      title={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
    >
      <span
        className={`inline-block transition-transform duration-300 ${isTransitioning ? 'rotate-180 scale-110' : ''}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {theme === 'light' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </span>
    </button>
  );
}
