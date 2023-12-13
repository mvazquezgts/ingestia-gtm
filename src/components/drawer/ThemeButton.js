import { FormControlLabel, Switch, useTheme } from "@material-ui/core";
import { Brightness4, Brightness7 } from "@material-ui/icons";
import { useCustomTheme } from "../../api/ThemeProvider";

export function ThemeButton({handleThemeSwitch, ...rest }) {
    const theme = useTheme();
    const { toggleTheme, setToggleTheme } = useCustomTheme(false)

    return (
        <FormControlLabel {...rest}
            control={
                <>
                    < Switch color="default" onClick={()=>setToggleTheme(!toggleTheme)} checked={toggleTheme || false} />
                    {theme.palette.type === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </>}
            labelPlacement="start"
        />
    )
}