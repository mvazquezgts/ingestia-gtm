import React, { useEffect, useState, useRef } from "react";
import { FormControl, Select, MenuItem, Typography } from '@mui/material';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { Paper } from "@material-ui/core";
import { Tabs, Tab } from "@material-ui/core";
import { Chip } from '@material-ui/core'
import { Box, Button, IconButton, Input } from '@material-ui/core';
import { ArrowBackIos, ArrowForwardIos } from '@material-ui/icons';
import Slider from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import MarkunreadMailboxIcon from '@mui/icons-material/MarkunreadMailbox';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import Janus from 'janus-gateway';
import adapter from 'webrtc-adapter';
window.adapter = adapter;
import { HomeWrapper } from "../components/utils/HomeWrapper";
import CustomSlider from "../components/utils/CustomSlider";
import { pInputSource, pWebRTCOptions, pScreenActivatedOptions, pVideoSettings } from "../utils/parameters";



export function HomeVirtualBG() {
    const [ tabInputSource, setTabInputSource ] = useState(pInputSource.WEBCAM);
    const [ tabWebRTC, setTabWebRTC ] = useState(pWebRTCOptions.LOCAL);

    const [videoWidth, setVideoWidth] = useState(320);
    const [videoHeight, setVideoHeight] = useState(240);
    const [videoDevices, setVideoDevices] = useState([]);  // List devices
    const [selectedWebcamIdx, setSelectedWebcamIdx ] = useState(0)
    const deviceSelect = useRef(null);                     // device selected

    const videoElementRef = useRef(null);

    const videoCanvasRef = useRef(null);
    const transparentCanvasRef = useRef(null);
    const greenScreenCanvasRef = useRef(null);
    const webRTC_videoElement = useRef(null);

    const streams = useRef({ video: null, canvas1: null, canvas2: null });
    const mediaRecorders = useRef({ video: null, canvas1: null, canvas2: null, rcv: null });
    const recordedChunks = useRef({ video: [], canvas1: [], canvas2: [], rcv: [] });
    const [blobs, setBlobs] = useState({ video: null, canvas1: null, canvas2: null, rcv: null });
    const [isRecording, setIsRecording] = useState(false);
    const [triggerPeerConnection, setTriggerPeerConnection] = useState(false); // Estado para activar useEffect

    const localPeerConnectionRef = useRef(null);
    const remotePeerConnectionRef = useRef(null);
    
    const selfieSegmentationModel = useRef(null);
    const [selfieSegmentationModel_modelSelected, setSelfieSegmentationModel_modelSelected] = useState(1);

    const [fpsVideoMain, setFpsVideoMain] = useState(0); 
    const inputImageRef = useRef(null); 
    const [screenActivated, setScreenActivated] = useState(pScreenActivatedOptions.VIDEO);

    const janus_connection = useRef(null)
    


    useEffect(() => {
        getDevices();
        videoElementRef.current.addEventListener('play', updateCanvas);
        console.log('INIT')
        if (videoCanvasRef.current) {
            console.log('INIT - videoElement.current')
            const videoStream = videoCanvasRef.current.captureStream(pVideoSettings.frame_rate);
            streams.current.video = videoStream
            prepareRecording(videoStream, 'video');
        }
        if (transparentCanvasRef.current) {
            console.log('INIT - transparentCanvasRef.current')
            const canvasStream1 = transparentCanvasRef.current.captureStream(pVideoSettings.frame_rate);
            streams.current.canvas1 = canvasStream1
            prepareRecording(canvasStream1, 'canvas1');
        }
        if (greenScreenCanvasRef.current) {
            console.log('INIT - greenScreenCanvas.current')
            const canvasStream2 = greenScreenCanvasRef.current.captureStream(pVideoSettings.frame_rate);
            streams.current.canvas2 = canvasStream2
            prepareRecording(canvasStream2, 'canvas2');
        }
        if (webRTC_videoElement.current) {
            console.log('INIT - webRTC_videoElement.current')
            const webRTC_videoStream = webRTC_videoElement.current.captureStream(pVideoSettings.frame_rate);
            streams.current.rcv = webRTC_videoStream
            prepareRecording(webRTC_videoStream, 'rcv');
        }

        return () => {
            videoElementRef.current.removeEventListener('play', updateCanvas);
        };
    }, []);


    // Handler functions
    const getDevices = async () => {
        let devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
        console.log("video devices:", videoInputDevices);
        setVideoDevices(videoInputDevices);
    };

    const getVideo = async () => {
        setBlobs({ video: null, canvas1: null, canvas2: null, rcv: null })
        console.log(`Getting ${videoWidth}x${videoHeight} video`);
        let videoIdx = deviceSelect.current.selectedIndex || 0
        let videoSource = videoDevices[videoIdx]?.deviceId;
        setSelectedWebcamIdx(videoIdx)
        
    
        let stream = await navigator.mediaDevices.getUserMedia({
            video: {
                height: { videoHeight }, 
                width: { videoWidth }, 
                deviceId: videoSource ? { exact: videoSource } : undefined
            }
        });
        videoElementRef.current.srcObject = stream;
        videoElementRef.current.play();
        console.log(`Capture camera with device ${stream.getTracks()[0].label}`);
    };

    function resetVideoElementRef(){
        if (videoElementRef.current && videoElementRef.current.srcObject) {
            videoElementRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        videoElementRef.current.srcObject = null;
    }
    

    const handleResolutionChange = async (width, height) => {
        resetVideoElementRef()
        setVideoWidth(width);
        setVideoHeight(height);
        await getVideo();
    };

    const loadVideoFile = (file) => {
        const url = URL.createObjectURL(file);
        videoElementRef.current.src = url;
        videoElementRef.current.play();
        console.log(`Loaded video file: ${file.name}`);
    };


    // LOAD    IMAGE
    const loadImageFile = (file) => {
        const url = URL.createObjectURL(file);
        const canvas = videoCanvasRef.current;
        const context = canvas.getContext('2d');
        const img = new Image();

        inputImageRef.current = new Image()
        inputImageRef.current.src = url

        img.onload = () => {
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            context.drawImage(img, 0, 0, videoWidth, videoHeight);
        };
        img.src = url;
    };


    const switchSource = async (source) => {
        inputImageRef.current = null
        resetVideoElementRef()
        if (source === 'webcam') {
            await getVideo();
        } else if (source instanceof File) {
            loadVideoFile(source);
        }
    };



    const handleStart = () => {
        console.log('Load selfieSegmentation model');
        transparentCanvasRef.current.height = videoHeight;
        transparentCanvasRef.current.width = videoWidth;
        const transparentCtx = transparentCanvasRef.current.getContext('2d');

        greenScreenCanvasRef.current.height = videoHeight;
        greenScreenCanvasRef.current.width = videoWidth;
        const greenCtx = greenScreenCanvasRef.current.getContext('2d');


        if (selfieSegmentationModel.current === null){
            selfieSegmentationModel.current = new SelfieSegmentation({locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
            }});
            selfieSegmentationModel.current.setOptions({
                modelSelection: selfieSegmentationModel_modelSelected,
            });
            selfieSegmentationModel.current.onResults(results=>{
                transparent(results, transparentCtx);
                greenScreen(results, greenCtx);
            });

            initRefreshFrameLoop()
        }else{
            console.log('Ya cargado previamente selfieSegmentation model');
        }
        
    };



    const initRefreshFrameLoop = () => {
        let lastTime = new Date();
        async function getFrames() {
            if (videoElementRef.current && selfieSegmentationModel.current) {
                const now = videoElementRef.current.currentTime;
                if (now > lastTime){
                    const fps = (1/(now-lastTime)).toFixed();
                    setFpsVideoMain(fps)
                    console.log('FPS: ', fps)
                    await drawVideoSegmentation()
                }
                lastTime = now;
                requestAnimationFrame(getFrames)
            }
        }
        requestAnimationFrame(getFrames)
    }

    // PENDIENTE DE HACER - INCLUIR - AJUSTE RETIRARNDO FONDO EN BASE AL VERDE --- Y USO DE WEBGL PARA ELIMINAR FONDO --- GESTION DE ALGORITMO REMOVE GREEN BACKGROUND
    const drawVideoSegmentation = async () => {
        if (videoElementRef.current && selfieSegmentationModel.current) {
            try {
                await selfieSegmentationModel.current.send({image: videoCanvasRef.current});
            } catch (error) {
                console.error('Error en la segmentación de video:', error);
            }
        }
    };


    function transparent(results, ctx) {
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        // Draw the mask
        ctx.drawImage(results.segmentationMask, 0, 0, videoWidth, videoHeight);
        // Cambia el modo de composición para que solo se dibuje sobre la máscara
        ctx.globalCompositeOperation = 'source-in';
        // Dibuja el video original, que solo se aplicará donde la máscara es visible
        ctx.drawImage(results.image, 0, 0, videoWidth, videoHeight);
        // Restablece el modo de composición para futuras operaciones
        ctx.globalCompositeOperation = 'source-over';
    }

    const [threshold, setThreshold] = useState(128);
    const thresholdRef = useRef(128);
    const handleSliderChange = (event) => {
        setThreshold(event.target.value);
        thresholdRef.current = event.target.value
    };


    function greenScreen(results, ctx) {
 
        console.log('THRESHOLD: ', threshold)
        console.log('thresholdRef.current: ', thresholdRef.current)

        ctx.clearRect(0, 0, videoWidth, videoHeight);
        // Draw the mask
        ctx.drawImage(results.segmentationMask, 0, 0, videoWidth, videoHeight);
        const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);

        // for (let i = 0; i < imageData.data.length; i += 1) {
        //     imageData.data[i] = imageData.data[i] > thresholdRef.current ? 255 : 0;
        // }

        for (let i = 0; i < imageData.data.length; i += 4) { // Avanza 4 bytes en cada iteración
            let alpha = imageData.data[i + 3]; // El canal alfa es el cuarto byte de cada grupo de 4 bytes
            if (alpha >= thresholdRef.current) {
                imageData.data[i + 3] = 255; // Establecer alfa a 255 si supera el umbral
                imageData.data[i + 0] = 255; // Establecer alfa a 255 si supera el umbral
                imageData.data[i + 1] = 255; // Establecer alfa a 255 si supera el umbral
                imageData.data[i + 2] = 255; // Establecer alfa a 255 si supera el umbral
            } else {
                imageData.data[i + 3] = 0; // Establecer alfa a 0 si no supera el umbral
                imageData.data[i + 0] = 0; // Establecer alfa a 255 si supera el umbral
                imageData.data[i + 1] = 0; // Establecer alfa a 255 si supera el umbral
                imageData.data[i + 2] = 0; // Establecer alfa a 255 si supera el umbral
            }
        }
        ctx.putImageData(imageData, 0, 0);

        // Fill green on everything but the mask
        ctx.globalCompositeOperation = 'source-out';
        ctx.fillStyle = '#00FF00';
        // ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, videoWidth, videoHeight);
        
        // // Add the original video back in (in image) , but only overwrite missing pixels.
        ctx.globalCompositeOperation =  'destination-atop';
        ctx.drawImage(results.image, 0, 0, videoWidth, videoHeight);
    }


    /// INICIO PARTE - GRABAR LOS VÍDEOS 

    const prepareRecording = (stream, key) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorders.current[key] = mediaRecorder;
        // Recolecta los chunks de datos
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.current[key].push(event.data);
            }
        };
    };

    const startAllRecordings = () => {
        Object.values(mediaRecorders.current).forEach(mediaRecorder => {
            if (mediaRecorder) {
                mediaRecorder.start();
            }
        });
        setIsRecording(true)
        setBlobs({ video: null, canvas1: null, canvas2: null, rcv: null })
    };

    const stopAllRecordings = () => {
        Object.keys(mediaRecorders.current).forEach(key => {
            const mediaRecorder = mediaRecorders.current[key];
            if (mediaRecorder) {
                mediaRecorder.stop();
                mediaRecorder.onstop = () => {
                    // Convertir los chunks en un blob
                    const blob = new Blob(recordedChunks.current[key], { type: 'video/webm' });
                    setBlobs(prevBlobs => ({ ...prevBlobs, [key]: blob }));
                    console.log(`${key} blob:`, blob);
                    // Limpiar los chunks grabados
                    recordedChunks.current[key] = [];
                };
            }
        });
        setIsRecording(false)
    };

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    };


    const startWebRTC = (stream_selected) => {
        console.log('START WEB RTC - ECHO TEST');
      
        localPeerConnectionRef.current = new RTCPeerConnection();
        remotePeerConnectionRef.current = new RTCPeerConnection();
        setTriggerPeerConnection(prev => !prev);
      
        // Handle ICE candidates for local peer
        localPeerConnectionRef.current.onicecandidate = event => {
          if (event.candidate && remotePeerConnectionRef.current) {
            remotePeerConnectionRef.current.addIceCandidate(event.candidate);
          }
        };
      
        // Handle ICE candidates for remote peer
        remotePeerConnectionRef.current.onicecandidate = event => {
          if (event.candidate && localPeerConnectionRef.current) {
            localPeerConnectionRef.current.addIceCandidate(event.candidate);
          }
        };
      
        // Handle track event for remote peer
        remotePeerConnectionRef.current.ontrack = event => {
          if (webRTC_videoElement.current) {
            webRTC_videoElement.current.srcObject = event.streams[0];
          }
        };
      
        // Get media stream and add tracks to local peer
        stream_selected.getTracks().forEach(track => {
          if (localPeerConnectionRef.current) {
            localPeerConnectionRef.current.addTrack(track, stream_selected);
          }
        });
      
        // Create offer from local peer
        localPeerConnectionRef.current.createOffer()
          .then(offer => localPeerConnectionRef.current?.setLocalDescription(offer))
          .then(() => {
            // Set the local offer as the remote description
            return remotePeerConnectionRef.current?.setRemoteDescription(localPeerConnectionRef.current.localDescription);
          })
          .then(() => {
            // Create and set answer from remote peer
            return remotePeerConnectionRef.current?.createAnswer();
          })
          .then(answer => remotePeerConnectionRef.current?.setLocalDescription(answer))
          .then(() => {
            // Set the local answer as the remote description
            return localPeerConnectionRef.current?.setRemoteDescription(remotePeerConnectionRef.current.localDescription);
          })
          .then(() => {
            console.log("WebRTC communication established successfully.");
          })
          .catch(error => {
            console.error('Error during WebRTC setup:', error);
          });
    };

    const stopWebRTC = () => {
            if (localPeerConnectionRef.current) {
              localPeerConnectionRef.current.close();
              localPeerConnectionRef.current.onicecandidate = null;
              localPeerConnectionRef.current.ontrack = null;
              localPeerConnectionRef.current = null;
            }
          
            if (remotePeerConnectionRef.current) {
              remotePeerConnectionRef.current.close();
              remotePeerConnectionRef.current.onicecandidate = null;
              remotePeerConnectionRef.current.ontrack = null;
              remotePeerConnectionRef.current = null;
            }
            setTriggerPeerConnection(prev => !prev);
            setConnectionStatusRCV({})
            setConnectionStatusSRC({})
    };
    

    let previousBytesReceived = 0
    const fetchWebRTCStats = () => {
            // Función para calcular la velocidad de transmisión
            const calculateTransmissionSpeed = (bytes, reportType) => {
              // Calcular la velocidad en kilobytes por segundo (kB/s)
              const speedKbs = (bytes / 1024).toFixed(2);
              return `${speedKbs} kB/s (${reportType})`;
            };
          
            const processStats = (stats, connectionType) => {
              let important_stats = {};
              let transmissionSpeed = {};

              stats.forEach(report => {
                if (report.type === "inbound-rtp" && report.kind === "video") {
                    // Log the frame rate
                    console.log(report.framesPerSecond);
                    const bytesDifference = report.bytesReceived - previousBytesReceived;
                    previousBytesReceived = report.bytesReceived
                    const kbsReceived = (bytesDifference / 1024).toFixed(2);
                    console.log('kB/s Received:', kbsReceived);
                }
 
                switch (report.type) {
                  case 'inbound-rtp':
                  case 'outbound-rtp':
                    // Estadísticas de flujos de medios
                    important_stats[`${report.type}-${report.id}`] = {
                      bytesSent: report.bytesSent,
                      bytesReceived: report.bytesReceived,
                      framesPerSecond: report.framesPerSecond,
                      packetsLost: report.packetsLost,
                        jitter: report.jitter,
                        roundTripTime: report.roundTripTime,
                        totalDecodeTime: report.totalDecodeTime,
                        totalInterFrameDelay: report.totalInterFrameDelay,
                        totalSquaredInterFrameDelay: report.totalSquaredInterFrameDelay,
                    };
                    // Calcular velocidad de transmisión
                    if (report.type === 'outbound-rtp') {
                      transmissionSpeed[`${connectionType} - Outbound`] = calculateTransmissionSpeed(report.bytesSent, 'Sent');
                    } else if (report.type === 'inbound-rtp') {
                      transmissionSpeed[`${connectionType} - Inbound`] = calculateTransmissionSpeed(report.bytesReceived, 'Received');
                    }
                    break;
                  case 'transport':
                    // Estadísticas de la conexión
                    important_stats[report.type] = {
                        bytesSent: report.bytesSent,
                        bytesReceived: report.bytesReceived,
                        rtcpTransportStatsId: report.rtcpTransportStatsId,
                        selectedCandidatePairId: report.selectedCandidatePairId,
                        localCertificateId: report.localCertificateId,
                        remoteCertificateId: report.remoteCertificateId,
                    };
                    break;
                  case 'candidate-pair':
                    // Estadísticas de candidatos ICE
                    important_stats[report.type] = {
                        localCandidateId: report.localCandidateId,
                        remoteCandidateId: report.remoteCandidateId,
                        state: report.state,
                        priority: report.priority,
                        nominated: report.nominated,
                        bytesSent: report.bytesSent,
                        bytesReceived: report.bytesReceived,
                    };
                    break;
                  case 'codec':
                    // Estadísticas de códecs
                    important_stats[`${report.type}-${report.id}`] = {
                        payloadType: report.payloadType,
                        codecType: report.codecType,
                        mimeType: report.mimeType,
                        clockRate: report.clockRate,
                        channels: report.channels,
                        sdpFmtpLine: report.sdpFmtpLine,
                    };
                    break;
                }
              });
          
              console.log(`${connectionType} Important Stats:`, important_stats);
              console.log(`${connectionType} Transmission Speed:`, transmissionSpeed);

            };
          
            // Obtener estadísticas para la conexión local
            if (localPeerConnectionRef.current) {
              localPeerConnectionRef.current.getStats(null)
                .then(stats => processStats(stats, 'Local'))
                .catch(error => console.error('Error fetching local stats:', error));
            }
          
            // Obtener estadísticas para la conexión remota
            if (remotePeerConnectionRef.current) {
              remotePeerConnectionRef.current.getStats(null)
                .then(stats => processStats(stats, 'Remote'))
                .catch(error => console.error('Error fetching remote stats:', error));
            }
    }

    const [connectionStatusSRC, setConnectionStatusSRC] = useState({});
    const [connectionStatusRCV, setConnectionStatusRCV] = useState({});



    let previousBytesSRC = 0
    const fetchWebRTCStats_SRC = () => {
        if (localPeerConnectionRef.current) {
          localPeerConnectionRef.current.getStats(null).then(stats => {
            let statsOutput = {};
      
            stats.forEach(report => {
              if (report.type === 'outbound-rtp' || report.type === 'inbound-rtp') {
                statsOutput.bytesSent = report.bytesSent;

                const bytesDifference = statsOutput.bytesSent - previousBytesSRC;
                previousBytesSRC = statsOutput.bytesSent
                const kbsSent = (bytesDifference / 1024).toFixed(2);
                console.log('kB/s Sent:', kbsSent);

                statsOutput.kbsSent = kbsSent;
              }
      
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                statsOutput.currentCandidatePairId = report.id;
                statsOutput.connectionState = report.state;
              }
            });
      
            setConnectionStatusSRC(statsOutput);
          }).catch(error => console.error("Error fetching stats: ", error));
        }
    };

    let previousBytesRCV = 0
    const fetchWebRTCStats_RCV = () => {
        if (remotePeerConnectionRef.current) {
          remotePeerConnectionRef.current.getStats(null).then(stats => {
            let statsOutput = {};
      
            stats.forEach(report => {
              // Aquí se procesan las estadísticas relevantes para la conexión remota
              if (report.type === 'inbound-rtp') {
                statsOutput.bytesReceived = report.bytesReceived;

                const bytesDifference = statsOutput.bytesReceived - previousBytesRCV;
                previousBytesRCV = statsOutput.bytesReceived
                const kbsRcv = (bytesDifference / 1024).toFixed(2);
                console.log('kB/s Received:', kbsRcv);

                statsOutput.kbsRcv = kbsRcv;


                statsOutput.jitter = report.jitter;
                statsOutput.packetsLost = report.packetsLost;
                // Puedes añadir más campos según necesites
              }
      
              // Información sobre el par de candidatos actual, si está disponible
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                statsOutput.currentCandidatePairId = report.id;
                statsOutput.connectionState = report.state;
              }
            });
      
            setConnectionStatusRCV(statsOutput);
          }).catch(error => console.error("Error fetching stats: ", error));
        }
      };

    useEffect(() => {
        console.log("🚀 ~ file: HomeVirtualBG.js:638 ~ HomeVirtualBG ~ connectionStatusSRC:", connectionStatusSRC)
    }, [connectionStatusSRC]);

    useEffect(() => {
        console.log("🚀 ~ file: HomeVirtualBG.js:638 ~ HomeVirtualBG ~ connectionStatusRCV:", connectionStatusRCV)
    }, [connectionStatusRCV]);
    

    useEffect(() => {
        let statsIntervalSRC;
        let statsIntervalRCV;
        if (localPeerConnectionRef.current) {
            statsIntervalSRC = setInterval(fetchWebRTCStats_SRC, 1000);
        }else{
            if (statsIntervalSRC) {
                clearInterval(statsIntervalSRC);
            }
        }

        if (remotePeerConnectionRef.current) {
            statsIntervalRCV = setInterval(fetchWebRTCStats_RCV, 1000);
        }else{
            if (statsIntervalRCV) {
                clearInterval(statsIntervalRCV);
            }
        }
          
        return () => {
            if (statsIntervalSRC) {
                clearInterval(statsIntervalSRC);
            }
            if (statsIntervalRCV) {
                clearInterval(statsIntervalRCV);
            }
        };
    }, [triggerPeerConnection]);



    const [imageSrc, setImageSrc] = useState(null);
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
    
        reader.onloadend = () => {
            console.log('LOADED IMAGE INTO VIDEO COMPONENT')
            setImageSrc(reader.result);
        };
    
        if (file) {
          reader.readAsDataURL(file);
        }
        getVideo()
    }

    const updateCanvas = () => {
        if (videoElementRef.current && videoCanvasRef.current) {
            if (inputImageRef.current){

                inputImageRef.current.onload = () => {
                    
                    const canvas = videoCanvasRef.current;
                    const context = canvas.getContext('2d');
                    canvas.width = videoWidth;
                    canvas.height = videoHeight;
                    // Dibujar la imagen en el canvas
                    context.drawImage(inputImageRef.current, 0, 0, videoWidth, videoHeight);

                };

            }else{
                const canvas = videoCanvasRef.current;
                const context = canvas.getContext('2d');
                canvas.width = videoWidth
                canvas.height = videoHeight
                // setVideoWidth(videoElementRef.current.videoWidth)
                // setVideoHeight(videoElementRef.current.videoHeight)
                context.drawImage(videoElementRef.current, 0, 0, canvas.width, canvas.height);
                requestAnimationFrame(updateCanvas);
            }
        }
    };


    useEffect(() => {
        console.log("🚀 ~ file: HomeVirtualBG.js:680 ~ HomeVirtualBG ~ selectedWebcamIdx:", selectedWebcamIdx)
    }, [selectedWebcamIdx]);


    const sliderActionChangeModel = (event, newValue) => {
        console.log("Nuevo valor del slider: ", newValue);
        setSelfieSegmentationModel_modelSelected(newValue)
        if (selfieSegmentationModel.current !== null){
            console.log("selfieSegmentationModel: CHANGE MODEL");
            selfieSegmentationModel.current.setOptions({
                modelSelection: newValue,
            });
        }
    };

    useEffect(() => {
        console.log("🚀 ~ file: HomeVirtualBG.js:680 ~ HomeVirtualBG ~ selfieSegmentationModel_modelSelected:", selfieSegmentationModel_modelSelected)
    }, [selfieSegmentationModel_modelSelected]);


    const boton1 = () => {

        janus_connection.current = Janus.init({
            debug: true,
            plugin: "janus.plugin.echotest",
            callback: function() {
                console.log("Janus initialized");
                // Further Janus setup like creating sessions goes here
            }
        });


    };

    const boton2 = () => {
        console.log("🚀 ~ file: HomeVirtualBG.js:811 ~ boton2 ~ boton2:", boton2)   

        if (Janus.isWebrtcSupported()) {
            Janus.init({
                debug: true,
                callback: boton3
            });
        } else {
            alert("WebRTC is not supported by your browser.");
        }
    }


    const boton3 = () => {
        console.log("🚀 ~ file: HomeVirtualBG.js:816 ~ boton3 ~ boton3:", boton3)     
    }


    // const boton4 = () => {
    //     janus_connection.current = Janus.init({
    //         debug: true,
    //         success: () => {
    //             // Attach to a plugin, e.g., VideoRoom or Streaming
    //             janus_connection.current.attach({
    //                 plugin: "janus.plugin.videoroom", // Replace with your chosen plugin
    //                 success: (pluginHandle) => {
    //                     videoHandle = pluginHandle;
                    
    //                     // Create/Join a Video Room
    //                     const register = { 
    //                         "request": "join", 
    //                         "room": 1234, // Replace with your room ID
    //                         "ptype": "publisher",
    //                         "display": "MyDisplayName" // Replace with the user's display name
    //                     };
                    
    //                     videoHandle.send({ "message": register });
                    
    //                     // Handle incoming messages
    //                     videoHandle.onmessage = (msg, jsep) => {
    //                         if (jsep) {
    //                             videoHandle.handleRemoteJsep({ jsep: jsep });
    //                         }
    //                     };
                    
    //                     // Publish your stream
    //                     navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    //                         .then((stream_selected) => {
    //                             const publish = { 
    //                                 "request": "configure", 
    //                                 "audio": true, 
    //                                 "video": true 
    //                             };
                    
    //                             videoHandle.createOffer({
    //                                 stream: stream_selected,
    //                                 // No media provided: by default, it's sendrecv for audio and video
    //                                 success: (jsep) => {
    //                                     let publish = { "request": "publish", "audio": false, "video": true };
    //                                     videoHandle.send({ "message": publish, "jsep": jsep });
    //                                 },
    //                                 error: (error) => {
    //                                     console.error("WebRTC error:", error);
    //                                 }
    //                             });
    //                         })
    //                         .catch((error) => {
    //                             console.error("Error accessing media devices:", error);
    //                         });
    //                 },
    //                 error: (error) => {
    //                     console.error("Error attaching plugin...", error);
    //                 },
    //                 onlocalstream: (stream) => {
    //                     // Attach the local stream to the local video element
    //                     if (greenScreenCanvasRef.current) {
    //                         Janus.attachMediaStream(greenScreenCanvasRef.current, stream);
    //                     }
    //                 },
    //                 onremotestream: (stream) => {
    //                     // Attach the remote stream to the remote video element
    //                     if (webRTC_videoElement.current) {
    //                         Janus.attachMediaStream(webRTC_videoElement.current, stream);
    //                     }
    //                 },
    //             });
    //         },
    //         error: (error) => {
    //             console.error("Error initializing Janus...", error);
    //         },
    //     });     
    // }


    return (
        <>
            <HomeWrapper>
            <div style={{display: screenActivated === pScreenActivatedOptions.VIDEO ? 'block' : 'none'}}>
            <Paper style={{width: '90%', margin: '5%'}} elevation={2}>
                <div style={{ 
                    margin: '10px', 
                    textAlign: 'center', 
                    fontWeight: 'bold', 
                    fontSize: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    backgroundColor: '#2b56ff',
                    color: 'white'
                }}> 
                    <IconButton onClick={() => setScreenActivated(pScreenActivatedOptions.EVALUATION)}>
                        <ArrowBackIos style={{ color: 'white' }} />
                    </IconButton>

                    VIDEO SOURCE SETTING

                    <IconButton onClick={() => setScreenActivated(pScreenActivatedOptions.WEBRTC)}>
                        <ArrowForwardIos style={{ color: 'white' }} />
                    </IconButton>
                </div>

                <hr></hr>

                <Tabs
                    value={tabInputSource}
                    onChange={(event, newValue) => { setTabInputSource(newValue); setBlobs({ video: null, canvas1: null, canvas2: null, rcv: null }) }}
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
                        borderTopLeftRadius: '10px', 
                        borderTopRightRadius: '10px'
                    }} 
                    label="WEBCAM" 
                    />
                    <Tab 
                    style={{
                        minWidth: '20%', 
                        fontSize: '15px', 
                        backgroundColor: tabInputSource === pInputSource.VIDEO ? 'red' : 'transparent', 
                        borderTopLeftRadius: '10px', 
                        borderTopRightRadius: '10px'
                    }} 
                    label="VIDEO" 
                    />
                    <Tab 
                    style={{
                        minWidth: '20%', 
                        fontSize: '15px', 
                        backgroundColor: tabInputSource === pInputSource.IMG ? 'red' : 'transparent', 
                        borderTopLeftRadius: '10px', 
                        borderTopRightRadius: '10px'
                    }} 
                    label="IMAGE" 
                    />
                </Tabs>

                {tabInputSource === pInputSource.WEBCAM && (
                    <Paper style={{margin: '2%'}} elevation={5}>
                    <Button variant="outlined" onClick={() => switchSource('webcam')}>START / RESTART Webcam</Button>
                    <FormControl fullWidth>
                        <Select
                        labelId="camera-source-label"
                        id="devices"
                        label="Choose your camera source"
                        onChange={getVideo}
                        inputRef={deviceSelect}
                        defaultValue={selectedWebcamIdx}
                        >
                        {videoDevices.map((device, index) => (
                            <MenuItem key={index} value={index}>{device.label}</MenuItem>
                        ))}
                        </Select>
                    </FormControl>
                    </Paper>
                )}

                {tabInputSource === pInputSource.VIDEO && (
                    <Paper style={{margin: '2%'}} elevation={5}>
                        <Input
                            type="file"
                            inputProps={{ accept: 'video/*' }}
                            onChange={(e) => switchSource(e.target.files[0])}
                        />
                    </Paper>
                )}

                {tabInputSource === pInputSource.IMG && (
                    <Paper style={{margin: '2%'}} elevation={5}>
                        <Input
                            type="file"
                            inputProps={{ accept: 'image/*' }}
                            onChange={(e) => loadImageFile(e.target.files[0])}
                        />
                    </Paper>
                )}


                <hr></hr>
                <Box sx={{ display: 'flex', gap: 2, margin: '5px', alignItems: 'center' }}>
                    <strong style={{marginLeft: '20px'}}> Configurar umbral fondo: </strong> 
                    <CustomSlider
                        valueLabelDisplay="auto"
                        aria-label="pretto slider"
                        onChange={ handleSliderChange }
                        value={ threshold}
                        min={0}
                        max={255}
                        style = {{width : '50%', margin: '10px'}}
                    />

                    <strong style={{marginLeft: '20px'}}> Cambiar modelo: </strong> 
                    <Slider
                        valueLabelDisplay="auto"
                        aria-label="modelo slider"
                        onChange={sliderActionChangeModel}
                        min={0}
                        max={1}
                        step={1}
                        value={ selfieSegmentationModel_modelSelected }
                        style={{ width: '5%' }}
                    />
                </Box>

                <hr></hr>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '10px', alignItems: 'center'}}>
                    <Button disabled={isRecording} variant="contained" color="primary" onClick={startAllRecordings} style={{ width: '150px', height: '30px', '&:hover': { backgroundColor: '#4e90b3' }}}>
                        Grabar
                    </Button>
                    <Button disabled={!isRecording} variant="contained" color="secondary" onClick={stopAllRecordings} style={{ width: '150px', height: '30px', '&:hover': { backgroundColor: '#4e90b3' }}}>
                        Parar
                    </Button>
                    <Button variant="contained" onClick={handleStart} style={{ color:'white', backgroundColor: 'green', width: '250px', height: '30px', '&:hover': { backgroundColor: '#4e90b3' } }}>
                        Start
                    </Button>
                    <Chip style={{width: '100px'}} label={'FPS: '+ fpsVideoMain} variant="outlined" size="small" color="primary" />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '10px'  }}>
                    {Object.keys(blobs).map(key => (
                        blobs[key] && blobs[key].size > 0 && (
                            <Button
                                key={key}
                                onClick={() => downloadBlob(blobs[key], `${key}.webm`)}
                                style={{ padding: '4px', border: '1px solid black' }}
                            >
                                Descargar {key}
                            </Button>
                        )
                    ))}
                </Box>

            </Paper>
            <Paper style={{width: '100%', padding: '10px'}} elevation={2}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                    <video  ref={videoElementRef} id="gum_video" autoPlay muted playsInline className="mirror" style={{ display: 'none', width: videoWidth, height: videoHeight }} onEnded={() => setFpsVideoMain(0)} onPause={() => setFpsVideoMain(0)}/>
                    <canvas ref={videoCanvasRef} id="video_canvas" className="mirror" style={{ width: videoWidth, height: videoHeight }}></canvas>
                    <canvas ref={transparentCanvasRef} id="transparent_canvas" className="mirror" style={{ width: videoWidth, height: videoHeight }}></canvas>
                    <canvas ref={greenScreenCanvasRef} id="green_screen_canvas" className="mirror" style={{ width: videoWidth, height: videoHeight }}></canvas>
                </div>
            </Paper>
            </div>

            <div style={{display: screenActivated === pScreenActivatedOptions.WEBRTC ? 'block' : 'none'}}>
                <Paper style={{width: '90%', margin: '5%'}} elevation={2}>
                    <div style={{ 
                        margin: '10px', 
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        fontSize: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        backgroundColor: '#2b56ff',
                        color: 'white'
                    }}> 
                        <IconButton onClick={() => setScreenActivated(pScreenActivatedOptions.VIDEO)}>
                            <ArrowBackIos style={{ color: 'white' }} />
                        </IconButton>

                        WEBRTC CONNECTION SETTING

                        <IconButton onClick={() => setScreenActivated(pScreenActivatedOptions.EVALUATION)}>
                            <ArrowForwardIos style={{ color: 'white' }} />
                        </IconButton>
                    </div>

                    <hr></hr>

                    <Tabs
                        value={tabWebRTC}
                        onChange={(event, newValue) => { setTabWebRTC(newValue); }}
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
                            backgroundColor: tabWebRTC === pWebRTCOptions.LOCAL ? 'red' : 'transparent', 
                            borderTopLeftRadius: '10px', 
                            borderTopRightRadius: '10px'
                        }} 
                        label="LOCAL" 
                        />
                        <Tab 
                        style={{
                            minWidth: '20%', 
                            fontSize: '15px', 
                            backgroundColor: tabWebRTC === pWebRTCOptions.JANUS ? 'red' : 'transparent', 
                            borderTopLeftRadius: '10px', 
                            borderTopRightRadius: '10px'
                        }} 
                        label="REMOTE - JANUS" 
                        />
                    </Tabs>

                    {tabWebRTC === pWebRTCOptions.LOCAL && (

                            
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '10px'}}>
                                <Button
                                    variant="contained"
                                    onClick={() => startWebRTC(streams.current.video)}
                                    sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
                                >
                                    INIT CALL - VIDEO
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => startWebRTC(streams.current.canvas1)}
                                    sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
                                >
                                    INIT CALL - CANVAS1
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => startWebRTC(streams.current.canvas2)}
                                    sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
                                >
                                    INIT CALL - CANVAS2
                                </Button>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={stopWebRTC}
                                    sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
                                >
                                    HANG UP
                                </Button>
                            </Box>
                    )}

                    {tabWebRTC === pWebRTCOptions.JANUS && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '10px'}}>
                        <Button
                            variant="contained"
                            onClick={() => boton1(streams.current.video)}
                            sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
                        >
                            BOTON1
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => boton2(streams.current.canvas1)}
                            sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
                        >
                            BOTON2
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => boton3(streams.current.canvas2)}
                            sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
                        >
                            BOTON3
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={ano}
                            sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
                        >
                            BOTON4
                        </Button>
                    </Box>
                    )}

                </Paper>
                



                <Paper style={{ width: '100%', padding: '10px' }} elevation={2}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    
                    {/* Box de la derecha para connectionStatusSRC */}
                    <Box style={{ 
                        marginLeft: '10px', 
                        minWidth: '150px', 
                        padding: '15px', 
                        borderRadius: '10px', 
                        border: '2px solid red'
                    }}>
                        <Box style={{
                            backgroundColor: 'red', 
                            borderRadius: '8px',
                            padding: '5px',
                            marginBottom: '10px' // Espacio debajo del encabezado
                            }}>
                            <Typography variant="body1" style={{ color: 'white', display: 'flex',  justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                                <ForwardToInboxIcon style={{marginRight: '10px'}}/> <strong> ConnectionStatusSRC </strong>
                            </Typography>
                        </Box>

                        {Object.keys(connectionStatusSRC).length === 0 ? (
                            // Si connectionStatusSRC está vacío, muestra "APAGADO"
                            <Typography variant="body1" style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                height: '100%' 
                            }}>
                                APAGADO
                            </Typography>
                        ) : (
                            // Si connectionStatusSRC tiene datos, los muestra
                            Object.entries(connectionStatusSRC).map(([key, value]) => (
                                <Typography key={key} variant="body1">
                                    <strong>{key}</strong>: {value}
                                </Typography>
                            ))
                        )}



                    </Box>


                    {/* Componente de video */}
                    {localPeerConnectionRef.current && (
                        <video
                        controls
                        ref={webRTC_videoElement}
                        id="webrtc_video"
                        autoPlay
                        muted
                        playsInline
                        className="mirror"
                        style={{ width: videoWidth, height: videoHeight, margin: '10px' }}
                        ></video>
                    )}

                    {/* Box de la izquierda para connectionStatusRCV */}
                    <Box style={{ 
                        marginRight: '10px', 
                        minWidth: '150px', 
                        padding: '15px', 
                        borderRadius: '10px', 
                        border: '2px solid #03d204' 
                    }}>

                        <Box style={{
                            backgroundColor: '#03d204', 
                            borderRadius: '8px',
                            padding: '5px',
                            marginBottom: '10px' // Espacio debajo del encabezado
                            }}>
                            <Typography variant="body1" style={{ color: 'black', display: 'flex',  justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                                <MarkunreadMailboxIcon style={{marginRight: '10px'}}/> <strong> ConnectionStatusRCV </strong>
                            </Typography>
                        </Box>

                        {Object.keys(connectionStatusRCV).length === 0 ? (
                            // Si connectionStatusRCV está vacío, muestra "APAGADO"
                            <Typography variant="body1" style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                height: '100%' 
                            }}>
                                APAGADO
                            </Typography>
                        ) : (
                            // Si connectionStatusRCV tiene datos, los muestra
                            Object.entries(connectionStatusRCV).map(([key, value]) => (
                                <Typography key={key} variant="body1">
                                    <strong>{key}</strong>: {value}
                                </Typography>
                            ))
                        )}
                    </Box>



                    </div>
                </Paper>

            </div>

            <div style={{display: screenActivated === pScreenActivatedOptions.EVALUATION ? 'block' : 'none'}}>
                <Paper style={{width: '90%', margin: '5%'}} elevation={2}>
                    <div style={{ 
                        margin: '10px', 
                        textAlign: 'center', 
                        fontWeight: 'bold', 
                        fontSize: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        backgroundColor: '#2b56ff',
                        color: 'white'
                    }}> 
                        <IconButton onClick={() => setScreenActivated(pScreenActivatedOptions.WEBRTC)}>
                            <ArrowBackIos style={{ color: 'white' }} />
                        </IconButton>

                        BENCHMARKING SEGMENTATION

                        <IconButton onClick={() => setScreenActivated(pScreenActivatedOptions.VIDEO)}>
                            <ArrowForwardIos style={{ color: 'white' }} />
                        </IconButton>
                    </div>

                    <hr></hr>

                </Paper>
            </div>

            </HomeWrapper>
        </>
    );
}