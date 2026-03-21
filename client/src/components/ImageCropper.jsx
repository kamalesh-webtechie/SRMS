import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import getCroppedImg from './cropImage';

const ImageCropper = ({ imageSrc, onCancel, onCropComplete }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onRotationChange = (rotation) => {
        setRotation(rotation);
    };

    const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation
            );
            onCropComplete(croppedImageBlob);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg flex flex-col h-[600px] overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Edit Photo</h3>
                    <button onClick={onCancel} className="text-gray-500 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="relative flex-1 bg-gray-100 rounded-lg overflow-hidden cursor-move">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1} // Square
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onRotationChange={onRotationChange}
                        onCropComplete={onCropCompleteCallback}
                        classes={{ containerClassName: "h-full w-full" }}
                    />
                </div>

                <div className="mt-6 space-y-4">
                    {/* Controls */}
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-600 w-16">Zoom</span>
                        <ZoomOut size={16} className="text-gray-400" />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <ZoomIn size={16} className="text-gray-400" />
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-600 w-16">Rotate</span>
                        <input
                            type="range"
                            value={rotation}
                            min={0}
                            max={360}
                            step={1}
                            aria-labelledby="Rotation"
                            onChange={(e) => setRotation(e.target.value)}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <RotateCw size={16} className="text-gray-400" />
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-secondary transition-colors shadow-lg"
                    >
                        Save & Upload
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
