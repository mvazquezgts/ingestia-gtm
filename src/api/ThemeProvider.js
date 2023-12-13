import { ThemeProvider } from '@material-ui/styles';
import React, { useContext, useState } from 'react'
import { darkTheme, lightTheme } from '../utils/theme';
import { createTheme } from '@mui/material/styles';
import { esES } from '@material-ui/core/locale';

const ThemeContext = React.createContext();

export function useCustomTheme() {
    return useContext(ThemeContext)
}

export function CustomThemeProvider({ children }) {
    /* Toggle theme */
    const [toggleTheme, setToggleTheme] = useState(null);
    const appliedTheme = toggleTheme ? darkTheme : lightTheme;
    const formatedTheme = createTheme(
        appliedTheme,
        esES
    );
    
    const value = { toggleTheme, setToggleTheme }

    return (
        <ThemeContext.Provider value={value}>
            <ThemeProvider theme={formatedTheme}>
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    )
}