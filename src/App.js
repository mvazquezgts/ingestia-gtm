import React from "react";
import "./styles/App.css";
import { Switch, BrowserRouter } from "react-router-dom";
import { CustomThemeProvider } from "./api/ThemeProvider";
import { SnackbarProvider } from "notistack";
import { StyledEngineProvider } from "@mui/material/styles";
import { StylesProvider } from "@material-ui/core/styles";
import { Home } from "./screens/Home";

import { StreamProvider } from "./api/StreamProvider";
import { SegmenterProvider } from "./api/SegmenterProvider";

function App() {
  return (
    <StyledEngineProvider injectFirst>
      <StylesProvider injectFirst>
        <CustomThemeProvider>
          <SnackbarProvider maxSnack={2} autoHideDuration={2000}>
            <BrowserRouter>
              <Switch>
                <SegmenterProvider>
                  <StreamProvider>
                    <Home/>
                  </StreamProvider>
                </SegmenterProvider>
              </Switch>
            </BrowserRouter>
          </SnackbarProvider>
        </CustomThemeProvider>
      </StylesProvider>
    </StyledEngineProvider>
  );
}

export default App;