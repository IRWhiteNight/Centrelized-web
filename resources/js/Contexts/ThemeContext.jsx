import {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined') {
            return 'dark';
        }

        try {
            const savedTheme = localStorage.getItem('pas-theme');

            if (savedTheme === 'light' || savedTheme === 'dark') {
                return savedTheme;
            }
        } catch {
            // Continue with the default theme if storage is unavailable.
        }

        return 'dark';
    });

    useEffect(() => {
        document.documentElement.dataset.theme = theme;

        try {
            localStorage.setItem('pas-theme', theme);
        } catch {
            // The theme still works for the current page.
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) =>
            currentTheme === 'dark' ? 'light' : 'dark'
        );
    };

    return (
        <ThemeContext.Provider
            value={{ theme, setTheme, toggleTheme }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error('useTheme must be used inside ThemeProvider');
    }

    return context;
}
