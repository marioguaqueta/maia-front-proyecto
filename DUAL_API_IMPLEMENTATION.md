# Dual API Implementation - HerdNet & YOLO

## Overview
This implementation adds support for calling both HerdNet and YOLO detection APIs simultaneously, displaying their results side-by-side for comparison.

### Current Approach (Configurable)
- **Full Configuration**: Both models can be configured with specific parameters
- **HerdNet**: Configurable patch size, overlap, rotation, thumbnails, and always includes plots
- **YOLO**: Configurable confidence threshold, IOU threshold, image size, and always includes annotated images
- **User-Friendly UI**: Expandable advanced settings section with clear defaults

This approach allows for precise control over both detection models while maintaining ease of use with sensible defaults.

## Changes Made

### 1. FileUpload Component (`components/FileUpload.tsx`)

#### Key Changes:
- **Full Configuration UI**: Expandable "Model Configuration Settings" section
- **Separate Settings**: HerdNet (green) and YOLO (blue) settings clearly separated
- **API Route Call**: Uploads file to Next.js API route `/api/upload` (avoiding CORS issues)
- **Progress Tracking**: Shows upload progress to the API route
- **Combined Response**: Receives combined data structure with both API results

#### HerdNet Parameters Sent:
```javascript
FormData:
  - file: ZIP file
  - patch_size: 512 (default, range: 128-2048)
  - overlap: 160 (default, range: 0-512)
  - rotation: 0 (default, 0=0°, 1=90°, 2=180°, 3=270°)
  - thumbnail_size: 256 (default, range: 64-512)
  - include_thumbnails: true (default, checkbox)
  - include_plots: true (always enabled)
```

#### YOLO Parameters Sent:
```javascript
FormData:
  - file: ZIP file
  - conf_threshold: 0.25 (default, range: 0-1)
  - iou_threshold: 0.45 (default, range: 0-1)
  - img_size: 640 (default, options: 320, 416, 512, 640, 768, 896, 1024)
  - include_annotated_images: true (always enabled)
```

#### UI Elements:
- File drag-and-drop zone
- Upload progress bar with dual model message
- Info box explaining HerdNet + YOLO processing
- Expandable "Model Configuration Settings" section with:
  - HerdNet settings (green theme)
  - YOLO settings (blue theme)
  - Help text and default values
- Clear file button

#### Flow:
```
Browser → Next.js API Route → Both Backend APIs (parallel with parameters)
```

This approach avoids CORS preflight (OPTIONS) issues by having the server-side Next.js route handle the backend API calls.

#### Response Structure:
```javascript
{
  herdnet: {
    // HerdNet API response with detections and plots
  },
  yolo: {
    annotated_images: [
      {
        image_name: "...",
        annotated_image_base64: "...",
        detections_count: 13,
        original_size: { height: 4000, width: 6000 },
        annotated_size: { height: 1280, width: 1920 }
      }
    ],
    annotated_images_count: 2
  },
  fileName: "...",
  fileSize: ...
}
```

#### UI Changes:
- Removed "Include Plots" checkbox (plots are always included)
- Added informational text: "Detection plots are always included for both models"

### 2. API Route (`app/api/upload/route.ts`)

#### Key Changes:
- **Full Parameter Support**: Extracts and forwards all configuration parameters
- **Parallel Backend Calls**: Calls both HerdNet and YOLO APIs simultaneously using `Promise.all()`
- **CORS Solution**: Server-side API calls avoid browser CORS preflight (OPTIONS) issues
- **Error Handling**: Separate error handling for each API with specific error messages
- **Combined Response**: Merges both API responses into a single structure
- **Console Logging**: Logs parameters for debugging

#### Backend API Endpoints Called:

**HerdNet**: `POST ${backendUrl}/analyze-image`
```javascript
FormData:
  - file: ZIP file
  - patch_size: number
  - overlap: number
  - rotation: number
  - thumbnail_size: number
  - include_thumbnails: boolean
  - include_plots: true (always)
```

**YOLO**: `POST ${backendUrl}/analyze-yolo`
```javascript
FormData:
  - file: ZIP file
  - conf_threshold: number (0-1)
  - iou_threshold: number (0-1)
  - img_size: number
  - include_annotated_images: true (always)
```

#### Response Structure:
```javascript
{
  message: 'Files processed successfully by both models',
  herdnet: { /* HerdNet API response */ },
  yolo: { /* YOLO API response */ },
  fileName: "...",
  fileSize: ...
}
```

### 3. ResultsTable Component (`components/ResultsTable.tsx`)

#### Key Changes:
- **Dual Data Handling**: Detects and processes both HerdNet and YOLO responses
- **Side-by-Side Display**: Shows both detection maps in a 2-column grid layout
- **Independent Zoom Controls**: Each image has its own zoom and pan controls
- **Separate Image Keys**: Uses prefixed keys (`herdnet-${imageName}`, `yolo-${imageName}`) to manage state independently

#### Data Processing:
```javascript
// Extract HerdNet data
const herdnetData = hasHerdnet ? data.herdnet : data
const detectionsArray = herdnetData.detections || []
const plotsArray = herdnetData.plots || []

// Extract YOLO data
const yoloImages = hasYolo ? (data.yolo.annotated_images || []) : []

// Create lookup maps
const plotsMap = { [image_name]: plot_base64 }
const yoloMap = { [image_name]: yolo_image_data }
```

