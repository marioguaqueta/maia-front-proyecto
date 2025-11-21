# Animal Detection Frontend

A modern Next.js application for uploading ZIP files containing images to an animal detection backend service.

## Features

- 📁 Drag-and-drop file upload
- ✅ File validation (ZIP files only, max 5GB)
- 📊 Upload progress indicator
- ⏱️ Extended timeout support for large file processing (up to 10 minutes)
- 🐾 Animal detection results with thumbnails
- 📸 Detection results grouped by image
- 📈 Species distribution statistics
- 🎯 Confidence scores and position coordinates
- 🗺️ Backend-generated detection maps (when plots enabled)
- 📍 Interactive SVG detection visualization (fallback)
- 🔍 Zoom and pan controls for detailed image inspection
- 🖱️ Mouse wheel zoom and drag-to-pan functionality
- 🎨 Modern, responsive UI with Tailwind CSS
- 🌓 Dark mode support
- 🔒 Secure file handling
- ⚙️ Configurable backend URL via environment variables

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Backend service running and accessible

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your backend URL:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
BACKEND_API_KEY=your-api-key-here
```

**Environment Variables:**
- `NEXT_PUBLIC_BACKEND_URL`: The URL of your backend service (required)
- `BACKEND_API_KEY`: Optional API key for backend authentication

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
front/
├── app/
│   ├── api/
│   │   └── upload/
│   │       └── route.ts      # API route for file upload
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── components/
│   ├── FileUpload.tsx         # File upload component
│   └── ResultsTable.tsx       # Detection results display component
├── .env.local.example         # Example environment variables
├── next.config.js             # Next.js configuration (configured for large files)
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## Usage

1. Open the application in your browser
2. Drag and drop a ZIP file containing images into the upload area, or click to browse
3. The file will be validated automatically (must be a ZIP file, max 5GB)
4. **Configure detection settings** (optional):
   - Click "Detection Settings" to expand the configuration panel
   - Adjust parameters as needed (see Detection Configuration below)
5. Click "Upload File" to send it to the backend for analysis
6. Wait for the processing to complete (large files may take several minutes)
7. View detection results:
   - Summary statistics (total images, detections, species distribution)
   - Results grouped by image
   - Thumbnails for each detected animal
   - Species identification with confidence scores
   - Position coordinates for each detection
   - **Detection map visualization:**
     - If "Include Plots" was enabled: View backend-generated annotated images
     - Otherwise: Use interactive SVG viewer or upload original images for overlay
   - **Zoom and Pan controls:**
     - Use zoom buttons (+/-) or mouse wheel to zoom in/out (50%-500%)
     - Click and drag to pan around the zoomed image
     - Reset button to return to original view

## Zoom and Pan Controls

The detection map viewer includes powerful zoom and pan functionality for detailed inspection:

### Controls

- **🔍 Zoom In** - Click the zoom in button or scroll up to increase magnification
- **🔍 Zoom Out** - Click the zoom out button or scroll down to decrease magnification
- **🔄 Reset** - Click the reset button to return to original view (100% zoom, centered)
- **🖱️ Pan** - Click and drag anywhere on the image to move around when zoomed in

### Features

- **Zoom Range:** 50% to 500% (0.5x to 5x magnification)
- **Smooth Transitions:** Animated zoom and pan for comfortable viewing
- **Cursor Feedback:** Cursor changes to "grab" when you can drag, "grabbing" while dragging
- **Per-Image State:** Each image has independent zoom/pan settings
- **Real-time Display:** Current zoom level shown as percentage

### Usage Tips

- Use **mouse wheel** for quick, precise zooming at cursor position
- **Drag** to explore different areas of large images
- **Reset** between images to avoid confusion
- Works with both backend plots and SVG visualizations

## Detection Configuration

The application allows you to customize detection parameters before uploading. Click "Detection Settings" to access the following options:

### Boolean Options (Checkboxes)

- **Include Thumbnails** (default: `true`)
  - When enabled, the backend will generate thumbnail images for each detection
  - These thumbnails are displayed in the results table

- **Include Plots** (default: `false`)
  - When enabled, the backend will generate detection map images with markers
  - These images show the original photo with all detected animals marked
  - The plots are displayed automatically in the results (no manual image upload needed)
  - Useful for visual verification and presentation

### Numeric Parameters

- **Patch Size** (default: `512`)
  - Size of image patches used for detection processing
  - Range: 128 - 2048 (step: 64)
  - Larger values may improve detection but increase processing time
  - Adjust based on your image resolution and animal size

- **Overlap** (default: `160`)
  - Overlap between adjacent patches during stitching
  - Range: 0 - 512 (step: 32)
  - Higher overlap improves edge detection but increases processing time
  - Recommended to be 20-30% of patch size

- **Rotation** (default: `0`)
  - Number of 90-degree rotations to apply to images
  - Options:
    - `0`: No rotation
    - `1`: 90° clockwise
    - `2`: 180°
    - `3`: 270° clockwise
  - Useful for correcting camera orientation

- **Thumbnail Size** (default: `256`)
  - Size of generated thumbnail images in pixels
  - Range: 64 - 512 (step: 64)
  - Larger thumbnails provide more detail but increase response size

### Configuration Tips

- **For high-resolution images (>4000px)**: Increase patch size to 1024 or higher
- **For small animals**: Use smaller patch sizes (256-512) and higher overlap
- **For large datasets**: Disable thumbnails and plots to reduce processing time
- **For rotated images**: Use the rotation parameter instead of pre-processing
- **For presentations/reports**: Enable plots to get beautiful annotated images automatically
- **For quick analysis**: Keep plots disabled and use the interactive SVG viewer instead

## API Endpoint

The application sends files to your backend service at:

```
POST {NEXT_PUBLIC_BACKEND_URL}/analyze-image
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: 
  - `file`: ZIP file containing images (required)
  - `patch_size`: Patch size for stitching (optional, default: 512)
  - `overlap`: Overlap for stitching (optional, default: 160)
  - `rotation`: Number of 90-degree rotations (optional, default: 0)
  - `thumbnail_size`: Size for thumbnails (optional, default: 256)
  - `include_thumbnails`: Whether to include thumbnail data (optional, default: true)
  - `include_plots`: Whether to include plot data (optional, default: false)
