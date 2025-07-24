import api from './api';

export interface FileUploadResponse {
  status: string;
  data: {
    attachment?: {
      id: number;
      filename: string;
      originalName: string;
      url: string;
      path: string;
      size: number;
      mimeType: string;
    };
    attachments?: Array<{
      id: number;
      filename: string;
      originalName: string;
      url: string;
      path: string;
      size: number;
      mimeType: string;
    }>;
    profilePicture?: string;
  };
}

class FileService {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('attachments', file);
    
    console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    try {
      const response = await api.post<FileUploadResponse>('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', response.data);
      
      // Handle response for multiple files endpoint
      if (response.data.status === 'success' && response.data.data.attachments && response.data.data.attachments.length > 0) {
        return response.data.data.attachments[0].url;
      }
      
      throw new Error('Failed to get image URL from response');
    } catch (error: any) {
      console.error('Image upload error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
  }

  // Alternative method for avatar uploads
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    console.log('Uploading avatar:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    try {
      const response = await api.post<FileUploadResponse>('/files/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Avatar upload response:', response.data);
      
      if (response.data.status === 'success' && response.data.data.profilePicture) {
        return response.data.data.profilePicture;
      }
      
      throw new Error('Failed to get image URL from response');
    } catch (error: any) {
      console.error('Avatar upload error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
  }

  // Method to upload a single document/file
  async uploadDocument(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('document', file);
    
    console.log('Uploading document:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    try {
      const response = await api.post<FileUploadResponse>('/files/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Document upload response:', response.data);
      
      if (response.data.status === 'success' && response.data.data.attachment) {
        return response.data.data.attachment.url;
      }
      
      throw new Error('Failed to get document URL from response');
    } catch (error: any) {
      console.error('Document upload error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
  }
}

export const fileService = new FileService();
export default fileService;
