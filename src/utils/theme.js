
export const lightTheme = {
    palette: {
        mode: 'light',
        type: 'light',
        primary: {
            main: '#5ea0d4',
        },
        secondary: {
            main: '#ed2f6e'
        }
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 425,
            md: 768,
            lg: 1024,
            xl: 1440,
        }
    },
    typography: {
        fontFamily: "'Roboto', sans-serif",
        button: { lineHeight: "normal" }
    }
};

export const darkTheme = {
    palette: {
        mode: 'dark',
        type: 'dark',
        primary: {
            main: '#5EA0D4',
        },
        secondary: {
            main: '#ed2f6e'
        },
        background: {
            paper: '#2e2e2e',
            default: '#242424',
        }
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 425,
            md: 768,
            lg: 1024,
            xl: 1440,
        }
    },
    typography: {
        fontFamily: "'Roboto', sans-serif",
        button: { lineHeight: "normal" }
    }
};