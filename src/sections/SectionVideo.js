import React, { useEffect, useState, useRef } from "react";
import { Paper } from "@material-ui/core";
import { Button } from '@material-ui/core';
import { SourceSelection } from "../components/SourceSelection";
import { useStreamProvider } from "../api/StreamProvider";
import { SourceRecorder } from "../components/SourceRecorder";
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';



export function SectionVideo(props) {

    const { 
        main_streamVideoCanvasOut, 
        main_streamSegmentationCanvasOut,
    } = useStreamProvider();

    const main_videoCanvasRef = useRef(null);
    const main_SegmentationCanvasRef = useRef(null);
    const [paperWidth, setPaperWidth] = useState(60)
    const [showRestartButton, setShowRestartButton] = useState(false);


    useEffect(() => {
        main_videoCanvasRef.current.srcObject = main_streamVideoCanvasOut;
    }, [main_streamVideoCanvasOut]);

    useEffect(() => {
        if (main_SegmentationCanvasRef){
            main_SegmentationCanvasRef.current.srcObject = main_streamSegmentationCanvasOut;
        }
    }, [main_streamSegmentationCanvasOut]);


    const incrementWidth = () => {
        setPaperWidth(prevWidth => prevWidth < 100 ? prevWidth + 10 : prevWidth);
    };

    // Función para disminuir el ancho
    const decrementWidth = () => {
        setPaperWidth(prevWidth => prevWidth > 40 ? prevWidth - 10 : prevWidth);
    };


    return (
        <>
        <div style={{width: '80%', margin: 'auto'}}>
            {main_videoCanvasRef !== null &&
                <Paper elevation={2}>
                    <SourceSelection/>
                </Paper>
            }
            <Paper id='paperVideos' elevation={2} style={{ margin: 'auto', width: `${paperWidth}%`, marginTop: '1%' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 'auto', margin: '-5px' }}>
                    <Button onClick={decrementWidth}><ArrowCircleDownIcon /></Button>
                    <span> <strong> Espacio de visualización:</strong> {paperWidth}%</span>
                    <Button onClick={incrementWidth}><ArrowCircleUpIcon /></Button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', padding: '5px', gap: '10px' }}>
                    
                    <div style={{ width: 'calc(50% - 10px)', position: 'relative'}}>
                        <video ref={main_videoCanvasRef} id="video_SectionVideo" autoPlay muted playsInline className="mirror" onEnded={()=>setShowRestartButton(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />           
                        <SourceRecorder stream={main_streamVideoCanvasOut}/>
                    </div>
                    <div style={{ width: 'calc(50% - 10px)', position: 'relative'}}>
                        <video ref={main_SegmentationCanvasRef} id="video_SectionVideo_segmentation" autoPlay muted playsInline className="mirror" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)'  }} />
                        <SourceRecorder stream={main_streamSegmentationCanvasOut}/>
                    </div>
                </div>
            </Paper>
        </div>
        </>
    )
}