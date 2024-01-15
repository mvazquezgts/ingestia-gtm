import React, { useContext, useEffect, useRef, useState } from 'react'
import deeplab_v3_model from '../assets/models/deeplab_v3.tflite'; // Asegúrate de que la ruta sea correcta
import selfie_segmenter_landscape from '../assets/models/selfie_segmenter_landscape.tflite'; // Asegúrate de que la ruta sea correcta
import selfie_segmenter_general from '../assets/models/selfie_segmenter.tflite'; // Asegúrate de que la ruta sea correcta
import selfie_multiclass from '../assets/models/selfie_multiclass.tflite'; // Asegúrate de que la ruta sea correcta
import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";
import { applyGreenMask, applyBinaryMask, applyBlurMask, applyImageMask } from "./CanvasProcessing"

const SegmenterProviderContext = React.createContext();
export function useSegmenterProvider() {
    return useContext(SegmenterProviderContext)
}

export const createImageSegmenter = async (model, mode='IMAGE', delegate='GPU') => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
    const imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: model,
          delegate: delegate
        },
        outputCategoryMask: true,
        outputConfidenceMasks: true,
        runningMode: mode
    });
    return imageSegmenter;
};

export function SegmenterProvider({ children }) {
    const [imageSegmenter, setImageSegmenter] = useState(null);
    const [videoSegmenter, setVideoSegmenter] = useState(null);
    const [statusSegmenter, setStatusSegmenter] = useState(false);

    const [configModelSegmenter, setConfigModelSegmenter] = useState('SELFIE_GENERAL');
    const [configDelegateSegmenter, setConfigDelegateSegmenter] = useState('CPU');
    const [configThresholdSegmenter, setConfigThresholdSegmenter] = useState(0.5);

    const [configCanvasOutBlurringActivate, setConfigCanvasOutBlurringActivate] = useState(false)
    const [configCanvasOutBlurringPixels, setConfigCanvasOutBlurringPixels] = useState(5)

    const [configTypeCanvas, setConfigTypeCanvas] = useState(0.5);
    const [configIntensitivyBlur, setConfigIntensitivyBlur] = useState(0.5);

    const configThresholdSegmenter_ref = useRef(null);
    const configCanvasOutBlurringPixels_ref = useRef(null);


    const [fpsSegmenter, setFpsSegmenter] = useState(0)
    const [fpsSegmenterExact, setFpsSegmenterExact] = useState(0)

    const animationFrameId = useRef(null);
    const canvas = useRef(null);
    const context = useRef(null);
    const videoElement = useRef(null);
    const segmentationData = useRef(null);
    
    const options_models_available= {
        'SELFIE_GENERAL': selfie_segmenter_general,
        'SELFIE_LANDSCAPE': selfie_segmenter_landscape,
        'DEEPLAB_V3': deeplab_v3_model,
        'SELFIE_MULTICLASS': selfie_multiclass,
    }
    
    const initializeSegmenters = async (modelSegmenter, delegate) => {
        setImageSegmenter(await createImageSegmenter(options_models_available[modelSegmenter], 'IMAGE', delegate));
        setVideoSegmenter(await createImageSegmenter(options_models_available[modelSegmenter], 'VIDEO', delegate));
    };

    useEffect(() => {
        if (statusSegmenter){
            initializeSegmenters(configModelSegmenter, configDelegateSegmenter);
        }
        else{
            // setImageSegmenter(null)
            // setVideoSegmenter(null)
            setFpsSegmenter(0)
            setFpsSegmenterExact(0)
        }
    }, [statusSegmenter, configModelSegmenter, configDelegateSegmenter])

    useEffect(() => {
        configThresholdSegmenter_ref.current = configThresholdSegmenter
    }, [configThresholdSegmenter])

    useEffect(() => {
        configCanvasOutBlurringPixels_ref.current = configCanvasOutBlurringPixels
    }, [configCanvasOutBlurringPixels])
    
    function stopCurrentProcessing() {
        if (animationFrameId.current !== null) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        setFpsSegmenter(0)
    }

    async function processVideoStream(inputStream, outputStreamSetter, segmenter, maskOperation) {
        stopCurrentProcessing();
        canvas.current = document.createElement('canvas');
        context.current = canvas.current.getContext('2d');
        videoElement.current = document.createElement('video');
        videoElement.current.srcObject = inputStream;
        videoElement.current.muted = true;
        videoElement.current.play();
    
        let vid_previous = -1
        let vid_now = -1
        let time_previous = -1
        let time_now = -1
        let fpsValuesSegmenterExact = [];
        
        const processFrame = async () => {
            vid_now = videoElement.current.currentTime
            time_now = performance.now()
            if (vid_now > vid_previous){
                if (videoElement.current.readyState === videoElement.current.HAVE_ENOUGH_DATA) {
                    canvas.current.width = videoElement.current.videoWidth;
                    canvas.current.height = videoElement.current.videoHeight;

                    context.current.drawImage(videoElement.current, 0, 0, canvas.current.width, canvas.current.height);
                    segmentationData.current = await segmenter.segmentForVideo(context.current.getImageData(0, 0, canvas.current.width, canvas.current.height), performance.now());

                    // // Aplica la máscara verde en base a la segmentación
                    if (segmentationData.current && segmentationData.current.confidenceMasks) {

                        if ( maskOperation == "GREEN" ) applyGreenMask(context.current, segmentationData.current.confidenceMasks, canvas.current.width, canvas.current.height, configModelSegmenter, configThresholdSegmenter_ref.current)
                        if ( maskOperation == "BW" ) applyBinaryMask(context.current, segmentationData.current.confidenceMasks, canvas.current.width, canvas.current.height, configModelSegmenter, configThresholdSegmenter_ref.current)
                        if ( maskOperation == "BLUR" ) applyBlurMask(context.current, segmentationData.current.confidenceMasks, canvas.current.width, canvas.current.height, configModelSegmenter, configThresholdSegmenter_ref.current, configCanvasOutBlurringPixels_ref.current)
                        if ( maskOperation == "IMAGE" ) applyImageMask(context.current, segmentationData.current.confidenceMasks, canvas.current.width, canvas.current.height, configModelSegmenter, configThresholdSegmenter_ref.current)


                        // const fpsSegmenter = (1 / (vid_now - vid_previous)).toFixed();
                        // const fpsSegmenterExact = (1000 / (time_now - time_previous)).toFixed();
                        fpsValuesSegmenterExact = [...fpsValuesSegmenterExact, (1000 / (time_now - time_previous))];
                        if (fpsValuesSegmenterExact.length > 60) {
                            fpsValuesSegmenterExact.shift();
                        }
                        setFpsSegmenterExact((fpsValuesSegmenterExact.reduce((acumulador, valorActual) => acumulador + valorActual, 0) / fpsValuesSegmenterExact.length).toFixed(0))
                        
                        vid_previous = vid_now
                        time_previous = time_now
                    }
                }
            }

            if (animationFrameId.current !== null) {
                animationFrameId.current = requestAnimationFrame(processFrame);
            }
        };
    
        videoElement.current.onplay = () => {
            animationFrameId.current = requestAnimationFrame(processFrame);
        };
    
        outputStreamSetter(canvas.current.captureStream());
    }
    

    /* Exported values */
    const value = {
        statusSegmenter,
        setStatusSegmenter,

        imageSegmenter,
        videoSegmenter,
        fpsSegmenter,
        fpsSegmenterExact,
        
        processVideoStream,
        stopCurrentProcessing,

        configModelSegmenter,
        configDelegateSegmenter,
        configThresholdSegmenter,
        setConfigModelSegmenter,
        setConfigDelegateSegmenter,
        setConfigThresholdSegmenter,

        configCanvasOutBlurringActivate,
        setConfigCanvasOutBlurringActivate,
        configCanvasOutBlurringPixels,
        setConfigCanvasOutBlurringPixels,

        // applyGreenMask,
        // applyBinaryMask,
        // applyBlurMask,

        // jointBilateralFilter,
        // lightWrap,

        // convertArrayToBinaryMask,

        options_models_available
    }

    return (
        <SegmenterProviderContext.Provider value={value}>
            {children}
        </SegmenterProviderContext.Provider>
    )
}