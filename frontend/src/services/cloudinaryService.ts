import api from './api';

export interface CloudinaryUploadResponse {
  status: string;
  data: {
    url: string;
    publicId: string;
    format: string;
    width: number;
    height: number;
    size: number;
    originalName: string;
    folder: string;
    resourceType: string;
    createdAt: string;
  };
}

export interface CloudinaryImageDetails {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  size: number;
  createdAt: string;
  colors?: Array<[string, number]>;
  predominantColor?: Array<[string, number]>;
  metadata?: Record<string, any>;
}

class CloudinaryService {
  private baseURL = '/cloudinary';

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await api.get(`${this.baseURL}/test`);
      return response.data.status === 'success';
    } catch (error) {
      console.error('Cloudinary connection test failed:', error);
      return false;
    }
  }

  // Upload single image
  async uploadImage(file: File): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post(`${this.baseURL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Upload board header
  async uploadBoardHeader(file: File): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post(`${this.baseURL}/upload/board-header`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Upload to specific folder
  async uploadToFolder(file: File, folder: string): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const response = await api.post(`${this.baseURL}/upload/folder`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Upload multiple images
  async uploadMultipleImages(files: File[]): Promise<{
    status: string;
    results: number;
    data: CloudinaryUploadResponse['data'][];
    errors?: Array<{ filename: string; error: string }>;
  }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post(`${this.baseURL}/upload/multiple`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Upload base64 image
  async uploadBase64(
    base64Data: string,
    filename?: string,
    folder?: string
  ): Promise<CloudinaryUploadResponse> {
    const endpoint = folder ? `${this.baseURL}/upload/buffer/folder` : `${this.baseURL}/upload/buffer`;
    const payload: any = {
      image: base64Data,
      filename,
    };

    if (folder) {
      payload.folder = folder;
    }

    const response = await api.post(endpoint, payload);
    return response.data;
  }

  // Get image details
  async getImageDetails(publicId: string): Promise<CloudinaryImageDetails> {
    const encodedPublicId = encodeURIComponent(publicId);
    const response = await api.get(`${this.baseURL}/${encodedPublicId}`);
    return response.data.data;
  }

  // Delete image
  async deleteImage(publicId: string): Promise<{ status: string; message: string }> {
    const encodedPublicId = encodeURIComponent(publicId);
    const response = await api.delete(`${this.baseURL}/${encodedPublicId}`);
    return response.data;
  }

  // Get transformed image URL
  async getTransformedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
      effect?: string;
      radius?: number | string;
    }
  ): Promise<{ url: string; publicId: string; transformations: any[] }> {
    const encodedPublicId = encodeURIComponent(publicId);
    const queryParams = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(
      `${this.baseURL}/${encodedPublicId}/transform?${queryParams.toString()}`
    );
    return response.data.data;
  }

  // Get optimized image URL
  async getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
    }
  ): Promise<{ url: string; publicId: string; options: any }> {
    const encodedPublicId = encodeURIComponent(publicId);
    const queryParams = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(
      `${this.baseURL}/${encodedPublicId}/optimize?${queryParams.toString()}`
    );
    return response.data.data;
  }

  // Helper to extract public ID from Cloudinary URL
  extractPublicId(url: string): string | null {
    const match = url.match(/\/v\d+\/(.+)\.\w+$/);
    return match ? match[1] : null;
  }

  // Helper to validate image file
  validateImageFile(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
      };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit.`,
      };
    }

    return { valid: true };
  }
}

export default new CloudinaryService();
