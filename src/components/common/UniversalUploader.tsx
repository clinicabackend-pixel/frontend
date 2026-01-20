import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faFile, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import Button from './Button';

interface UploadResponse {
    url: string;
    type: string;
    format: string;
}

interface UniversalUploaderProps {
    onUploadComplete?: (data: UploadResponse) => void;
    className?: string;
}

const UniversalUploader: React.FC<UniversalUploaderProps> = ({ onUploadComplete, className }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [assetData, setAssetData] = useState<UploadResponse | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
            setUploadStatus('idle');
            setErrorMessage('');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploadStatus('uploading');
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Utilizar la instancia api configurada con axios para incluir el token automáticamente
            // La baseURL ya incluye '/api', así que llamamos a '/v1/assets/upload'
            const response = await api.post<UploadResponse>('/v1/assets/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Axios maneja esto, pero es explícito
                },
            });

            const data = response.data;
            setAssetData(data);
            setUploadStatus('success');
            if (onUploadComplete) {
                onUploadComplete(data);
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            setUploadStatus('error');
            const msg = error.response?.data?.error || error.message || 'Error desconocido';
            setErrorMessage(msg);
        }
    };

    return (
        <div className={`p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors ${className || ''}`}>
            <div className="flex flex-col items-center justify-center space-y-4">

                {uploadStatus === 'idle' && (
                    <>
                        <div className="text-gray-400">
                            <FontAwesomeIcon icon={faCloudUploadAlt} size="3x" />
                        </div>
                        <div className="text-center">
                            <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                                <span>Selecciona un archivo</span>
                                <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    onChange={handleFileChange}
                                />
                            </label>
                            <p className="text-xs text-gray-500 mt-1">Imágenes, PDF, DOCX, Video (Max 10MB)</p>
                        </div>
                    </>
                )}

                {selectedFile && uploadStatus === 'idle' && (
                    <div className="flex items-center space-x-2 text-sm text-gray-700 bg-white p-2 rounded border">
                        <FontAwesomeIcon icon={faFile} />
                        <span className="truncate max-w-xs">{selectedFile.name}</span>
                        <Button
                            variant="primary"
                            onClick={handleUpload}
                            className="ml-4 text-xs py-1 px-3"
                        >
                            Subir
                        </Button>
                    </div>
                )}

                {uploadStatus === 'uploading' && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <p className="text-sm text-gray-600">Subiendo archivo...</p>
                    </div>
                )}

                {uploadStatus === 'success' && assetData && (
                    <div className="w-full">
                        <div className="flex items-center justify-center text-green-600 mb-2">
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                            <span className="font-bold">¡Carga exitosa!</span>
                        </div>
                        <div className="bg-white p-3 rounded border text-sm overflow-hidden">
                            <p><strong>Tipo:</strong> {assetData.type}/{assetData.format}</p>
                            <p className="truncate"><strong>URL:</strong> <a href={assetData.url} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800">{assetData.url}</a></p>
                        </div>
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => { setSelectedFile(null); setUploadStatus('idle'); }}
                                className="text-sm text-gray-500 hover:text-gray-700 underline"
                            >
                                Subir otro archivo
                            </button>
                        </div>
                    </div>
                )}

                {uploadStatus === 'error' && (
                    <div className="flex flex-col items-center text-red-600">
                        <FontAwesomeIcon icon={faExclamationCircle} size="2x" className="mb-2" />
                        <p className="font-bold">Error al subir</p>
                        <p className="text-sm">{errorMessage}</p>
                        <button
                            onClick={() => { setSelectedFile(null); setUploadStatus('idle'); }}
                            className="mt-2 text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UniversalUploader;
