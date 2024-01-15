import React, { useEffect, useState, useRef } from "react";
import AccordionGroup from '@mui/joy/AccordionGroup';
import Accordion from '@mui/joy/Accordion';
import AccordionDetails, {
  accordionDetailsClasses,
} from '@mui/joy/AccordionDetails';
import AccordionSummary, {
  accordionSummaryClasses,
} from '@mui/joy/AccordionSummary';
import Switch from '@mui/joy/Switch';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import Avatar from '@mui/joy/Avatar';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import ListItemContent from '@mui/joy/ListItemContent';

import { useSegmenterProvider } from "../api/SegmenterProvider";
import { Chip } from '@material-ui/core'

import {Select, MenuItem } from '@mui/material';
import Slider from '@mui/material/Slider';

import {pSectionActivatedOptions } from "../utils/parameters";


import PhotoCameraFrontIcon from '@mui/icons-material/PhotoCameraFront';

import EngineeringIcon from '@mui/icons-material/Engineering';
import MemoryIcon from '@mui/icons-material/Memory';
import HardwareIcon from '@mui/icons-material/Hardware';
import SafetyDividerIcon from '@mui/icons-material/SafetyDivider';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';

import Brightness7Icon from '@mui/icons-material/Brightness7';
import ContrastIcon from '@mui/icons-material/Contrast';
import ColorLensIcon from '@mui/icons-material/ColorLens';

import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import SelectAllOutlinedIcon from '@mui/icons-material/SelectAllOutlined';

import { useStreamProvider } from "../api/StreamProvider";


