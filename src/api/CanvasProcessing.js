import backgroundImageSrc from '../assets/IMGvirtualBG.png';
let backgroundImage = new Image();
backgroundImage.src = backgroundImageSrc;

let canvasFilters = document.createElement('canvas')
let contextFilters = canvasFilters.getContext('2d')

let canvas = document.createElement('canvas');
let context = canvasFilters.getContext('2d')

let originalImageData = null
let backgroundImageData = null
let segmentedImageData = null
let blurredImageData = null
let mask = null
let video = null



export function convertArrayToBinaryMask(data, modelType, binaryThreshold = 0.5) {   
    let binaryMask = Uint8Array.from(data.map(element => element >= binaryThreshold ? 1 : 0));
    if (modelType === 'DEEPLAB_V3' || modelType === 'SELFIE_MULTICLASS') {
        binaryMask = binaryMask.map(element => element === 0 ? 1 : 0);
    }
    return binaryMask;
}

export const applyCanvasFiltersOnStream = async (inputStream, configBrightnessInput, configContrastInput, configSaturateInput) => {
    video = document.createElement('video');
    video.srcObject = inputStream;

    return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
            try {
                video.play();
                
                canvasFilters.width = video.videoWidth;
                canvasFilters.height = video.videoHeight;

                const render = () => {
                    if (video.ended || video.paused) {
                        return;
                    }
                    contextFilters.filter = `brightness(${configBrightnessInput}%) contrast(${configContrastInput}%) saturate(${configSaturateInput}%)`;
                    contextFilters.drawImage(video, 0, 0, canvasFilters.width, canvasFilters.height);
                    requestAnimationFrame(render);
                };

                render();

                // Capturar el stream del canvas
                const outputStream = canvasFilters.captureStream(50);
                resolve(outputStream);
            } catch (error) {
                reject(error);
            }
        };
    });
};

export const applyGreenMask = (ctx, confidenceMasks, width, height, modelType, binaryThreshold=0.5) => {
    originalImageData = ctx.getImageData(0, 0, width, height);
    segmentedImageData = new ImageData(width, height);
    mask = convertArrayToBinaryMask(confidenceMasks[0].getAsFloat32Array(), modelType, binaryThreshold);
    for (let i = 0; i < mask.length; i++) {
        const pixelIndex = i * 4;
        if (mask[i] > 0) {
            // Mantener la persona con su color original
            segmentedImageData.data[pixelIndex] = originalImageData.data[pixelIndex];     // R
            segmentedImageData.data[pixelIndex + 1] = originalImageData.data[pixelIndex + 1]; // G
            segmentedImageData.data[pixelIndex + 2] = originalImageData.data[pixelIndex + 2]; // B
            segmentedImageData.data[pixelIndex + 3] = 255; // Opacidad completa
        } else {
            // Cambiar el fondo a verde
            segmentedImageData.data[pixelIndex] = 0;     // R
            segmentedImageData.data[pixelIndex + 1] = 255; // G (Verde)
            segmentedImageData.data[pixelIndex + 2] = 0;     // B
            segmentedImageData.data[pixelIndex + 3] = 255; // Opacidad completa
        }
    }
    ctx.putImageData(segmentedImageData, 0, 0);
};

export const applyBinaryMask = (cxt, confidenceMasks, width, height, modelType, binaryThreshold=0.5) => {
    originalImageData = cxt.getImageData(0, 0, width, height);
    mask = convertArrayToBinaryMask(confidenceMasks[0].getAsFloat32Array(), modelType, binaryThreshold);
    for (let i = 0; i < mask.length; i++) {
      originalImageData.data[i * 4] = 0; // R
      originalImageData.data[i * 4 + 1] = 0; // G
      originalImageData.data[i * 4 + 2] = 0; // B
      originalImageData.data[i * 4 + 3] = mask[i] > 0 ? 255 : 0; // Alpha (transparencia)  // Blanco si mask[i] > 0, sino negro
    }
    cxt.putImageData(originalImageData, 0, 0);
};

const applyBlurToImageDataWithEdgeExtension = (originalImageData, pixels) => {
    canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
    let edgeExtension = pixels; // Extensión de borde en píxeles

    // Ajustar el tamaño del canvas para tener en cuenta la extensión del borde
    canvas.width = originalImageData.width + 2 * edgeExtension;
    canvas.height = originalImageData.height + 2 * edgeExtension;

    // Dibujar la imagen original en el centro
    context.putImageData(originalImageData, edgeExtension, edgeExtension);

    // Extender los bordes
    // Superior
    context.drawImage(canvas, 
                      edgeExtension, edgeExtension, originalImageData.width, 1, 
                      edgeExtension, 0, originalImageData.width, edgeExtension);
    // Inferior
    context.drawImage(canvas, 
                      edgeExtension, originalImageData.height + edgeExtension - 1, originalImageData.width, 1, 
                      edgeExtension, originalImageData.height + edgeExtension, originalImageData.width, edgeExtension);
    // Izquierda
    context.drawImage(canvas, 
                      edgeExtension, 0, 1, canvas.height, 
                      0, 0, edgeExtension, canvas.height);
    // Derecha
    context.drawImage(canvas, 
                      originalImageData.width + edgeExtension - 1, 0, 1, canvas.height, 
                      originalImageData.width + edgeExtension, 0, edgeExtension, canvas.height);

    // Aplicar el desenfoque
    context.filter = `blur(${pixels}px)`;
    context.drawImage(canvas, 0, 0);

    // Recortar la imagen para quitar la extensión del borde
    return context.getImageData(edgeExtension, edgeExtension, originalImageData.width, originalImageData.height);
}