- Optional Header: `Authorization: Bearer {BACKEND_API_KEY}`

**Expected Response:**
```json
{
  "message": "File uploaded successfully",
  "data": {
    "detections": [
      {
        "images": "example.jpg",
        "species": "waterbuck",
        "x": 1305,
        "y": 1193,
        "scores": 0.8224,
        "dscores": 0.1869,
        "labels": 6,
        "count_1": 0,
        "count_2": 0,
        "count_3": 0,
        "count_4": 0,
        "count_5": 0,
        "count_6": 10
      },
      {
        "detection_id": 99,
        "image_name": "example.jpg",
        "species": "topi",
        "confidence": 0.9975,
        "position": { "x": 3589, "y": 2180 },
        "scores": 0.8224,
        "dscores": 0.1869,
        "labels": 6,
        "thumbnail_base64": "base64_encoded_thumbnail_data",
        "count_1": 0,
        "count_2": 0,
        "count_3": 0,
        "count_4": 0,
        "count_5": 0,
        "count_6": 10
      }
      // ... more detections
    ],
    "plots": [
      {
        "image_name": "example.jpg",
        "plot_base64": "base64_encoded_image_with_detection_markers"
      }
      // ... more plots (one per image, when include_plots=true)
    ]
  },
  "fileName": "example.zip",
  "fileSize": 7535367
}
```

**Note:** The backend response structure:
- **Detections** supports two formats:
  - Basic format: `images`, `x`, `y` (without thumbnails)
  - Extended format: `detection_id`, `image_name`, `position`, `confidence`, `thumbnail_base64`
- **Plots** array is included when `include_plots=true`:
  - Each plot contains the original image with detection markers overlaid
  - Displayed automatically in the "Detection Position Map" section

The frontend will automatically:
- Handle both response formats seamlessly
- Group detections by image name (`image_name` or `images` field)
- Display thumbnails when available
- Calculate summary statistics (total images, detections per species, etc.)
- Show confidence scores (from `confidence` or `scores` field)
- Display position coordinates (from `position` object or separate `x`, `y` fields)

## Customization

### Change File Size Limit

Edit `components/FileUpload.tsx` and `app/api/upload/route.ts`:

```typescript
const maxSize = 5 * 1024 * 1024 * 1024 // Current limit: 5GB
```

Note: Also update the timeout values in `app/api/upload/route.ts` if processing takes longer.

### Change Accepted File Types

Edit `components/FileUpload.tsx` and `app/api/upload/route.ts` to modify file type validation.

### Customize Styling

The application uses Tailwind CSS. Modify `tailwind.config.js` to change colors, themes, etc.

## Troubleshooting

### Backend Connection Error

- Ensure `NEXT_PUBLIC_BACKEND_URL` is correctly set in `.env.local`
- Verify your backend service is running
- Check for CORS issues on the backend

### File Upload Fails

- Check file size (must be under 5GB)
- Ensure file is a valid ZIP file
- Check browser console for detailed error messages
- For very large files (>1GB), ensure stable internet connection and allow sufficient time for upload

### Large File Upload Times Out

- The system allows up to 10 minutes for upload and processing
- Consider splitting very large ZIP files into smaller batches
- Ensure backend service has sufficient resources to process large files

## Technologies Used

- [Next.js 14](https://nextjs.org/) - React framework
- [React 18](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Axios](https://axios-http.com/) - HTTP client

## License

MIT