#### UI Layout:
```
┌─────────────────────────────────────────────────┐
│     Detection Results Comparison                │
├────────────────────┬────────────────────────────┤
│  HerdNet Detection │  YOLO Detection            │
│  Map               │  Map                       │
│  [Zoom Controls]   │  [Zoom Controls]           │
│  [Image Display]   │  [Image Display]           │
│  📊 HerdNet info   │  🎯 YOLO info             │
└────────────────────┴────────────────────────────┘
```

#### Features Per Image:
- Independent zoom controls (In, Out, Reset)
- Zoom percentage display
- Scroll to zoom functionality
- Click and drag to pan
- Detection count display for YOLO
- Informational text for each model

### 3. Environment Variables Required

Make sure your `.env.local` file contains:
```
NEXT_PUBLIC_BACKEND_URL=http://your-backend-url:port
```

## How It Works

1. **File Upload**: User uploads a ZIP file containing images
2. **Next.js API Route**: 
   - Frontend sends the file to `/api/upload` Next.js route
   - Progress bar shows upload progress to the API route
3. **Parallel Backend Processing**: 
   - Next.js API route calls both HerdNet and YOLO backend APIs simultaneously
   - Uses `Promise.all()` for parallel execution
   - This server-side approach avoids CORS preflight (OPTIONS) issues
4. **Response Handling**: 
   - Both responses are combined into a single data structure
   - Combined response sent back to frontend
   - ResultsTable component receives and processes combined data
5. **Display**: 
   - Images are grouped by filename
   - For each image, both HerdNet and YOLO results are displayed side-by-side
   - Each has independent zoom/pan controls

## CORS Solution

The implementation uses Next.js API routes as a proxy to avoid CORS issues:

```
Browser (Client) → Next.js API Route (Server) → Backend APIs
```

**Why this matters:**
- Direct browser-to-backend calls trigger CORS preflight (OPTIONS requests)
- Backend APIs may not be configured to handle CORS properly
- Next.js API routes run server-side, avoiding CORS entirely
- The browser only communicates with the same-origin Next.js server

## Benefits

1. **Parallel Processing**: Both APIs run simultaneously, reducing total processing time
2. **Easy Comparison**: Side-by-side display makes it easy to compare detection results
3. **Full Feature Support**: All existing features (thumbnails, zoom, pan) work for both models
4. **Backward Compatible**: Still works with single API responses if needed
5. **Always Gets Plots**: HerdNet always returns plots for visualization

## Testing

To test this implementation:

1. Ensure both backend APIs are running and accessible
2. Upload a ZIP file with images
3. Verify both detection maps appear side-by-side
4. Test zoom and pan controls on both images independently
5. Check that detection counts and information display correctly

## API Requirements

### HerdNet API (`/analyze-image`)
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Required Parameters**:
  - `file`: ZIP file containing images
  - `include_plots`: boolean (always true)
- **Optional Parameters**:
  - `patch_size`: integer (default: 512)
  - `overlap`: integer (default: 160)
  - `rotation`: integer 0-3 (default: 0)
  - `thumbnail_size`: integer (default: 256)
  - `include_thumbnails`: boolean (default: true)
- **Response Format**:
```json
{
  "detections": [
    {
      "detection_id": 1,
      "image_name": "...",
      "species": "...",
      "confidence": 0.95,
      "position": { "x": 100, "y": 200 },
      "scores": 0.95,
      "dscores": 0.92,
      "thumbnail_base64": "..."
    }
  ],
  "plots": [
    {
      "image_name": "...",
      "plot_base64": "..."
    }
  ]
}
```

### YOLO API (`/analyze-yolo`)
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Required Parameters**:
  - `file`: ZIP file containing images
  - `include_annotated_images`: boolean (always true)
- **Optional Parameters**:
  - `conf_threshold`: float 0-1 (default: 0.25)
  - `iou_threshold`: float 0-1 (default: 0.45)
  - `img_size`: integer (default: 640)
- **Response Format**:
```json
{
  "annotated_images": [
    {
      "image_name": "...",
      "annotated_image_base64": "...",
      "detections_count": 13,
      "original_size": { "height": 4000, "width": 6000 },
      "annotated_size": { "height": 1280, "width": 1920 }
    }
  ],
  "annotated_images_count": 2
}
```

## Future Enhancements

Possible improvements:

### Short-term:
1. ✅ **Detection Parameters**: Fully implemented for both models
   - HerdNet: patch size, overlap, rotation, thumbnail configuration
   - YOLO: confidence threshold, IOU threshold, image size

### Medium-term:
3. **Model Comparison Metrics**: Show side-by-side detection statistics
4. **Toggle Views**: Allow switching between individual model views and comparison
5. **Difference Highlighting**: Highlight areas where models disagree

### Long-term:
6. **Export Comparison Reports**: Generate PDF/CSV reports with results from both models
7. **Support for More Models**: Add additional detection models to the comparison
8. **Batch Processing**: Process multiple ZIP files in sequence
9. **Model Performance Metrics**: Show processing time, accuracy metrics for each model

