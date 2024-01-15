import React, { useEffect, useState, useRef } from 'react'
import { Paper } from "@material-ui/core";
import { Box, Button, IconButton, Input } from '@material-ui/core';
import { useStreamProvider } from "../api/StreamProvider";
import { Typography } from '@mui/material';
import MarkunreadMailboxIcon from '@mui/icons-material/MarkunreadMailbox';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import { SourceRecorder } from "../components/SourceRecorder";

export function WebRTC_BrowserEcho(props) {

	const [connectionStatusSRC, setConnectionStatusSRC] = useState({});   	// Information / Status about stream source - echo test browser
    const [connectionStatusRCV, setConnectionStatusRCV] = useState({});		// Information / Status about stream receiver - echo test browser
	  const { 
      main_streamVideoCanvasOut, 
      main_streamSegmentationCanvasOut,
		  videoWidth,
		  videoHeight
    } = useStreamProvider();

	const localPeerConnectionRef = useRef(null);
    const remotePeerConnectionRef = useRef(null);
	const [triggerPeerConnection, setTriggerPeerConnection] = useState(false); // Estado para activar useEffect

  const stream_Rcv = useRef(null)


	const webRTC_videoElement = useRef(null);

    useEffect(() => {

    }, [])


	const startWebRTC = (stream_selected) => {
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
            stream_Rcv.current = event.streams[0]
            webRTC_videoElement.current.srcObject = stream_Rcv.current;
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
            stream_Rcv.current = null
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
                    const bytesDifference = report.bytesReceived - previousBytesReceived;
                    previousBytesReceived = report.bytesReceived
                    const kbsReceived = (bytesDifference / 1024).toFixed(2);
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


    

    return (
        <>
        <Paper>

			<Box sx={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '10px', height: '40px'}}>
            	<Button
                    variant="contained"
                    onClick={() => startWebRTC(main_streamVideoCanvasOut)}
                    sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
					disabled={main_streamVideoCanvasOut === null}
                >
                    ENVIAR VÍDEO ORIGINAL
                </Button>
                <Button
                    variant="contained"
                    onClick={() => startWebRTC(main_streamSegmentationCanvasOut)}
                    sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
					disabled={main_streamSegmentationCanvasOut === null}
                >
                    ENVIAR VÍDEO PROCESADO
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={stopWebRTC}
                    sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
                >
                    DESCONECTAR
                </Button>
            </Box>

        </Paper>


		<Paper elevation={2} style={{ marginTop: '1%' }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', // Distribución del espacio
                padding: '5px', 
                gap: '10px' 
            }}>
                {/* Primer Box */}
                <Box style={{ 
                    flex: 'none',
                    maxWidth: '20%', // Ajustado al 20% del ancho
                    padding: '15px', 
                    borderRadius: '10px', 
                    border: '2px solid red'
                }}>
                    <Box style={{
                        backgroundColor: 'red', 
                        borderRadius: '8px',
                        padding: '5px',
                        marginBottom: '10px'
                    }}>
                        <Typography variant="body1" style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                            <ForwardToInboxIcon style={{ marginRight: '10px' }}/> <strong>ConnectionStatusSRC</strong>
                        </Typography>
                    </Box>

                    {Object.keys(connectionStatusSRC).length === 0 ? (
                        <Typography variant="body1" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            APAGADO
                        </Typography>
                    ) : (
                        Object.entries(connectionStatusSRC).map(([key, value]) => (
                            <Typography key={key} variant="body1">
                                <strong>{key}</strong>: {value}
                            </Typography>
                        ))
                    )}
                </Box>

                  {/* Video */}
                  <div style={{ 
                      width: '60%', // Ajustado al 60% del ancho
                      position: 'relative', 
                      paddingBottom: 'calc(50% - 10px)' 
                  }}>
                      <video 
                          ref={webRTC_videoElement} 
                          id="video_SectionVideo" 
                          autoPlay 
                          muted 
                          playsInline 
                          className="mirror" 
                          style={{ 
                              position: 'absolute', 
                              top: 0, 
                              left: 0, 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover', 
                              transform: 'scaleX(-1)' 
                          }} 
                      />
                  </div>

                  

                {/* Segundo Box */}
                <Box style={{ 
                    flex: 'none',
                    maxWidth: '20%', // Ajustado al 20% del ancho
                    padding: '15px', 
                    borderRadius: '10px', 
                    border: '2px solid #03d204' 
                }}>
                    <Box style={{
                        backgroundColor: '#03d204', 
                        borderRadius: '8px',
                        padding: '5px',
                        marginBottom: '10px'
                    }}>
                        <Typography variant="body1" style={{ color: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                            <MarkunreadMailboxIcon style={{ marginRight: '10px' }}/> <strong>ConnectionStatusRCV</strong>
                        </Typography>
                    </Box>

                    {Object.keys(connectionStatusRCV).length === 0 ? (
                        <Typography variant="body1" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            APAGADO
                        </Typography>
                    ) : (
                        Object.entries(connectionStatusRCV).map(([key, value]) => (
                            <Typography key={key} variant="body1">
                                <strong>{key}</strong>: {value}
                            </Typography>
                        ))
                    )}
                </Box>
            </div>
            <SourceRecorder stream={ stream_Rcv.current }/>
        </Paper>




        </>
    )
}





							