import React, { useEffect, useState, useRef } from "react";
import { FormControl, Select, MenuItem } from '@mui/material';
import { Paper } from "@material-ui/core";
import { Tabs, Tab } from "@material-ui/core";
import { Button, Input } from '@material-ui/core';
import { pInputSource } from "../utils/parameters";
import { useStreamProvider } from "../api/StreamProvider";


export function SourceSelection(props) {

    const [ tabInputSource, setTabInputSource ] = useState(pInputSource.WEBCAM);
    const [ videoDevices, setVideoDevices ] = useState([]);  // List devices
    const [ selectedWebcamIdx, setSelectedWebcamIdx ] = useState(0)
    const { closeCurrentStream, videoWidth, videoHeight, setMain_streamVideoCanvas, main_streamVideoCanvasOut } = useStreamProvider()
    const [ showWebcamSelection, setShowWebcamSelection ] = useState(true)

    const deviceSelect_reference = useRef(null);
    const currentVideoFileRef = useRef(null);
    const videoObjectUrlRef = useRef(null);
    const videoElementRef = useRef(null);
    const imageElementRef = useRef(null);
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const updateIntervalImage = useRef(null)

    useEffect(() => {
        if (tabInputSource === pInputSource.WEBCAM){
            getDevices()
        }
    }, [tabInputSource])


    useEffect(() => {
        
        console.log("🚀 ~ SourceSelection ~ videoWidth:", videoWidth)
        console.log('DETECTADO CAMBIO DE RESOLUCIÓN APLICAR CAMBIO Y VOLVER A CARGAR LA FUENTE COMO SI LE DIERA A REINICIO.')

        if (main_streamVideoCanvasOut!== null){
            if (tabInputSource === pInputSource.WEBCAM){

                getWebcamVideo()

            }
            if (tabInputSource === pInputSource.VIDEO){

                restartVideo()
    
            }
            if (tabInputSource === pInputSource.IMG){

                restartImage()
    
            } 
        }

    }, [videoWidth])
    




    const getDevices = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setVideoDevices(videoDevices);
        } catch (error) {
            console.error('Error al obtener los dispositivos: ', error);
        }
    };

    const switchSource = async (source) => {
        if (source === 'webcam') {
            await getWebcamVideo();
        } else if (source instanceof File) {
            loadVideoFile(source);
        }
    };

    const getWebcamVideo = async () => {
        resetCommonReferences()
       
        const videoIdx = deviceSelect_reference.current.selectedIndex || 0
        const videoSource = videoDevices[videoIdx]?.deviceId;

        setSelectedWebcamIdx(videoIdx)

        console.log("🚀 ~ getWebcamVideo ~ videoHeight:", videoHeight)
        console.log("🚀 ~ getWebcamVideo ~ videoWidth:", videoWidth)

        const streamWebcam = await navigator.mediaDevices.getUserMedia({
            video: {
                // height: { exact: videoHeight }, 
                // width: { exact: videoWidth }, 
                height: { exact: videoHeight }, 
                width: { exact: videoWidth }, 
                deviceId: videoSource ? { exact: videoSource } : undefined
            }
        });

        // applyFiltersAndCaptureStream(stream).then(filteredStream => {
        //     // Aquí puedes usar filteredStream, que es tu stream con los filtros aplicados
        //     setMain_streamVideoCanvas(filteredStream);
        // });

        // let videoElement = document.querySelector('video');
        // videoElement.srcObject = stream;

        // if (videoWidth === 640 ){

            console.log('USAR STREAM NATIVO')
            setMain_streamVideoCanvas(streamWebcam);

        // }else {

        //     console.log('USAR STREAM REDUCIDO')

        //     videoElementRef.current = document.createElement('video');
        //     videoElementRef.current.srcObject = stream;
        //     videoElementRef.current.muted = true; 
            
        //     canvasRef.current = document.createElement('canvas');
        //     contextRef.current = canvasRef.current.getContext('2d');
        //     canvasRef.current.width = videoWidth; // Establecer el ancho deseado
        //     canvasRef.current.height = videoHeight; // Establecer el alto deseado
    
        //     videoElementRef.current.onloadedmetadata = () => {
        //         videoElementRef.current.play(); // Reproduce el video cuando esté listo
        //     };
        //     videoElementRef.current.onplay = () => {
        //         // Función para actualizar y dibujar el video en el canvas
        //         const drawVideo = () => {
        //             if (!videoElementRef.current.paused && !videoElementRef.current.ended) {
        //                 contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        //                 contextRef.current.drawImage(videoElementRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        //                 requestAnimationFrame(drawVideo);
        //             }
        //         };
        //         drawVideo();
        //         setMain_streamVideoCanvas(canvasRef.current.captureStream());
        //     };
        // }
    };


    const loadVideoFile = (file) => {
        resetCommonReferences()

        currentVideoFileRef.current = file;
        if (videoObjectUrlRef.current) {
            URL.revokeObjectURL(videoObjectUrlRef.current);
        }

        videoObjectUrlRef.current = URL.createObjectURL(file);
        videoElementRef.current = document.createElement('video');
        videoElementRef.current.src = videoObjectUrlRef.current;
        videoElementRef.current.muted = true; 
        canvasRef.current = document.createElement('canvas');
        contextRef.current = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoWidth; // Establecer el ancho deseado
        canvasRef.current.height = videoHeight; // Establecer el alto deseado
        videoElementRef.current.onloadedmetadata = () => {
            videoElementRef.current.play(); // Reproduce el video cuando esté listo
        };

        videoElementRef.current.onplay = () => {
            // Función para actualizar y dibujar el video en el canvas
            const drawVideo = () => {
                if (videoElementRef.current !== null){
                    if (!videoElementRef.current.paused && !videoElementRef.current.ended) {
                        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        contextRef.current.drawImage(videoElementRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                        requestAnimationFrame(drawVideo);
                    }
                }
            };
            drawVideo();
            // Capturar el stream del canvas
            setMain_streamVideoCanvas(canvasRef.current.captureStream(50));
        };
        videoElementRef.current.onerror = () => {
            console.error(`Error loading video file: ${file.name}`);
        };
    };


    const restartVideo = () => {
        if (currentVideoFileRef.current) {
            loadVideoFile(currentVideoFileRef.current); // Vuelve a cargar el archivo de video referenciado
        }
    };

    const loadImageFile = (file) => {
        resetCommonReferences()
       
        currentVideoFileRef.current = file;
        if (videoObjectUrlRef.current) {
            URL.revokeObjectURL(videoObjectUrlRef.current);
        }

        videoObjectUrlRef.current = URL.createObjectURL(file);

        imageElementRef.current = new Image();
        canvasRef.current = document.createElement('canvas');
        contextRef.current = canvasRef.current.getContext('2d');
        imageElementRef.current.onload = () => {
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
            // Dibujar la imagen inicial en el canvas
            contextRef.current.drawImage(imageElementRef.current, 0, 0, videoWidth, videoHeight);

            // Crear un stream a partir del canvas y asignarlo
            // setMain_streamVideoCanvas(canvasRef.current.captureStream());
            setMain_streamVideoCanvas(canvasRef.current.captureStream(50));
            
            // Configurar un intervalo para actualizar el canvas
            updateIntervalImage.current = setInterval(() => {
                contextRef.current.clearRect(0, 0, videoWidth, videoHeight);
                contextRef.current.drawImage(imageElementRef.current, 0, 0, videoWidth, videoHeight);
            }, 50); // Actualizar cada segundo
        };
        imageElementRef.current.onerror = () => {
            console.error(`Error loading image file: ${file.name}`);
        };
        imageElementRef.current.src = videoObjectUrlRef.current;
    };

    const restartImage = () => {
        if (currentVideoFileRef.current) {
            loadImageFile(currentVideoFileRef.current); // Vuelve a cargar el archivo de video referenciado
        }
    };


    const resetCommonReferences = () => {
        if (updateIntervalImage.current) {
            clearInterval(updateIntervalImage.current);
        }
        if (videoElementRef.current) {
            videoElementRef.current.pause();
        }
        if (videoObjectUrlRef.current) {
            URL.revokeObjectURL(videoObjectUrlRef.current);
        }
        videoElementRef.current = null;
        imageElementRef.current = null;
        canvasRef.current = null;
        contextRef.current = null;
        closeCurrentStream();
    };


    return (
        <>
        <Tabs
                    value={tabInputSource}
                    onChange={(event, newValue) => { setTabInputSource(newValue) }}
                    indicatorColor="primary"
                    textColor="primary"
                    style={{
                    width: '90%', 
                    margin: 'auto', 
                    borderBottom: '1px solid #e8e8e8'
                    }}
                    centered
                >
                    <Tab 
                    style={{
                        minWidth: '20%', 
                        fontSize: '15px', 
                        backgroundColor: tabInputSource === pInputSource.WEBCAM ? 'red' : 'transparent', 
                        color: tabInputSource === pInputSource.WEBCAM ? 'white' : 'black', 
                        borderTopLeftRadius: '10px', 
                        borderTopRightRadius: '10px',
                        border: tabInputSource === pInputSource.WEBCAM ? '2px solid #2b56ff' : '1px solid #dddddd'
                    }} 
                    label="WEBCAM" 
                    />
                    <Tab 
                    style={{
                        minWidth: '20%', 
                        fontSize: '15px', 
                        backgroundColor: tabInputSource === pInputSource.VIDEO ? 'red' : 'transparent', 
                        color: tabInputSource === pInputSource.VIDEO ? 'white' : 'black', 
                        borderTopLeftRadius: '10px', 
                        borderTopRightRadius: '10px',
                        border: tabInputSource === pInputSource.VIDEO ? '2px solid #2b56ff' : '1px solid #dddddd'
                    }} 
                    label="VIDEO" 
                    />
                    <Tab 
                    style={{
                        minWidth: '20%', 
                        fontSize: '15px', 
                        backgroundColor: tabInputSource === pInputSource.IMG ? 'red' : 'transparent', 
                        color: tabInputSource === pInputSource.IMG ? 'white' : 'black', 
                        borderTopLeftRadius: '10px', 
                        borderTopRightRadius: '10px',
                        border: tabInputSource === pInputSource.IMG ? '2px solid #2b56ff' : '1px solid #dddddd'
                    }} 
                    label="IMAGEN" 
                    />
                </Tabs>

                {tabInputSource === pInputSource.WEBCAM && (
                    <Paper style={{margin: '0%'}} elevation={5}>
                    <Button style={{margin: '2px'}} variant="outlined" onClick={() => switchSource('webcam')}>INICIAR / RESETEAR Webcam</Button>
                    <Button style={{margin: '2px'}} variant="outlined" onClick={() => closeCurrentStream()}>DETENER Webcam</Button>
                    <Button style={{margin: '2px'}} variant="outlined" onClick={() => setShowWebcamSelection(!showWebcamSelection)}> {showWebcamSelection ? "Ocultar Seleccionar Webcam" : "Seleccionar Webcam"}</Button>
                    {showWebcamSelection &&
                        <FormControl fullWidth>
                            <Select
                            labelId="camera-source-label"
                            id="devices"
                            label="Choose your camera source"
                            onChange={getWebcamVideo}
                            inputRef={deviceSelect_reference}
                            defaultValue={selectedWebcamIdx}
                            >
                            {videoDevices.map((device, index) => (
                                <MenuItem key={index} value={index}>{device.label}</MenuItem>
                            ))}
                            </Select>
                        </FormControl>
                    }
                    </Paper>
                )}

                {tabInputSource === pInputSource.VIDEO && (
                    <Paper style={{margin: '0%'}} elevation={5}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }}>
                            <Input
                                type="file"
                                inputProps={{ accept: 'video/*' }}
                                onChange={(e) => switchSource(e.target.files[0])}
                                style={{ flexGrow: 1 }}
                            />
                            <Button onClick={restartVideo} style={{ marginLeft: '10px' }}>Restart</Button>
                        </div>
                    </Paper>
                )}

                {tabInputSource === pInputSource.IMG && (
                    <Paper style={{ margin: '0%', display: 'flex', alignItems: 'center', padding: '10px' }} elevation={5}>
                        <Input
                            type="file"
                            inputProps={{ accept: 'image/*' }}
                            onChange={(e) => loadImageFile(e.target.files[0])}
                            style={{ width: '100%', marginRight: '10px' }}
                        />
                        <Button onClick={restartImage} style={{ marginLeft: '10px' }}>Restart</Button>
                    </Paper>
                )}
        
        </>
    )
}