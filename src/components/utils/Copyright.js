import React from 'react';
import { Divider, Typography } from '@material-ui/core';

export function Copyright() {

    const footer_text = 'GTM - Ingestia '
    return (
        <div>
            <Divider />
            <Typography variant="body2" color="textSecondary" align="center">
                {'Copyright © '}
                {footer_text}
                {new Date().getFullYear()}
                {'.'}
            </Typography>
        </div>
    );
}