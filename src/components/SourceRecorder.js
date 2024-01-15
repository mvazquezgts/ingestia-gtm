import React, { useEffect, useState, useRef } from 'react'
import { Button } from '@material-ui/core';
import { FlashOff } from '@material-ui/icons';

import EmergencyRecordingIcon from '@mui/icons-material/EmergencyRecording';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import DownloadIcon from '@mui/icons-material/Download';


export function SourceRecorder(props) {

    const { stream } = props

    const mediaRecorder = useRef(null);
    const recordedChunks = useRef([]);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [isRecording, setIsRecording] = useState(false);


    useEffect(() => {
        if (stream){
            mediaRecorder.current = new MediaRecorder(stream);
            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.current.push(event.data);
                }
            };
        }
    }, [stream])


    const handleStartRecording = () => {
        mediaRecorder.current.start();
        setIsRecording(true)
        setRecordedBlob(null)
    };

    function handleStopRecording(){
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
            mediaRecorder.current.onstop = () => {
                setRecordedBlob(new Blob(recordedChunks.current, { type: 'video/webm' }))
                recordedChunks.current = [];
            };
        }
        setIsRecording(false)
    }

    function downloadBlob() {
        const url = URL.createObjectURL(recordedBlob);
        const a = document.createElement('a');
        a.href = url;

        const now = new Date();
        const fileName = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.webm`;    
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    };


    

    return (
        <>
        {stream !== null &&
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div>
                    {isRecording 
                        ? <Button onClick={handleStopRecording} style={{ color: 'red' }}> 
                            <StopCircleIcon style={{ marginRight: '10px', color: 'red' }}/> DETENER GRABACIÓN 
                        </Button>
                        : <Button onClick={handleStartRecording} style={{ color: 'blue' }}> 
                            <EmergencyRecordingIcon style={{ marginRight: '10px', color: 'blue' }}/> INICIAR GRABACIÓN 
                        </Button>
                    }
                </div>
                {recordedBlob !== null &&
                    <div>
                        <Button onClick={downloadBlob} style={{ color: 'green' }}> 
                            <DownloadIcon style={{ marginRight: '5px', color: 'green' }}/> DESCARGAR GRABACIÓN 
                        </Button> 
                    </div>
                }
            </div>
        }
        </>
    )
}