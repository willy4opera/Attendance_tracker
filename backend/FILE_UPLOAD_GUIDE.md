# File Upload System Documentation

## Overview
The file upload system allows users to upload, manage, and download files. It supports various file types and includes features like file validation, size limits, and proper storage organization.

## Features Implemented

### ✅ Core Features
- Single and multiple file uploads
- File type validation
- Size limits (10MB default)
- Organized storage by file type (avatars, documents, attachments)
- File download with proper headers
- User avatar/profile picture upload
- Session-specific file attachments

### ✅ Security Features
- Authentication required for all operations
- File type validation based on field name
- Sanitized filenames
- Permission checks for file deletion
- Path traversal protection

## API Endpoints

### 1. Upload Single File
**Endpoint:** `POST /api/v1/files/upload/single`

**Form Data:**
- `document`: File to upload
- `description` (optional): File description
- `sessionId` (optional): Link to a session

**Example:**
```bash
curl -X POST http://localhost:5000/api/v1/files/upload/single \
  -H "Authorization: Bearer <token>" \
  -F "document=@document.pdf" \
  -F "description=Meeting notes" \
  -F "sessionId=<session-id>"
```

### 2. Upload Multiple Files
**Endpoint:** `POST /api/v1/files/upload`

**Form Data:**
- `attachments[]`: Multiple files (max 5)
- `description` (optional): Description for all files
- `sessionId` (optional): Link to a session

### 3. Update User Avatar
**Endpoint:** `POST /api/v1/files/avatar`

**Form Data:**
- `avatar`: Image file (jpg, jpeg, png, gif)

### 4. Get All Attachments
**Endpoint:** `GET /api/v1/files`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sessionId`: Filter by session
- `uploadedBy`: Filter by uploader

### 5. Get Attachment Details
**Endpoint:** `GET /api/v1/files/:id`

### 6. Download File
**Endpoint:** `GET /api/v1/files/:id/download`

### 7. Get Session Files
**Endpoint:** `GET /api/v1/files/session/:sessionId`

### 8. Delete Attachment
**Endpoint:** `DELETE /api/v1/files/:id`

**Note:** Only the uploader or admin can delete files

## File Type Restrictions

### By Field Type:
- **avatar/profilePicture**: jpg, jpeg, png, gif
- **document**: pdf, doc, docx, xls, xlsx, ppt, pptx, txt
- **attachment**: jpg, jpeg, png, gif, pdf, doc, docx, xls, xlsx, ppt, pptx, txt, zip, rar

## Storage Structure

```
uploads/
├── avatars/       # User profile pictures
├── documents/     # Document uploads
└── attachments/   # General attachments
```

## Response Format

### Upload Response:
```json
{
  "status": "success",
  "data": {
    "attachment": {
      "id": "uuid",
      "filename": "sanitized-filename-timestamp.ext",
      "originalName": "original.ext",
      "mimeType": "application/pdf",
      "size": 1024,
      "path": "/full/path/to/file",
      "url": "/uploads/documents/filename.ext",
      "uploadedBy": "user-id",
      "sessionId": "session-id",
      "description": "File description"
    }
  }
}
```

## Frontend Implementation

### File Upload Component Example:
```javascript
const FileUpload = () => {
  const [files, setFiles] = useState([]);
  
  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });
    formData.append('description', 'Session materials');
    
    const response = await fetch('/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    console.log('Uploaded files:', data);
  };
  
  return (
    <div>
      <input 
        type="file" 
        multiple 
        onChange={(e) => setFiles(Array.from(e.target.files))}
      />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
};
```

### Display Uploaded Files:
```javascript
const FileList = ({ sessionId }) => {
  const [files, setFiles] = useState([]);
  
  useEffect(() => {
    fetchSessionFiles();
  }, [sessionId]);
  
  const fetchSessionFiles = async () => {
    const response = await fetch(`/api/v1/files/session/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setFiles(data.data.attachments);
  };
  
  return (
    <ul>
      {files.map(file => (
        <li key={file.id}>
          <a href={`/api/v1/files/${file.id}/download`}>
            {file.originalName}
          </a>
          <span> ({(file.size / 1024).toFixed(2)} KB)</span>
        </li>
      ))}
    </ul>
  );
};
```

## Error Handling

Common error responses:
- `400`: No file uploaded or invalid file type
- `401`: Unauthorized (missing/invalid token)
- `403`: Permission denied (for deletion)
- `404`: File not found
- `413`: File too large (exceeds 10MB)

## Configuration

File upload limits can be configured in `src/config/multer.config.js`:
- Maximum file size: 10MB
- Maximum files per request: 5
- Allowed file types by field name

## Security Considerations

1. **File Type Validation**: Only allowed file types are accepted
2. **Size Limits**: Prevents large file uploads (DoS protection)
3. **Filename Sanitization**: Special characters removed from filenames
4. **Path Security**: Files served through controlled endpoints
5. **Permission Checks**: Users can only delete their own files

## Next Steps

1. Add image resizing for avatars
2. Implement virus scanning for uploads
3. Add cloud storage support (S3, Cloudinary)
4. Create thumbnail generation for images
5. Add file compression for documents
6. Implement file versioning
