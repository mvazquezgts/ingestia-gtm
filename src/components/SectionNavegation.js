import React, { useEffect, useState, useRef } from 'react'
import { pSectionActivatedOptions } from "../utils/parameters";
import { Paper } from "@material-ui/core";
import { Box, Button, IconButton, Input } from '@material-ui/core';
import { ArrowBackIos, ArrowForwardIos, Web } from '@material-ui/icons';

export function SectionNavegation(props) {

    const { sectionActivated, setSectionActivated } = props

    useEffect(() => {

    }, [])

    function handleStepsScreen( orientation ){
        let newSectionActivated = sectionActivated + orientation
        if (newSectionActivated > 2){
            newSectionActivated = 0
        }
        if (newSectionActivated<0){
            newSectionActivated = 2
        }
        setSectionActivated(newSectionActivated)
    }

    return (
        <>
        <div>
                <Paper style={{width: '90%', margin: '5%'}} elevation={2}>
                    <div style={{ 
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        fontSize: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        backgroundColor: '#2b56ff',
                        color: 'white',
                        marginBottom: '-5%'
                    }}> 
                        <IconButton onClick={() => handleStepsScreen(-1)}>
                            <ArrowBackIos style={{ color: 'white' }} />
                        </IconButton>

                        {sectionActivated === pSectionActivatedOptions.VIDEO ? "EVALUACIÓN SUBJETIVA" : sectionActivated === pSectionActivatedOptions.EVALUATION ? "EVALUACIÓN OBJETIVA" : "WEB-RTC"}

                        <IconButton onClick={() => handleStepsScreen(1)}>
                            <ArrowForwardIos style={{ color: 'white' }} />
                        </IconButton>
                    </div>
                </Paper>
        </div>
        
        </>
    )
}