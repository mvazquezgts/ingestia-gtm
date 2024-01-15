import React, { useEffect, useState, useRef } from 'react'
import { Paper } from "@material-ui/core";
import {  Button, LinearProgress, Typography } from '@material-ui/core';
import ImageGallery from 'react-image-gallery';
import { pBenchmarkingImage } from "../utils/parameters";
import { useSegmenterProvider } from '../api/SegmenterProvider';

import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import { applyGreenMask, applyBinaryMask, applyBlurMask, applyImageMask, convertArrayToBinaryMask } from "../api/CanvasProcessing"
import { useStreamProvider } from '../api/StreamProvider';

// import Resizer from 'react-image-file-resizer';


export function SectionBenchmarking(props) {

    const [imageGalleryItems, setImageGalleryItems] = useState([]);
    const [referenceGalleryItems, setReferenceGalleryItems] = useState([]);

    const [showOriginal, setShowOriginal] = useState(true); // Nuevo estado para controlar la visualización
    const [currentIndex, setCurrentIndex] = useState(0); // Nuevo estado para el índice actual


    const [segmentationReady, setSegmentationReady] = useState(false);
    const [progressSegmentation, setProgressSegmentation] = useState({total: 0, processed: 0});
    const [autoProcessing, setAutoProcessing] = useState(false);
    const [globalIOU, setGlobalIOU] = useState(0)


    const [showCarousel, setShowCarousel] = useState(false);
    const [showImage, setShowImage] = useState(pBenchmarkingImage.ORIGINAL); // Nuevo estado para controlar la visualización

    const [gridWidth, setGridWidth] = useState(80); // Estado para el ancho del contenedor
    const [numColumns, setNumColumns] = useState(4); // Estado para el número de columnas
    const [factorReduce, setFactorReduce] = useState(1); // Estado para el número de columnas

    const { 
      imageSegmenter,
      videoSegmenter,
      statusSegmenter,
      configThresholdSegmenter,
      configCanvasOutBlurringActivate,
      configCanvasOutBlurringPixels,
      configModelSegmenter
    } = useSegmenterProvider();

    const { 
      configCanvasOut
    }= useStreamProvider();


    useEffect(() => {
      if (!statusSegmenter){
        setAutoProcessing(false)
      }
    }, [statusSegmenter])

  const handleDirectorySelection = async (event) => {
    const files = Array.from(event.target.files);

    // Filtrar y mapear imágenes JPG
    const jpgImages = files.filter(file => file.name.endsWith('.jpg'));
    const newImages = jpgImages.map(jpgFile => {
        const baseFilename = jpgFile.name.replace('.jpg', '');
        const jsonFile = files.find(file => file.name === `${baseFilename}.json`);
        return {
            filename: jpgFile.name,
            originalUrl: URL.createObjectURL(jpgFile),
            jsonDataUrl: jsonFile ? URL.createObjectURL(jsonFile) : null,
            iou: -1   // Default value
        };
    });

    // Función para cargar datos JSON
    const loadJsonData = async (jsonDataUrl) => {
        try {
            const response = await fetch(jsonDataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Error al cargar el archivo JSON:', error);
            return null;
        }
    };

    // Cargar datos JSON para cada imagen
    const loadedImages = await Promise.all(newImages.map(async (image) => {
        if (image.jsonDataUrl) {
            const jsonData = await loadJsonData(image.jsonDataUrl);
            return { ...image, jsonData };
        }
        return image;
    }));

    // Actualizar el estado con las imágenes y los datos JSON cargados
    setImageGalleryItems([...imageGalleryItems, ...loadedImages]);
    setShowImage(pBenchmarkingImage.ORIGINAL)

    // Actualizar otros estados según sea necesario
    setSegmentationReady(false);
    setProgressSegmentation({ total: 0, processed: 0 });
    setShowCarousel(false);
};
      
    
    function handleResetImageGallery(){
        setImageGalleryItems([])
        setReferenceGalleryItems([])
        setSegmentationReady(false)
        setProgressSegmentation({total: 0, processed:0})
        setShowCarousel(false)
        setCurrentIndex(0)
    }

    const loadImageOriginal = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
    };

    const loadImageReduce = (src, factor_reduce) => {
      return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
              // Crear un canvas
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              // Establecer las dimensiones deseadas
              canvas.width = img.width/factor_reduce;
              canvas.height = img.height/factor_reduce;
              
              // Dibujar la imagen en el canvas con el tamaño deseado
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              // Convertir el canvas a una imagen y resolver la promesa
              canvas.toBlob((blob) => {
                  const resizedImage = new Image();
                  resizedImage.src = URL.createObjectURL(blob);
                  resizedImage.onload = () => resolve(resizedImage);
              });
          };
          img.onerror = reject;
          img.src = src;
      });
  };
    
    const handleImageClick = (index) => {
        setCurrentIndex(index);
        setShowCarousel(true); // Activar modo carrusel
    };
    

    function calculate_IOU(data1, data2) {
        if (data1.length !== data2.length) {
          throw new Error("Los arreglos data1 y data2 deben tener la misma longitud");
        }

        try {
          // Calcular la intersección y la unión
          const intersection = data1.map((value, index) => value && data2[index]);
          const union = data1.map((value, index) => value || data2[index]);
        
          // Contar el número de elementos verdaderos en intersección y unión
          const intersectionCount = intersection.reduce((contador, elemento) => contador + (elemento ? 1 : 0), 0);
          const unionCount = union.reduce((contador, elemento) => contador + (elemento ? 1 : 0), 0);
        
          // Calcular IoU
          return intersectionCount / unionCount;

        }catch{
          return -1
        }
    }

    const handleImageSegmentation = async () => {
      setSegmentationReady(true);
      setProgressSegmentation({ total: imageGalleryItems.length, processed: 0 });
      let arr_iou = [];
    
      const segmentedImages = await Promise.all(
        imageGalleryItems.map(async (item) => {
          const img = factorReduce === 1 ? await loadImageOriginal(item.originalUrl) : await loadImageReduce(item.originalUrl, factorReduce);
          const segmentationData = await imageSegmenter.segment(img);

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
    
          const cxt = canvas.getContext('2d');
          cxt.drawImage(img, 0, 0, canvas.width, canvas.height);
          if ( configCanvasOut == "GREEN" ) applyGreenMask(cxt, segmentationData.confidenceMasks, canvas.width, canvas.height, configModelSegmenter, configThresholdSegmenter)
          if ( configCanvasOut == "BW" ) applyBinaryMask(cxt, segmentationData.confidenceMasks, canvas.width, canvas.height, configModelSegmenter, configThresholdSegmenter)
          if ( configCanvasOut == "BLUR" ) applyBlurMask(cxt, segmentationData.confidenceMasks, canvas.width, canvas.height, configModelSegmenter, configThresholdSegmenter, configCanvasOutBlurringPixels)
          if ( configCanvasOut == "IMAGE" ) applyImageMask(cxt, segmentationData.confidenceMasks, canvas.width, canvas.height, configModelSegmenter, configThresholdSegmenter)

          const segmentedGreenImageUrl = canvas.toDataURL();

          applyBinaryMask(cxt, segmentationData.confidenceMasks, canvas.width, canvas.height, configModelSegmenter, configThresholdSegmenter)
          const segmentedBinaryImageUrl = canvas.toDataURL();

          setProgressSegmentation(prevProgress => ({
            total: prevProgress.total,
            processed: prevProgress.processed + 1
          }));

          let iou = -1
          if (factorReduce === 1) {
            iou = calculate_IOU(convertArrayToBinaryMask(segmentationData.confidenceMasks[0].getAsFloat32Array(), configModelSegmenter, configThresholdSegmenter), Uint8Array.from(item.jsonData));
            arr_iou.push(iou);
          }

          return {
            ...item,
            segmentedBinaryImageUrl: segmentedBinaryImageUrl,
            segmentedGreenImageUrl: segmentedGreenImageUrl,
            iou: factorReduce > 1 ? -1 : iou,
          };
        })
      );

      setImageGalleryItems(segmentedImages);
      setSegmentationReady(true);
      const totalIou = arr_iou.reduce((total, iou) => total + iou, 0);
      const averageIou = totalIou / arr_iou.length;
      setGlobalIOU(averageIou);

      if (autoProcessing) {
        handleImageSegmentation();
      } else {
        setShowCarousel(false);
      }
    };


    const incremenFactorReduce = () => {
      if (factorReduce < 10) setFactorReduce(factorReduce + 1);
    };
    
    const decrementFactorReduce = () => {
      if (factorReduce > 1) setFactorReduce(factorReduce - 1);
    };

    const incrementWidth = () => {
      if (gridWidth < 100) setGridWidth(gridWidth + 5);
    };
    
    const decrementWidth = () => {
      if (gridWidth > 40) setGridWidth(gridWidth - 5);
    };
    
    const incrementColumns = () => {
      if (numColumns < 10) setNumColumns(numColumns + 1);
    };
    
    const decrementColumns = () => {
      if (numColumns > 1) setNumColumns(numColumns - 1);
    };

    const handleAutoProcessinButton = () => {
      setAutoProcessing(!autoProcessing)
      if (progressSegmentation == false){
        handleImageSegmentation()
      }
    };


    const renderImageGrid = () => {
      return (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${numColumns}, 1fr)`, gap: '10px' }}>
              {imageGalleryItems.map((item, index) => (
                  <div key={index} style={{ cursor: 'pointer' }} onClick={() => handleImageClick(index)}>
                      <img
                          src={showImage === pBenchmarkingImage.ORIGINAL ? item.originalUrl : showImage === pBenchmarkingImage.GREEN ? item.segmentedGreenImageUrl : item.segmentedBinaryImageUrl}
                          alt={`Imagen ${index}`}
                          style={{ width: '100%' }}
                      />
                      {item.iou > -1 &&
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            height: '20px',
                            marginTop: '-5px',
                            backgroundColor: 'blue',
                            color: 'white',
                            borderRadius: '0 0 10px 10px'
                        }}>
                            <strong style={{marginRight: '5px'}}>IOU:</strong> {item.iou.toFixed(2)} {/* Asumiendo que IOU es un número, se formatea a 2 decimales */}
                        </div>
                        }
                  </div>
              ))}
          </div>
      );
  };
    
    const renderImageCarousel = () => {
        return (
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowCarousel(false)}
              style={{ maringTop: '10px', width: '100%' }}
            >
              VOLVER AL GRID DE IMÁGENES
            </Button>
            <style>
              {`
                .image-gallery-right-nav .image-gallery-svg,
                .image-gallery-left-nav .image-gallery-svg {
                  width: 20px !important; /* Ajusta el tamaño del SVG en los botones de navegación */
                }
              `}
            </style>
            <ImageGallery 
              items={imageGalleryItems.map(item => ({
                original: showImage === pBenchmarkingImage.ORIGINAL ? item.originalUrl : showImage === pBenchmarkingImage.GREEN ? item.segmentedGreenImageUrl : item.segmentedBinaryImageUrl,
              }))} 
              onSlide={(index) => setCurrentIndex(index)}
              startIndex={currentIndex}
              slideDuration={10} 
            />
          </>
        );
    };

    
    return (
      <>
      <div style={{width: '80%', margin: 'auto'}}>
          <Paper elevation={2} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', height: '40px', marginTop: '5px' }}>
              <div style={{display:'flex'}}> {/* Grupo 1 */}
                  <Button variant="contained" color="primary" component="label" id="section_benchmarking_load_gallery">
                      CARGAR GALERIA
                      <input
                          type="file"
                          webkitdirectory="true"
                          hidden
                          onChange={handleDirectorySelection}
                      />
                  </Button>


                  {imageGalleryItems.length > 0 && 
                      <Button variant="contained" color="error" onClick={handleResetImageGallery} id="section_benchmarking_clear_gallery">BORRAR GALERIA</Button>
                  }
              </div>
              <div style={{display:'flex'}}> {/* Grupo 2 */}

                  {/* <div>
                    <Button onClick={decrementFactorReduce}><ArrowCircleDownIcon /></Button>
                      <span> <strong>Reducir:</strong> 1/{factorReduce}</span>
                    <Button onClick={incremenFactorReduce}><ArrowCircleUpIcon /></Button>
                  </div> */}

                  <Button 
                      variant="contained" 
                      color="secondary" 
                      component="label"
                      disabled={imageGalleryItems.length === 0 || !statusSegmenter}
                      onClick={handleImageSegmentation}
                      style={{marginRight:'10px', minWidth:'30%'}}
                      id="section_benchmarking_process_gallery"
                  >
                      PROCESAR
                  </Button>

                  {/* <Button 
                      variant={autoProcessing ? "contained": "outlined"}
                      color={autoProcessing ? "secondary": "none"}
                      component="label"
                      disabled={imageGalleryItems.length === 0 || !statusSegmenter}
                      onClick={handleAutoProcessinButton}
                      style={{marginRight:'10px'}}
                      id="section_benchmarking_process_gallery"
                  >
                      AUTO
                  </Button> */}
              </div>
          </Paper>
          
          {(progressSegmentation.total !== progressSegmentation.processed) && (
            <Paper style={{ padding: '20px', margin: '20px' }}>
                
                <Typography variant="h6">
                  {(autoProcessing) ? "[AUTO] ": "[MANUAL] "} Progreso de Segmentación: {progressSegmentation.processed} / {progressSegmentation.total}
                </Typography>
                <LinearProgress variant="determinate" value={(progressSegmentation.processed / progressSegmentation.total) * 100} />
            </Paper>
          )}
    
          {/* Grupo 3 */}
          { (segmentationReady)  && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '1%'}}>
              <Button variant="contained" color="info" onClick={() => setShowImage(pBenchmarkingImage.ORIGINAL)} disabled={showImage===pBenchmarkingImage.ORIGINAL} id="section_benchmarking_show_original"> ORIGINAL </Button>
              <Button variant="contained" color="info" onClick={() => setShowImage(pBenchmarkingImage.GREEN)} disabled={showImage===pBenchmarkingImage.GREEN} id="section_benchmarking_show_green"> PROCESADO </Button>
              <Button variant="contained" color="info" onClick={() => setShowImage(pBenchmarkingImage.BINARY)} disabled={showImage===pBenchmarkingImage.BINARY} id="section_benchmarking_show_binary"> BINARIO </Button>

              <span style={{marginLeft: '12px', marginTop: '5px'}}> <strong>Global IOU:</strong> {globalIOU.toFixed(3)}</span>
            </div>
          )}
  
          <Paper elevation={2} style={{padding: '1%'}}>
            {imageGalleryItems.length > 0 && (
              <>
                <div style={{  width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1%' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', marginRight: '2%' }}>
                    <Button onClick={decrementWidth}><ArrowCircleDownIcon /></Button>
                    <span> <strong>Ancho:</strong> {gridWidth}%</span>
                    <Button onClick={incrementWidth}><ArrowCircleUpIcon /></Button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button onClick={decrementColumns}><ArrowCircleDownIcon /></Button>
                    <span> <strong>Columnas:</strong> {numColumns}</span>
                    <Button onClick={incrementColumns}><ArrowCircleUpIcon /></Button>
                  </div>

                </div>

                <div style={{width: `${gridWidth}%`, margin: 'auto'}}>
                    {showCarousel ? renderImageCarousel() : renderImageGrid()}
                </div>
              </>
            )}
          </Paper>
      </div>
      </>
  )
}