export const applyBlurMask = (ctx, confidenceMasks, width, height, modelType, binaryThreshold=0.5, pixels=5) => {
    originalImageData = ctx.getImageData(0, 0, width, height);
    blurredImageData = applyBlurToImageDataWithEdgeExtension(originalImageData, pixels); // Aplicar desenfoque a toda la imagen
    segmentedImageData = new ImageData(width, height);
    mask = convertArrayToBinaryMask(confidenceMasks[0].getAsFloat32Array(), modelType, binaryThreshold);
    
    for (let i = 0; i < mask.length; i++) {
        const pixelIndex = i * 4;
        let confidence = mask[i];

        if (mask[i] > 0) {
            // Mantener la persona con su color original
            segmentedImageData.data[pixelIndex] = originalImageData.data[pixelIndex];     // R
            segmentedImageData.data[pixelIndex + 1] = originalImageData.data[pixelIndex + 1]; // G
            segmentedImageData.data[pixelIndex + 2] = originalImageData.data[pixelIndex + 2]; // B
            segmentedImageData.data[pixelIndex + 3] = originalImageData.data[pixelIndex + 3]; // Opacidad
        } else {
            segmentedImageData.data[pixelIndex + 0] = confidence * originalImageData.data[pixelIndex + 0] + (1 - confidence) * blurredImageData.data[pixelIndex + 0];
            segmentedImageData.data[pixelIndex + 1] = confidence * originalImageData.data[pixelIndex + 1] + (1 - confidence) * blurredImageData.data[pixelIndex + 1];
            segmentedImageData.data[pixelIndex + 2] = confidence * originalImageData.data[pixelIndex + 2] + (1 - confidence) * blurredImageData.data[pixelIndex + 2];
            segmentedImageData.data[pixelIndex + 3] = confidence * originalImageData.data[pixelIndex + 3] + (1 - confidence) * blurredImageData.data[pixelIndex + 3];
        }
    }
    ctx.putImageData(segmentedImageData, 0, 0);
};


export const loadBackgroundImage = (src) => {
    backgroundImage = new Image();
    backgroundImage.src = src;
};

export const applyImageMask = (ctx, confidenceMasks, width, height, modelType, binaryThreshold=0.5) => {
    if (!backgroundImage.complete) {
        console.error("Background image not loaded");
        return;
    }

    // Crear un lienzo temporal para redimensionar la imagen de fondo
    canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    // Dibujar la imagen de fondo redimensionada en el lienzo temporal
    context.drawImage(backgroundImage, 0, 0, width, height);

    originalImageData = ctx.getImageData(0, 0, width, height);
    backgroundImageData = context.getImageData(0, 0, width, height);

    mask = convertArrayToBinaryMask(confidenceMasks[0].getAsFloat32Array(), modelType, binaryThreshold);
    segmentedImageData = new ImageData(width, height);

    for (let i = 0; i < mask.length; i++) {
        const pixelIndex = i * 4;
        if (mask[i] > 0) {
            // Usar el pixel de la imagen original para la persona
            segmentedImageData.data[pixelIndex] = originalImageData.data[pixelIndex];     // R
            segmentedImageData.data[pixelIndex + 1] = originalImageData.data[pixelIndex + 1]; // G
            segmentedImageData.data[pixelIndex + 2] = originalImageData.data[pixelIndex + 2]; // B
            segmentedImageData.data[pixelIndex + 3] = originalImageData.data[pixelIndex + 3]; // Opacidad
        } else {
            // Usar el pixel de la imagen de fondo redimensionada
            segmentedImageData.data[pixelIndex] = backgroundImageData.data[pixelIndex];     // R
            segmentedImageData.data[pixelIndex + 1] = backgroundImageData.data[pixelIndex + 1]; // G
            segmentedImageData.data[pixelIndex + 2] = backgroundImageData.data[pixelIndex + 2]; // B
            segmentedImageData.data[pixelIndex + 3] = backgroundImageData.data[pixelIndex + 3]; // Opacidad
        }
    }

    // Poner la imagen segmentada en el contexto
    ctx.putImageData(segmentedImageData, 0, 0);
};