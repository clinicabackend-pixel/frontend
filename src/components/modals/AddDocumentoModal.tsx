import React, { useState } from 'react';
import Modal from '../common/Modal';
import documentoService, { type DocumentoCreateRequest } from '../../services/documentoService';

interface AddDocumentoModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCasoId: string;
    onSuccess: () => void;
}

const AddDocumentoModal: React.FC<AddDocumentoModalProps> = ({ isOpen, onClose, currentCasoId, onSuccess }) => {
    const [formData, setFormData] = useState<Omit<DocumentoCreateRequest, 'numCaso'>>({
        titulo: '',
        observacion: '',
        folioIni: undefined,
        folioFin: undefined
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.titulo) {
            setError('El título es obligatorio');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await documentoService.create({
                ...formData,
                numCaso: currentCasoId
            });
            onSuccess();
            onClose();
            setFormData({ titulo: '', observacion: '', folioIni: undefined, folioFin: undefined });
        } catch (err) {
            console.error(err);
            setError('Error al registrar el folio');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registro de Folio">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                    <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                        value={formData.titulo}
                        onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                        placeholder="Ej: Acta de Matrimonio"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Folio Inicio</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                            value={formData.folioIni || ''}
                            onChange={e => setFormData({ ...formData, folioIni: parseInt(e.target.value) || undefined })}
                            placeholder="Ej: 1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Folio Fin</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                            value={formData.folioFin || ''}
                            onChange={e => setFormData({ ...formData, folioFin: parseInt(e.target.value) || undefined })}
                            placeholder="Ej: 5"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 h-24 resize-none"
                        value={formData.observacion}
                        onChange={e => setFormData({ ...formData, observacion: e.target.value })}
                        placeholder="Detalles adicionales..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Guardando...' : 'Guardar Folio'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddDocumentoModal;