export function SectionSettings(props) {
    const { sectionActivated } = props
    const { 
        statusSegmenter,
        setStatusSegmenter,
        fpsSegmenter,
        fpsSegmenterExact,

        configModelSegmenter,
        configDelegateSegmenter,
        configThresholdSegmenter,

        setConfigModelSegmenter,
        setConfigDelegateSegmenter,
        setConfigThresholdSegmenter,

        options_models_available,

        configCanvasOutBlurringActivate,
        setConfigCanvasOutBlurringActivate,
        configCanvasOutBlurringPixels,
        setConfigCanvasOutBlurringPixels,

    } = useSegmenterProvider();

    const { 
        options_resolutions_available,
        configResolutionInput,
        setConfigResolutionInput,

        options_canvas_out_available,
        configCanvasOut,
        setConfigCanvasOut,

        configFiltersActivateInput,
        setConfigFiltersActivateInput,
        configBrightnessInput,
        setConfigBrightnessInput,
        configContrastInput,
        setConfigContrastInput,
        configSaturateInput,
        setConfigSaturateInput
    } = useStreamProvider();


    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', width: '80%', margin: 'auto', borderRadius: '20px', backgroundColor: statusSegmenter ? "#07ff0730" : "#f3373729"}}>
            
            {sectionActivated !== pSectionActivatedOptions.EVALUATION &&
            
            <AccordionGroup
                variant="plain"
                transition="0.2s"
                sx={{
                    maxWidth: 500,
                    padding: '5px',
                    borderRadius: 'md',
                    [`& .${accordionDetailsClasses.content}.${accordionDetailsClasses.expanded}`]: {
                    paddingBlock: '1rem',
                    },
                    [`& .${accordionSummaryClasses.button}`]: {
                    paddingBlock: '1px',
                    },
                }}
                >
                <Accordion>
                    <AccordionSummary>
                    <Avatar color="primary">
                        <PhotoCameraFrontIcon />
                    </Avatar>
                    <ListItemContent>
                        <Typography level="title-md"> Vídeo </Typography>
                        <Typography level="body-sm">
                        Configurar vídeo de entrada.
                        </Typography>
                    </ListItemContent>
                    </AccordionSummary>
                        <AccordionDetails>
                            <FormControl orientation="horizontal" sx={{ gap: 1 }}>
                                <AspectRatioIcon fontSize="xl2" sx={{ mx: 1 }} />
                                <FormLabel> Resolución </FormLabel>
                                <Select
                                    labelId="model-select-label"
                                    id="model-select"
                                    value={configResolutionInput}
                                    onChange={(event) => setConfigResolutionInput(event.target.value)}
                                    sx={{ ml: 'auto', width: '60%', height: '30px' }}
                                >
                                    {Object.keys(options_resolutions_available).map((resolutionKey) => (
                                        <MenuItem key={resolutionKey} value={resolutionKey} style={{ display: 'flex' }}>
                                            {resolutionKey.replace(/_/g, ' ')}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl orientation="horizontal" sx={{ gap: 1 }}>
                                {/* <EmailRoundedIcon fontSize="xl2" sx={{ mx: 1 }} /> */}
                                <FormLabel> <strong>Filtros de entrada:</strong> {configFiltersActivateInput ? 'Encendido': 'Apagado'}</FormLabel>
                                <Switch checked={configFiltersActivateInput} onChange={()=> setConfigFiltersActivateInput(!configFiltersActivateInput)} size="sm" />
                            </FormControl>

                            {configFiltersActivateInput &&

                                <>
                                <FormControl orientation="horizontal" sx={{ gap: 1, alignItems: 'center' }}>
                                    <Brightness7Icon fontSize="xl2" sx={{ mx: 1 }} />
                                    <FormLabel>Brillo: {configBrightnessInput.toFixed(2)}</FormLabel>
                                    <Slider
                                        aria-label="Umbral"
                                        value={typeof configBrightnessInput === 'number' ? configBrightnessInput : 0}
                                        onChange={(event, newValue) => setConfigBrightnessInput(newValue)}
                                        min={0}
                                        max={200}
                                        step={10}
                                        sx={{ ml: 'auto', width: '40%' }} // Ajusta el ancho y los márgenes según necesites
                                    />
                                </FormControl>


                                <FormControl orientation="horizontal" sx={{ gap: 1, alignItems: 'center' }}>
                                    <ContrastIcon fontSize="xl2" sx={{ mx: 1 }} />
                                    <FormLabel>Contraste: {configContrastInput.toFixed(2)}</FormLabel>
                                    <Slider
                                        aria-label="Umbral"
                                        value={typeof configContrastInput === 'number' ? configContrastInput : 0}
                                        onChange={(event, newValue) => setConfigContrastInput(newValue)}
                                        min={0}
                                        max={200}
                                        step={10}
                                        sx={{ ml: 'auto', width: '40%' }}
                                    />
                                </FormControl>

                                <FormControl orientation="horizontal" sx={{ gap: 1, alignItems: 'center' }}>
                                    <ColorLensIcon fontSize="xl2" sx={{ mx: 1 }} />
                                    <FormLabel>Saturación: {configSaturateInput.toFixed(2)}</FormLabel>
                                    <Slider
                                        aria-label="Umbral"
                                        value={typeof configSaturateInput === 'number' ? configSaturateInput : 0}
                                        onChange={(event, newValue) => setConfigSaturateInput(newValue)}
                                        min={0}
                                        max={200}
                                        step={10}
                                        sx={{ ml: 'auto', width: '40%' }}
                                    />
                                </FormControl>
                                </>

                            }




                            
                        </AccordionDetails>
                </Accordion>
                </AccordionGroup>
    
            }
            <AccordionGroup
                variant="plain"
                transition="0.2s"
                sx={{
                    maxWidth: 500,
                    borderRadius: 'md',
                    [`& .${accordionDetailsClasses.content}.${accordionDetailsClasses.expanded}`]: {
                    paddingBlock: '1rem',
                    },
                    [`& .${accordionSummaryClasses.button}`]: {
                    paddingBlock: '1px',
                    },
                }}
            >
                <Accordion>
                    <AccordionSummary>
                    <Avatar color="success">
                        <EngineeringIcon />
                    </Avatar>
                    <ListItemContent>
                        <Typography level="title-md"> Segmentador  <Chip style={{width: '100px'}} label={'FPS: '+ fpsSegmenterExact} variant="outlined" size="small" color="primary" /> </Typography>
                        <Typography level="body-sm">
                            Configurar el segmentador.
                            {/* <Chip style={{width: '100px'}} label={'FPS: '+ fpsSegmenter} variant="outlined" size="small" color="primary" /> */}
                        </Typography>
                    </ListItemContent>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={1.5}>
                            <FormControl orientation="horizontal" sx={{ gap: 1 }}>
                                {/* <EmailRoundedIcon fontSize="xl2" sx={{ mx: 1 }} /> */}
                                <FormLabel> <strong>Estado:</strong> {statusSegmenter ? 'Encendido': 'Apagado'}</FormLabel>
                                <Switch checked={statusSegmenter} onChange={()=> setStatusSegmenter(!statusSegmenter)} size="sm" />
                            </FormControl>
                            <FormControl orientation="horizontal" sx={{ gap: 1 }}>
                                <MemoryIcon fontSize="xl2" sx={{ mx: 1 }} />
                                <FormLabel> Modelo </FormLabel>
                                <Select
                                    labelId="model-select-label"
                                    id="model-select"
                                    value={configModelSegmenter}
                                    onChange={(event) => setConfigModelSegmenter(event.target.value)}
                                    sx={{ ml: 'auto', width: '60%', height: '30px' }}
                                >
                                    {Object.keys(options_models_available).map((modelKey) => (
                                        <MenuItem key={modelKey} value={modelKey} style={{ display: 'flex' }}>
                                            {modelKey.replace(/_/g, ' ')}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>


                            <FormControl orientation="horizontal" sx={{ gap: 1 }}>
                                <HardwareIcon fontSize="xl2" sx={{ mx: 1 }} />
                                <FormLabel> Hardware </FormLabel>
                                <Select
                                    labelId="model-select-label"
                                    id="model-select"
                                    value={configDelegateSegmenter}
                                    onChange={(event) => setConfigDelegateSegmenter(event.target.value)}
                                    sx={{ ml: 'auto', width: '60%', height: '30px' }}
                                >
                                    <MenuItem style={{ display: 'flex' }} value="CPU"> CPU </MenuItem>
                                    <MenuItem style={{ display: 'flex' }} value="GPU"> GPU </MenuItem>
                                </Select>
                            </FormControl>
                            

                            <FormControl orientation="horizontal" sx={{ gap: 1, alignItems: 'center' }}>
                                <SafetyDividerIcon fontSize="xl2" sx={{ mx: 1 }} />
                                <FormLabel>Umbral: {configThresholdSegmenter.toFixed(2)}</FormLabel>
                                <Slider
                                    aria-label="Umbral"
                                    value={typeof configThresholdSegmenter === 'number' ? configThresholdSegmenter : 0}
                                    onChange={(event, newValue) => setConfigThresholdSegmenter(newValue)}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    sx={{ ml: 'auto', width: '60%' }} // Ajusta el ancho y los márgenes según necesites
                                />
                            </FormControl>
        
                        </Stack>
                    </AccordionDetails>
                </Accordion>
            </AccordionGroup>
            <AccordionGroup
                variant="plain"
                transition="0.2s"
                sx={{
                    maxWidth: 500,
                    borderRadius: 'md',
                    [`& .${accordionDetailsClasses.content}.${accordionDetailsClasses.expanded}`]: {
                    paddingBlock: '1rem',
                    },
                    [`& .${accordionSummaryClasses.button}`]: {
                    paddingBlock: '1px',
                    },
                }}
            >
                <Accordion>
                    <AccordionSummary>
                    <Avatar color="success">
                        <AutoFixHighIcon />
                    </Avatar>
                    <ListItemContent>
                        <Typography level="title-md"> Postprocesado </Typography>
                        <Typography level="body-sm">
                            Configurar postprocesado.
                            {/* <Chip style={{width: '100px'}} label={'FPS: '+ fpsSegmenter} variant="outlined" size="small" color="primary" /> */}
                        </Typography>
                    </ListItemContent>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={1.5}>

                            <FormControl orientation="horizontal" sx={{ gap: 1 }}>
                                <WallpaperIcon fontSize="xl2" sx={{ mx: 1 }} />
                                <FormLabel> Fondo </FormLabel>
                                <Select
                                    labelId="model-select-label"
                                    id="model-select"
                                    value={configCanvasOut}
                                    onChange={(event) => setConfigCanvasOut(event.target.value)}
                                    sx={{ ml: 'auto', width: '40%', height: '30px' }}
                                >
                                    {Object.keys(options_canvas_out_available).map((canvasKey) => (
                                        <MenuItem key={canvasKey} value={canvasKey} style={{ display: 'flex' }}>
                                            {canvasKey.replace(/_/g, ' ')}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {configCanvasOutBlurringActivate && 
                                <FormControl orientation="horizontal" sx={{ gap: 1, alignItems: 'center' }}>
                                    <SelectAllOutlinedIcon fontSize="xl2" sx={{ mx: 1 }} />
                                    {/* <FormLabel style={{ color: typeof configCanvasOutBlurringPixels === 'number' ? 'inherit' : 'green' }}>Píxeles: {typeof configCanvasOutBlurringPixels === 'number' ? configCanvasOutBlurringPixels : "Auto"} </FormLabel> */}
                                    <FormLabel style={{ color: typeof configCanvasOutBlurringPixels === 'number' ? 'inherit' : 'green' }}>Píxeles: {configCanvasOutBlurringPixels}</FormLabel>
                                    <Slider
                                        aria-label="Pixeles"
                                        value={typeof configCanvasOutBlurringPixels === 'number' ? configCanvasOutBlurringPixels : 0}
                                        onChange={(event, newValue) => setConfigCanvasOutBlurringPixels(newValue)}
                                        min={0}
                                        max={20}
                                        step={1}
                                        sx={{ ml: 'auto', width: '40%' }} // Ajusta el ancho y los márgenes según necesites
                                    />
                                    {/* <IconButton onClick={()=>setConfigCanvasOutBlurringPixels("AUTO")} color={configCanvasOutBlurringPixels === "AUTO" ? "green" : "default"}><MotionPhotosAutoOutlinedIcon/></IconButton> */}
                                </FormControl>
                            }

                        </Stack>
                    </AccordionDetails>
                </Accordion>
            </AccordionGroup>
        </div>
    );
  }