import React, { useContext, useRef, useState, useEffect } from 'react'
import { useSegmenterProvider } from "./SegmenterProvider";
import { applyCanvasFiltersOnStream, applyGreenMask, applyBinaryMask, applyBlurMask, applyImageMask } from "./CanvasProcessing"

const StreamProviderContext = React.createContext();

export function useStreamProvider() {
    return useContext(StreamProviderContext)
}

export function StreamProvider({ children }) {
    // const streams = useRef({ video: null, segmentation: null, rcv: null });
    const [main_streamVideoCanvas, setMain_streamVideoCanvas] = useState(null);
    const [main_streamSegmentationCanvas, setMain_streamSegmentationCanvas] = useState(null);

    const [main_streamVideoCanvasOut, setMain_streamVideoCanvasOut] = useState(null);
    const [main_streamSegmentationCanvasOut, setMain_streamSegmentationCanvasOut] = useState(null);

    const options_resolutions_available= {
        '320x240 (QVGA)': [320, 240],
        '640x480 (VGA)': [640, 480],
        '800x600 (SVGA)': [800, 600],
        '1280x720 (HD)': [1280, 720],
    }

    const options_canvas_out_available= {
        'GREEN': applyGreenMask,
        'BW': applyBinaryMask,
        'BLUR': applyBlurMask,
        'IMAGE': applyImageMask
    }

    const [configResolutionInput, setConfigResolutionInput] = useState('640x480 (VGA)');
    const [configCanvasOut, setConfigCanvasOut] = useState('GREEN')

    const [configFiltersActivateInput, setConfigFiltersActivateInput] = useState(false)
    const [configBrightnessInput, setConfigBrightnessInput] = useState(100);
    const [configContrastInput, setConfigContrastInput] = useState(100);
    const [configSaturateInput, setConfigSaturateInput] = useState(100);

    const [videoWidth, setVideoWidth] = useState(640);
    const [videoHeight, setVideoHeight] = useState(480);
    const [isPlaying, setIsPlaying] = useState(false)

    const { 
        imageSegmenter,
        videoSegmenter,
        processVideoStream,
        stopCurrentProcessing,
        statusSegmenter,

        setConfigCanvasOutBlurringActivate,

    } = useSegmenterProvider();


    useEffect(() => {
        setVideoWidth(options_resolutions_available[configResolutionInput][0])
        setVideoHeight(options_resolutions_available[configResolutionInput][1])
    }, [configResolutionInput]);

    useEffect(() => {
        setConfigCanvasOutBlurringActivate(configCanvasOut === 'BLUR')
    }, [configCanvasOut]);


    useEffect(() => {
        if (main_streamVideoCanvas && videoSegmenter && imageSegmenter && statusSegmenter) {
            processVideoStream(main_streamVideoCanvasOut, setMain_streamSegmentationCanvas, videoSegmenter, configCanvasOut);
        }else{
            stopCurrentProcessing()
            setMain_streamSegmentationCanvas(null)
        }
    }, [main_streamVideoCanvasOut, videoSegmenter, statusSegmenter, configCanvasOut]);

    useEffect(() => {
        if (configFiltersActivateInput){
            applyCanvasFiltersOnStream(main_streamVideoCanvas, configBrightnessInput, configContrastInput, configSaturateInput).then(filteredStream => {  
                setMain_streamVideoCanvasOut(filteredStream);
            });
        }else{
            setMain_streamVideoCanvasOut(main_streamVideoCanvas)
        }
        
    }, [main_streamVideoCanvas, configFiltersActivateInput, configBrightnessInput, configContrastInput, configSaturateInput]);


    useEffect(() => {
        setMain_streamSegmentationCanvasOut(main_streamSegmentationCanvas)
    }, [main_streamSegmentationCanvas]);


    const closeCurrentStream = () => {
        if (main_streamVideoCanvas) {
            main_streamVideoCanvas.getTracks().forEach(track => track.stop());
            setMain_streamVideoCanvas(null);
            stopCurrentProcessing()
        }
    };

    /* Exported values */
    const value = {
        videoWidth, 
        setVideoWidth,
        videoHeight,
        setVideoHeight,

        main_streamVideoCanvasOut,
        main_streamSegmentationCanvasOut,
        setMain_streamVideoCanvas,
        setMain_streamSegmentationCanvas,

        isPlaying,
        closeCurrentStream,

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
    }

    return (
        <StreamProviderContext.Provider value={value}>
            {children}
        </StreamProviderContext.Provider>
    )
}