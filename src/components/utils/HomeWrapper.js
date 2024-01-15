import React, { useEffect, useState }  from 'react';
import { Box } from '@material-ui/core';
import {CustomDrawer} from '../drawer/CustomDrawer';
import {Copyright} from './Copyright';
import "../../styles/devices/mob_HomeWrapper.css";

export function HomeWrapper({ children }) {
    const [showDrawer, setShowDrawer] = useState(true);

    return (
        <div className="sig_Home_Root">
            <CustomDrawer />
            <main className={`sig_Home_Content ${showDrawer ? 'sig_Home_ContentVisibleDrawer' : 'sig_Home_ContentHiddenDrawer'}`}>
                <hr></hr>
                {children}
                <br className='sig_Home_RemovableElement' />
                <Box className='sig_Home_Copyright'>
                    <Copyright />
                </Box>
            </main>
        </div>
    )
}