import React, { useState } from 'react';
import clsx from 'clsx';
import { useTheme } from '@material-ui/core/styles';
import { AppBar, Drawer, Toolbar, CssBaseline } from '@material-ui/core/';
import { IconButton } from '@material-ui/core/';
import { Menu, ChevronLeft, ChevronRight, Close } from '@material-ui/icons/';

import { ThemeButton } from './ThemeButton.js'
import { IngestiaName } from '../utils/IngestiaName.js';

import "../../styles/devices/mob_Drawer.css";

export function CustomDrawer() {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    /* Drawer actions */
    const handleDrawerOpen = () => {
        if (showDrawer === true) {
            setOpen(true);
        }
    };
    const handleDrawerClose = () => {
        setOpen(false);
    };

    const handleThemeSwitch = (event, newDarkMode) => {
        setDarkMode(newDarkMode)
    };


    return (
        <div className={ darkMode ? "sig_Home_DrawerRoot sig_Home_DarkMode" : "sig_Home_DrawerRoot"} >
            <CssBaseline />
            <AppBar
                color='inherit'
                position="fixed"
                className={clsx('sig_Home_MenuBar', {
                    'sig_Home_MenuBarShifted': open
                })}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        //edge="start"
                        className={clsx('tourSearchLSE_1 sig_Home_MenuButton sig_Home_ChangeOnDarkMode', {
                            'sig_Home_MenuButtonShifted': open,
                            'sig_Home_MenuButtonDisabled': !showDrawer,
                        })}>
                        <Menu />
                    </IconButton>
                    
                    <IngestiaName className='sig_Home_DrawerTitle' width={160}/> 

                    <div className='sig_Home_ThemeSwitch sig_Home_ChangeOnDarkMode'>
                        <div style={{display: 'flex'}}>
                            <ThemeButton className='sig_Home_DrawerThemeSwitch sig_Home_ChangeOnDarkMode' handleThemeSwitch={handleThemeSwitch} />
                        </div>
                    </div>

                </Toolbar>
            </AppBar>
            <div className={clsx('sig_Home_DrawerBkg', {
                'sig_Home_DrawerOpenBkg': open,
                'sig_Home_DrawerCloseBkg': !open,
            })} onClick={handleDrawerClose}>            
            </div>
            <Drawer
                variant="permanent"
                className={clsx('sig_Home_Drawer', {
                    'sig_Home_DrawerOpen': open,
                    'sig_Home_DrawerClose': !open,
                })}
                classes={{
                    paper: clsx({
                        'sig_Home_DrawerOpen': open,
                        'sig_Home_DrawerClose': !open,
                        'sig_Home_DrawerHidden': !showDrawer,
                        'sig_Home_DrawerVisible': showDrawer,
                    }),
                }}
                >               
                <div className='sig_Home_ToolbarSpace'>
                    <IconButton className='sig_Home_ChangeOnDarkMode' onClick={handleDrawerClose}>
                        {theme.direction === 'rtl' ? <ChevronRight /> : <ChevronLeft />}
                    </IconButton>
                </div>
            </Drawer>
        </div >
    );
}
