import React, { useState, useEffect } from 'react';

interface RunwareSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { modelId: string; loraIds: string }) => void;
  initialModelId?: string;
  initialLoraIds?: string;
}

const RunwareSettingsModal: React.FC<RunwareSettingsModalProps> = ({ isOpen, onClose, onSave, initialModelId, initialLoraIds }) => {
  const [modelId, setModelId] = useState('');
  const [loraIds, setLoraIds] = useState('');

  useEffect(() => {
    setModelId(initialModelId || '');
    setLoraIds(initialLoraIds || '');
  }, [initialModelId, initialLoraIds]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ modelId, loraIds });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold mb-4">Runware Settings</h2>
        <div className="mb-4">
          <label htmlFor="modelId" className="block text-sm font-medium text-gray-700">Model ID</label>
          <input
            type="text"
            id="modelId"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="loraIds" className="block text-sm font-medium text-gray-700">LoRA IDs (comma-separated)</label>
          <input
            type="text"
            id="loraIds"
            value={loraIds}
            onChange={(e) => setLoraIds(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save</button>
        </div>
      </div>
    </div>
  );
};

export default RunwareSettingsModal;
