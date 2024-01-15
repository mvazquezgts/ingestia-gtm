import { FormControlLabel, Switch, useTheme } from "@material-ui/core";
import { Brightness4, Brightness7 } from "@material-ui/icons";
import { useCustomTheme } from "../../api/ThemeProvider";
import { useStreamProvider } from "../../api/StreamProvider";

export function ThemeButton({handleThemeSwitch, ...rest }) {
    const theme = useTheme();
    const { toggleTheme, setToggleTheme } = useCustomTheme(false)
    const { setShowStreamProviderVideos } = useStreamProvider()

    return (
        <FormControlLabel {...rest}
            control={
                <>
                    < Switch color="default" onClick={()=> {setToggleTheme(!toggleTheme); setShowStreamProviderVideos(!toggleTheme)}} checked={toggleTheme || false} />
                    {theme.palette.type === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </>}
            labelPlacement="start"
        />
    )
}