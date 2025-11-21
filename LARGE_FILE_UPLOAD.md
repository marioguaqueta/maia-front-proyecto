# Large File Upload Configuration Guide

This document explains how the application handles large file uploads (up to 5GB).

## Configuration Overview

### 1. Frontend File Validation (`components/FileUpload.tsx`)

```typescript
const maxSize = 5 * 1024 * 1024 * 1024 // 5GB
```

- Client-side validation prevents files larger than 5GB from being uploaded
- Immediate feedback to users without waiting for server rejection

### 2. API Route Configuration (`app/api/upload/route.ts`)

```typescript
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes timeout
export const dynamic = 'force-dynamic'
```

**Key Features:**
- **Runtime:** Uses Node.js runtime for better large file handling
- **Max Duration:** 5 minutes (300 seconds) for the Next.js route execution
- **Dynamic Rendering:** Forces dynamic rendering to handle each request uniquely

### 3. Backend Request Timeout

```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minutes
```

- 10-minute timeout for backend processing
- Allows sufficient time for large file upload and analysis
- Graceful timeout handling with specific error messages

### 4. Next.js Configuration (`next.config.js`)

```javascript
serverRuntimeConfig: {
  maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
}
```

## Upload Process Flow

```
User Selects File (up to 5GB)
    ↓
Client-side Validation
    ↓
Upload to Next.js API Route (/api/upload)
    ↓ (with progress tracking)
API Route receives file
    ↓
Server-side Validation
    ↓
Forward to Backend (/analyze-image)
    ↓ (10-minute timeout)
Backend Processing
    ↓
Return Results to Client
    ↓
Display in Results Table
```

## Timeout Configuration

| Stage | Timeout | Purpose |
|-------|---------|---------|
| Next.js Route | 5 minutes | Maximum execution time for API route |
| Backend Request | 10 minutes | Maximum time for backend to process file |
| Total Maximum | ~15 minutes | Combined time for complete operation |

## Error Handling

### Client-Side Errors
- File too large (>5GB)
- Invalid file type (not ZIP)
- Network connection issues

### Server-Side Errors
- Backend connection timeout
- Backend service errors
- File processing failures

### Timeout Errors
- 504 Gateway Timeout: Backend took longer than 10 minutes
- Specific error messages guide users on next steps

## Best Practices for Large Files

### For Developers

1. **Monitor Backend Performance**
   - Ensure backend can handle large ZIP files
   - Consider implementing streaming upload/processing
   - Monitor memory usage during processing

2. **Adjust Timeouts if Needed**
   ```typescript
   // In app/api/upload/route.ts
   export const maxDuration = 300 // Increase if needed (max depends on hosting)
   
   // Backend timeout
   setTimeout(() => controller.abort(), 600000) // Increase if needed
   ```

3. **Consider Chunked Upload**
   - For files >5GB, implement chunked upload
   - Upload file in smaller pieces
   - Reassemble on backend

### For Users

1. **Stable Internet Connection**
   - Large files require stable, fast connection
   - Avoid mobile/unstable networks for very large uploads

2. **Be Patient**
   - 1GB file: ~5-10 minutes
   - 5GB file: ~20-30 minutes (depending on connection and backend)

3. **Browser Recommendations**
   - Use modern browsers (Chrome, Firefox, Edge)
   - Don't close browser during upload
   - Don't put computer to sleep during upload

## Troubleshooting

### Upload Fails Immediately
- Check file size is under 5GB
- Verify file is a valid ZIP
- Check browser console for errors

### Upload Times Out
- File may be too large for your connection
- Backend may need more processing time
- Consider splitting into smaller ZIP files

### Backend Connection Error
- Ensure `NEXT_PUBLIC_BACKEND_URL` is correct in `.env.local`
- Verify backend service is running
- Check network connectivity to backend

### Memory Issues
- Large files may cause memory issues
- Restart browser if performance degrades
- Consider processing smaller batches

## Deployment Considerations

### Vercel (Default Next.js Hosting)
- Free tier: Max execution time is 10 seconds (not suitable for large files)
- Pro tier: Max execution time is 60 seconds
- **Recommended:** Use hobby or pro tier with serverless functions

### Alternative Hosting
- **Node.js Server:** No artificial timeout limits, better for large files
- **AWS Lambda:** Max 15 minutes (sufficient for most cases)
- **Google Cloud Functions:** Max 9 minutes (gen 1) or 60 minutes (gen 2)

### Recommended Solution for Production
For files >100MB, consider:
1. Direct upload to cloud storage (S3, GCS)
2. Background processing with job queue
3. WebSocket for real-time progress updates

## Performance Optimization

### Current Implementation
- Stream file from client to Next.js API
- Forward to backend immediately
- Track upload progress on client

### Potential Improvements
1. **Direct Backend Upload**
   - Get signed URL from Next.js API
   - Upload directly to backend/storage
   - Reduces Next.js server load

2. **Chunked Upload**
   - Split large files into chunks
   - Upload chunks in parallel
   - Better progress tracking

3. **WebSocket Progress**
   - Real-time processing updates
   - Better user experience for long operations

## Security Considerations

1. **File Size Validation**
   - Client-side (immediate feedback)
   - Server-side (security enforcement)

2. **File Type Validation**
   - Extension check
   - MIME type verification
   - Backend should also validate

3. **Rate Limiting**
   - Consider implementing rate limits
   - Prevent abuse of large file uploads

4. **Authentication**
   - BACKEND_API_KEY for API authentication
   - Consider user-level authentication

## Monitoring

### Recommended Metrics
- Upload success rate
- Average upload time by file size
- Timeout frequency
- Backend processing time
- Error rates by type

### Logging
- File size and name logged in API route
- Errors logged with details
- Consider adding timestamps for performance analysis

