import React from "react";
import "./styles/App.css";
import { Switch, BrowserRouter } from "react-router-dom";
import { CustomThemeProvider } from "./api/ThemeProvider";
import { SnackbarProvider } from "notistack";
import { StyledEngineProvider } from "@mui/material/styles";
import { StylesProvider } from "@material-ui/core/styles";
import { HomeVirtualBG } from "./screens/HomeVirtualBG";

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <StylesProvider injectFirst>
        <CustomThemeProvider>
          <SnackbarProvider maxSnack={2} autoHideDuration={2000}>
            <BrowserRouter>
              <Switch>
                <HomeVirtualBG/>
              </Switch>
            </BrowserRouter>
          </SnackbarProvider>
        </CustomThemeProvider>
      </StylesProvider>
    </StyledEngineProvider>
  );
}

export default App;