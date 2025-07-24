import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon, 
  EyeIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    name?: string;
    originalName?: string;
    filename?: string;
    url: string;
    mimeType?: string;
    size?: number;
    uploadedAt?: string;
  } | null;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({ isOpen, onClose, file }) => {
  if (!file) return null;

  const fileName = file.name || file.originalName || file.filename || 'Unknown file';
  const fileSize = file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size';
  
  // Construct full URL for relative paths
  const getFullUrl = (url: string) => {
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    return url;
  };

  const fullUrl = getFullUrl(file.url);

  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Starting download: ${fileName}`);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const getFileIcon = () => {
    if (!file.mimeType) return <DocumentIcon className="h-8 w-8" />;
    
    if (file.mimeType.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8" />;
    } else if (file.mimeType.startsWith('video/')) {
      return <FilmIcon className="h-8 w-8" />;
    } else if (file.mimeType.startsWith('audio/')) {
      return <SpeakerWaveIcon className="h-8 w-8" />;
    }
    return <DocumentIcon className="h-8 w-8" />;
  };

  const renderFilePreview = () => {
    if (!file.mimeType) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg">
          <DocumentIcon className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600">Preview not available</p>
        </div>
      );
    }

    // Images
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img 
            src={fullUrl} 
            alt={fileName}
            className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `
                <div class="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg">
                  <div class="h-16 w-16 text-gray-400 mb-4">📷</div>
                  <p class="text-gray-600">Failed to load image</p>
                </div>
              `;
            }}
          />
        </div>
      );
    }

    // PDFs
    if (file.mimeType === 'application/pdf') {
      return (
        <div className="w-full h-96">
          <iframe
            src={fullUrl}
            className="w-full h-full rounded-lg border"
            title={fileName}
          />
        </div>
      );
    }

    // Videos
    if (file.mimeType.startsWith('video/')) {
      return (
        <div className="flex justify-center">
          <video 
            controls 
            className="max-w-full max-h-96 rounded-lg shadow-lg"
            preload="metadata"
          >
            <source src={fullUrl} type={file.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Audio
    if (file.mimeType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg">
          <SpeakerWaveIcon className="h-16 w-16 text-gray-400 mb-4" />
          <audio controls className="w-full max-w-md">
            <source src={fullUrl} type={file.mimeType} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    // Text files
    if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json') {
      return (
        <div className="w-full h-96">
          <iframe
            src={fullUrl}
            className="w-full h-full rounded-lg border bg-white"
            title={fileName}
          />
        </div>
      );
    }

    // Default - no preview
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg">
        {getFileIcon()}
        <p className="text-gray-600 mt-4">Preview not available for this file type</p>
        <p className="text-sm text-gray-500">{file.mimeType}</p>
      </div>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-600">
                      {getFileIcon()}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{fileName}</h3>
                      <p className="text-sm text-gray-500">
                        {file.mimeType && `${file.mimeType} • `}{fileSize}
                        {file.uploadedAt && ` • Uploaded ${new Date(file.uploadedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fddc9a]"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Download
                    </button>
                    <button
                      onClick={onClose}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fddc9a]"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {renderFilePreview()}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default FileViewerModal;
