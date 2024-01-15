import React, { useEffect, useState, useRef } from 'react'
import { Paper } from "@material-ui/core";
import Janus from 'janus-gateway';
import { Box, Button, TextField, FormControl, InputLabel, Select, MenuItem} from '@material-ui/core';

import { Chip } from '@material-ui/core'
import { useStreamProvider } from "../api/StreamProvider";
import { SourceRecorder } from "../components/SourceRecorder";
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';



export function WebRTC_JanusEcho(props) {
    const {} = props

	const { 
        main_streamVideoCanvasOut, 
        main_streamSegmentationCanvasOut,
		videoWidth,
		videoHeight
    } = useStreamProvider();

    const webRTC_LocalElement = useRef(null);
    const webRTC_RcvElement = useRef(null);
	const canvas = document.createElement('canvas')
	const context = canvas.getContext('2d')

	const stream_sender_ref = useRef(main_streamVideoCanvasOut)
	const stream_receiver = useRef(null)


    const janus_ref = useRef(null);
	const echotest_ref = useRef(null)
    var opaqueId = "echotest-"+Janus.randomString(12);

	const bitrateTimer_ref = useRef(null);
    var echotestPluginBackend = "janus.plugin.echotest";
	const [paperWidth, setPaperWidth] = useState(70)

	const server_ref = useRef('')
	
	const [ bitrate, setBitrate ] = useState(0)
	const [ capBitrate, setCapBitrate ] = useState(0)
	const [ isHovered, setIsHovered ] = useState(false)

	const [protocolServer, setProtocolServer] = useState('http')
	const [ipServer, setIpServer ] = useState("localhost")
	const [portServer, setPortServer ] = useState("8088")

	const [janusState, setJanusState] = useState(false)


    useEffect(() => {
		
		console.log("🚀 ~ WebRTC_JanusEcho ~ window.location.hostname:", window.location.hostname)
		console.log("🚀 ~ WebRTC_JanusEcho ~ window.location.hostname:", window.location.protocol)

		return () => {
			clearInterval(bitrateTimer_ref.current);
			bitrateTimer_ref.current = null;
		};

    }, [])

	useEffect(() => {
		// Ejemplo: "http://localhost:8088/janus";

		server_ref.current = protocolServer+"://" + ipServer + ":"+ portServer +"/janus";
		console.log("🚀 ~ useEffect ~ server_ref.current:", server_ref.current)

    }, [protocolServer, ipServer, portServer])
    

    function handle_Start_Janus (){
        console.log("🚀 ~ file: WebRTC.js:37 ~ start_Janus ~ handle_Start_Janus:", handle_Start_Janus)

        Janus.init({debug: "all", callback: function() {
            if(!Janus.isWebrtcSupported()) {
				alert("No WebRTC support... ");
				return;
			}
        }})

		janus_ref.current = new Janus(
			{
				server: server_ref.current,
				iceServers: null,
				success: function() {
					janus_ref.current.attach(
						{
							plugin: echotestPluginBackend,
							opaqueId: opaqueId,
							success: function(pluginHandle) {
								setJanusState(true)
								// echotest = pluginHandle;
								echotest_ref.current = pluginHandle
								console.log("Plugin attached! (" + echotest_ref.current.getPlugin() + ", id=" + echotest_ref.current.getId() + ")");
								// Negotiate WebRTC
								let body = { audio: true, video: true };
								console.debug("Sending message:", body);
								echotest_ref.current.send({ message: body });
								console.debug("Trying a createOffer too (audio/video sendrecv)");
								echotest_ref.current.createOffer(
									{
										tracks: [
											{ type: 'video', capture: stream_sender_ref.current.getVideoTracks()[0], recv: true }
										],

										success: function(jsep) {
											Janus.debug("Got SDP!", jsep);
											echotest_ref.current.send({ message: body, jsep: jsep });
										},
										error: function(error) {
											Janus.error("WebRTC error:", error);
											alert("WebRTC error... " + error.message);
										}
									});
							},
							error: function(error) {
								console.error("  -- Error attaching plugin...", error);
								alert("Error attaching plugin... " + error);
							},
							iceState: function(state) {
								console.log("ICE state changed to " + state);
							},
							mediaState: function(medium, on, mid) {
								console.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium + " (mid=" + mid + ")");
							},
							webrtcState: function(on) {
								console.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
							},
							slowLink: function(uplink, lost, mid) {
								console.warn("Janus reports problems " + (uplink ? "sending" : "receiving") +
									" packets on mid " + mid + " (" + lost + " lost packets)");
							},
							onmessage: function(msg, jsep) {
								console.debug(" ::: Got a message :::", msg);
								if(jsep) {
									console.debug("Handling SDP as well...", jsep);
									echotest_ref.current.handleRemoteJsep({ jsep: jsep });
								}
								console.log("🚀 ~ file: WebRTC.js:121 ~ Janus.init ~ msg:", msg)
								let result = msg["result"];
								if(result) {
									if(result === "done") {
										// alert("The Echo Test is over");
										return;
									}
									let status = result["status"];
									if(status === "slow_link") {
										alarm("Janus apparently missed many packets we sent, maybe we should reduce the bitrate - Packet loss?");
									}
								}
							},
							onlocaltrack: function(track, on) {
								console.log("Local track " + (on ? "added" : "removed") + ":", track);
								let trackId = track.id.replace(/[{}]/g, "");
								console.log("trackId:", trackId);

								// Janus.attachMediaStream(webRTC_LocalElement.current, new MediaStream([track]));

							},
							onremotetrack: function(track, mid, on, metadata) {
								console.log(
									"Remote track (mid=" + mid + ") " +
									(on ? "added" : "removed") +
									(metadata ? " (" + metadata.reason + ") ": "") + ":", track
								);

								stream_receiver.current = new MediaStream([track])
								Janus.attachMediaStream(webRTC_RcvElement.current, stream_receiver.current);
								if(!bitrateTimer_ref.current) {
									bitrateTimer_ref.current = setInterval(() => {
										try{
											let bitrate = echotest_ref.current.getBitrate();
											setBitrate(bitrate)
										}catch{
											console.log('No ha sido posible acceder a bsnow')
										}

										console.log("🚀 ~ file: WebRTC.js:176 ~ bitrateTimer=setInterval ~ bitrate:", bitrate)
										console.log("🚀 ~ file: WebRTC.js:176 ~ bitrateTimer=setInterval ~ echotest.getLocalTracks:", echotest_ref.current.getLocalTracks())
									}, 1000);
								}
							},
							ondataopen: function(label, protocol) {
								console.log("The DataChannel is available!");
							},
							oncleanup: function() {
								console.log(" ::: Got a cleanup notification :::");
							}
						});
				},
				error: function(error) {
					alert("Error al tratar de conectarse al servidor. No ha sido posible establecer conexión con el servidor.");
					stopJanus()
				},
				destroyed: function() {
					// alert("Janus drestroyed - is over");
				}
			});
        
    }


	const loadLocalStream = async (inputStream) => {
		webRTC_LocalElement.current.srcObject = inputStream;
	
		return new Promise((resolve, reject) => {
			webRTC_LocalElement.current.onloadedmetadata = () => {
				try {
					webRTC_LocalElement.current.play();
					canvas.width = webRTC_LocalElement.current.videoWidth;
					canvas.height = webRTC_LocalElement.current.videoHeight;
					const render = () => {
						try{
							if (webRTC_LocalElement.current.ended || webRTC_LocalElement.current.paused) {
								return;
							}
							context.drawImage(webRTC_LocalElement.current, 0, 0, canvas.width, canvas.height);
							requestAnimationFrame(render);
						}catch{

						}
						
					};
					render();
					// Capturar el stream del canvas
					stream_sender_ref.current = canvas.captureStream();
					resolve(stream_sender_ref.current);
				} catch (error) {
					reject(error);
				}
			};
		});
	};
	



	function connectStreamJanus(stream){
		loadLocalStream(stream)
		handle_Start_Janus()
	}

	function stopJanus(){
		if (janus_ref.current) {
			if (echotest_ref.current) {
				echotest_ref.current.detach({
					success: function() {
						console.log("Plugin detached successfully");
					},
					error: function(error) {
						console.error("Error detaching plugin:", error);
					}
				});
			}

			// Destruir la instancia de Janus
			janus_ref.current.destroy({
				success: function() {
					console.log("Janus destroyed");
					janus_ref.current = null;
				},
				error: function(error) {
					console.error("Error destroying Janus:", error);
				}
			});
			
		} else {
			console.log("No active Janus instance to stop");
			janus_ref.current = null
			setJanusState(false)
		}
	}

	useEffect(() => {
		console.log("🚀 ~ WebRTC_JanusEcho ~ janus_ref.current:", janus_ref.current)
		if (!janus_ref.current) {

			if(bitrateTimer_ref.current){
				clearInterval(bitrateTimer_ref.current);
				bitrateTimer_ref.current = null;
				setCapBitrate(0)
			}
			
		}
    }, [janus_ref.current])
    

	function stopInterval(){
		// if(bitrateTimer_ref.current){
		// 	clearInterval(bitrateTimer_ref.current);
		// 	bitrateTimer_ref.current = null;
		// }
	}

	function doHangup() {
		console.log('doHangup')
		if(janus_ref.current){
			console.log('doHangup ok ')
			clearInterval(bitrateTimer_ref.current);
			echotest_ref.current.send({ message: { request: "hangup" } })
			echotest_ref.current.hangup();
			janus_ref.current.destroy();
			janus_ref.current = null
			bitrateTimer_ref.current = null;
			webRTC_LocalElement.current.srcObject = null
		}
	}

	function changeSettingJanus_EchoTest (cap) {
        const bitrate = parseInt(cap)*1000;
		echotest_ref.current.send({ message: { bitrate: bitrate }});

    }

	

	const incrementWidth = () => {
        setPaperWidth(prevWidth => prevWidth < 100 ? prevWidth + 10 : prevWidth);
    };

    // Función para disminuir el ancho
    const decrementWidth = () => {
        setPaperWidth(prevWidth => prevWidth > 40 ? prevWidth - 10 : prevWidth);
    };

	const hoverStyles = {
        position: 'absolute', 
        top: 0, 
        right: 0, 
        width: '100px', 
        height: '5%', 
        backgroundColor: 'white', 
        opacity: isHovered ? 1 : 0.7
    };
	
    return (
        <>
		{janus_ref.current == null &&
			<Paper>
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
					<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
					<FormControl style={{ width: '100px', marginRight: '10px' }}>
						<InputLabel id="protocol-label">Protocolo</InputLabel>
						<Select
							labelId="protocol-label"
							id="protocol-select"
							value={protocolServer}
							label="Protocolo"
							onChange={(e) => setProtocolServer(e.target.value)}
						>
							<MenuItem value="http">HTTP</MenuItem>
							<MenuItem value="https">HTTPS</MenuItem>
						</Select>
					</FormControl>
					<TextField
						label="IP servidor Janus"
						variant="outlined"
						value={ipServer}
						onChange={(e) => setIpServer(e.target.value)}
						style={{ width: '30%', marginRight: '10px'}}
					/>
					<TextField
						label="Puerto"
						variant="outlined"
						value={portServer}
						onChange={(e) => setPortServer(e.target.value)}
						style={{ width: '15%', marginRight: '10px' }}
					/>
					</Box>
				</Box>
			</Paper>
		}

		<Paper>
			<Box sx={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '10px', height: '40px'}}>
				<Button
					variant="contained"
					onClick={()=>{connectStreamJanus(main_streamVideoCanvasOut)}}
					sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
					disabled={main_streamVideoCanvasOut === null || janus_ref.current !== null}
				>
					ENVIAR VÍDEO ORIGINAL
				</Button>

				<Button
					variant="contained"
					onClick={()=>{connectStreamJanus(main_streamSegmentationCanvasOut)}}
					sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
					disabled={main_streamSegmentationCanvasOut === null || janus_ref.current !== null}
				>
					ENVIAR VÍDEO PROCESADO
				</Button>
				<Button
					variant="contained"
					color="secondary"
					onClick={stopJanus}
					sx={{ backgroundColor: '#5ea0d4', width: '200px', height: '50px', '&:hover': { backgroundColor: '#4e90b3' }}}
					disabled={janus_ref.current === null}
				>
					DESCONECTAR
				</Button>
			</Box>
		</Paper>

		<Paper id='paperVideos' elevation={2} style={{ margin: 'auto', width: `${paperWidth}%`, marginTop: '1%' }}>
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 'auto', margin: '-5px' }}>
                    <Button onClick={decrementWidth}><ArrowCircleDownIcon /></Button>
                    <span> <strong> Espacio de visualización:</strong> {paperWidth}%</span>
                    <Button onClick={incrementWidth}><ArrowCircleUpIcon /></Button>
                </div>
                <div style={{ 
					display: janus_ref.current === null ? 'none' : 'flex',
					flexWrap: 'wrap', 
					alignItems: 'center', 
					justifyContent: 'center', 
					padding: '5px', 
					gap: '10px' 
				}}>
                    <div style={{ width: 'calc(50% - 10px)', position: 'relative', paddingBottom: 'calc(50% - 10px)' }}>
                        <video ref={webRTC_LocalElement} id="webrtc_video_sender" autoPlay muted playsInline className="mirror" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />   
						{stream_sender_ref.current &&
							<Select
								labelId="bandwidth-select-label"
								id="bandwidth-select"
								value={capBitrate}
								onChange={(e) => {changeSettingJanus_EchoTest(e.target.value); setCapBitrate(e.target.value)}}
								// onChange={(e) => {changeSettingJanus_EchoTest(e.target.value)}}
								style={{ position: 'absolute', top: '1%', right: '1%', width: '150px', height: '20px', backgroundColor: 'white', opacity: isHovered ? 1 : 0.4 , fontSize: '13px', margin:'auto'}}
								onMouseEnter={() => setIsHovered(true)}
            					onMouseLeave={() => setIsHovered(false)}
								>
								<MenuItem style={{ display: 'flex' }}value={0}>No limit</MenuItem>
								<MenuItem style={{ display: 'flex' }}value={128}>Cap to 128kbit</MenuItem>
								<MenuItem style={{ display: 'flex' }}value={256}>Cap to 256kbit</MenuItem>
								<MenuItem style={{ display: 'flex' }}value={512}>Cap to 512kbit</MenuItem>
								<MenuItem style={{ display: 'flex' }}value={1024}>Cap to 1Mbit</MenuItem>
								<MenuItem style={{ display: 'flex' }}value={2048}>Cap to 2Mbit</MenuItem>
							</Select> 

						}
						       
                    </div>
					
                    <div style={{ width: 'calc(50% - 10px)', position: 'relative', paddingBottom: 'calc(50% - 10px)' }}>
                        <video ref={webRTC_RcvElement} id="webrtc_video_rcv" autoPlay muted playsInline className="mirror" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)'  }} />
						{ bitrate !== 0 && <Chip style={{position: 'absolute', top: '10px',right: '10px', width: '100px', backgroundColor: 'white', color: 'black', fontWeight: 'bold', border: '2px solid #1976d2'}} label={bitrate} variant="outlined" size="small" color="primary" /> }
                    </div>
                </div>
				<div style={{display: janus_ref.current === null ? 'none' : 'block'}}>
					<SourceRecorder  stream={ stream_receiver.current }/>
				</div>
            </Paper>

        <Paper>

        </Paper>
        </>
    )
}



