import { NextRequest, NextResponse } from 'next/server'

// Configure route to handle large files
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes timeout for large file processing
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.zip') && 
        file.type !== 'application/zip' && 
        file.type !== 'application/x-zip-compressed') {
      return NextResponse.json(
        { error: 'Only ZIP files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5GB)
    const maxSize = 5 * 1024 * 1024 * 1024 // 5GB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5GB' },
        { status: 400 }
      )
    }

    console.log(`Processing file: ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`)

    // Get backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    if (!backendUrl) {
      console.error('NEXT_PUBLIC_BACKEND_URL is not set')
      return NextResponse.json(
        { error: 'Backend service is not configured' },
        { status: 500 }
      )
    }

    // Extract HerdNet parameters from form data
    const patchSize = formData.get('patch_size') as string
    const overlap = formData.get('overlap') as string
    const rotation = formData.get('rotation') as string
    const thumbnailSize = formData.get('thumbnail_size') as string
    const includeThumbnails = formData.get('include_thumbnails') as string

    // Extract YOLO parameters from form data
    const confThreshold = formData.get('conf_threshold') as string
    const iouThreshold = formData.get('iou_threshold') as string
    const imgSize = formData.get('img_size') as string

    // Prepare form data for HerdNet backend
    const herdnetFormData = new FormData()
    herdnetFormData.append('file', file)
    if (patchSize) herdnetFormData.append('patch_size', patchSize)
    if (overlap) herdnetFormData.append('overlap', overlap)
    if (rotation) herdnetFormData.append('rotation', rotation)
    if (thumbnailSize) herdnetFormData.append('thumbnail_size', thumbnailSize)
    if (includeThumbnails) herdnetFormData.append('include_thumbnails', includeThumbnails)
    herdnetFormData.append('include_plots', 'true')

    console.log('HerdNet parameters:', {
      patch_size: patchSize,
      overlap,
      rotation,
      thumbnail_size: thumbnailSize,
      include_thumbnails: includeThumbnails,
      include_plots: 'true',
    })

    // Prepare headers for backend requests
    const headers: HeadersInit = {}
    
    // Add API key if configured
    const apiKey = process.env.BACKEND_API_KEY
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    // Prepare FormData for YOLO API
    const yoloFormData = new FormData()
    yoloFormData.append('file', file)
    if (confThreshold) yoloFormData.append('conf_threshold', confThreshold)
    if (iouThreshold) yoloFormData.append('iou_threshold', iouThreshold)
    if (imgSize) yoloFormData.append('img_size', imgSize)
    yoloFormData.append('include_annotated_images', 'true')

    console.log('YOLO parameters:', {
      conf_threshold: confThreshold,
      iou_threshold: iouThreshold,
      img_size: imgSize,
      include_annotated_images: 'true',
    })

    // Send file to both backend services with increased timeout for large files
    // AbortController for timeout management (10 minutes for large files)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minutes

    try {
      // Call both APIs in parallel
      const [herdnetResponse, yoloResponse] = await Promise.all([
        fetch(`${backendUrl}/analyze-image`, {
          method: 'POST',
          body: herdnetFormData,
          headers,
          signal: controller.signal,
        }),
        fetch(`${backendUrl}/analyze-yolo`, {
          method: 'POST',
          body: yoloFormData,
          headers,
          signal: controller.signal,
        })
      ])

      clearTimeout(timeoutId)

      // Check HerdNet response
      if (!herdnetResponse.ok) {
        const errorText = await herdnetResponse.text()
        console.error('HerdNet API error:', errorText)
        return NextResponse.json(
          { 
            error: `HerdNet service error: ${herdnetResponse.statusText}`,
            details: errorText 
          },
          { status: herdnetResponse.status }
        )
      }

      // Check YOLO response
      if (!yoloResponse.ok) {
        const errorText = await yoloResponse.text()
        console.error('YOLO API error:', errorText)
        return NextResponse.json(
          { 
            error: `YOLO service error: ${yoloResponse.statusText}`,
            details: errorText 
          },
          { status: yoloResponse.status }
        )
      }

      // Parse both responses
      const herdnetData = await herdnetResponse.json()
      const yoloData = await yoloResponse.json()

      // Combine responses
      return NextResponse.json({
        message: 'Files processed successfully by both models',
        herdnet: herdnetData,
        yolo: yoloData,
        fileName: file.name,
        fileSize: file.size,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Handle timeout or network errors
      if (fetchError.name === 'AbortError') {
        console.error('Backend request timeout for large file')
        return NextResponse.json(
          { 
            error: 'Upload timeout - file may be too large or backend processing took too long',
            details: 'Please try with a smaller file or contact support'
          },
          { status: 504 }
        )
      }
      
      throw fetchError
    }
  } catch (error) {
    console.error('Upload error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload file'
    let errorDetails = error instanceof Error ? error.message : 'Unknown error'
    
    if (error instanceof Error) {
      if (error.message.includes('PayloadTooLargeError') || error.message.includes('413')) {
        errorMessage = 'File is too large'
        errorDetails = 'The file exceeds the maximum allowed size of 5GB'
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to backend service'
        errorDetails = 'Please ensure the backend service is running and accessible'
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    )
  }
}
