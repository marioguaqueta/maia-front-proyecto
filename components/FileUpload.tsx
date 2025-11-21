'use client'

import { useState, useCallback, DragEvent, ChangeEvent } from 'react'
import axios from 'axios'

interface FileUploadProps {
  onUploadComplete?: (success: boolean, message: string, data?: any) => void
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  
  // HerdNet configuration parameters
  const [patchSize, setPatchSize] = useState(512)
  const [overlap, setOverlap] = useState(160)
  const [rotation, setRotation] = useState(0)
  const [thumbnailSize, setThumbnailSize] = useState(256)
  const [includeThumbnails, setIncludeThumbnails] = useState(true)
  
  // YOLO configuration parameters
  const [confThreshold, setConfThreshold] = useState(0.25)
  const [iouThreshold, setIouThreshold] = useState(0.45)
  const [imgSize, setImgSize] = useState(640)

  const validateFile = (file: File): boolean => {
    // Check if file is a zip
    const isZip = file.name.toLowerCase().endsWith('.zip') || 
                  file.type === 'application/zip' || 
                  file.type === 'application/x-zip-compressed'
    
    if (!isZip) {
      onUploadComplete?.(false, 'Please upload a ZIP file')
      return false
    }

    // Check file size (max 5GB)
    const maxSize = 5 * 1024 * 1024 * 1024 // 5GB
    if (file.size > maxSize) {
      onUploadComplete?.(false, 'File size must be less than 5GB')
      return false
    }

    return true
  }

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragOut = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const droppedFile = files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
      }
    }
  }, [])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const selectedFile = files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      onUploadComplete?.(false, 'Please select a file first')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // HerdNet parameters
      formData.append('patch_size', patchSize.toString())
      formData.append('overlap', overlap.toString())
      formData.append('rotation', rotation.toString())
      formData.append('thumbnail_size', thumbnailSize.toString())
      formData.append('include_thumbnails', includeThumbnails.toString())
      formData.append('include_plots', 'true')
      
      // YOLO parameters
      formData.append('conf_threshold', confThreshold.toString())
      formData.append('iou_threshold', iouThreshold.toString())
      formData.append('img_size', imgSize.toString())
      formData.append('include_annotated_images', 'true')

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setUploadProgress(progress)
        },
      })

      onUploadComplete?.(true, response.data.message || 'Files processed successfully by both models!', response.data)
      setFile(null)
      setUploadProgress(0)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data
        const message = errorData?.error || error.message || 'Upload failed'
        // Pass error data if available for display
        onUploadComplete?.(false, message, errorData)
      } else {
        onUploadComplete?.(false, 'An unexpected error occurred')
      }
      setFile(null)
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <svg
            className="w-16 h-16 text-slate-400 dark:text-slate-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {file ? (
            <div className="mb-4">
              <p className="text-lg font-medium text-slate-900 dark:text-white">
                {file.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formatFileSize(file.size)}
              </p>
            </div>
          ) : (
            <>
              <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Drop your ZIP file here
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                or click to browse
              </p>
            </>
          )}

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            ZIP files only (max 5GB)
          </p>
        </label>
      </div>

      {isUploading && (
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Processing with both models...
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
            Running HerdNet and YOLO detection in parallel...
          </p>
        </div>
      )}

      {file && !isUploading && (
        <div className="mt-6">
          {/* Info Box */}
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Ready to process</p>
                <p>The file will be analyzed by both <strong>HerdNet</strong> and <strong>YOLO</strong> models simultaneously.</p>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Model Configuration Settings
              </span>
              <svg
                className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${
                  showAdvancedOptions ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvancedOptions && (
              <div className="mt-4 space-y-6">
                {/* HerdNet Settings */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    HerdNet Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Patch Size
                      </label>
                      <input
                        type="number"
                        value={patchSize}
                        onChange={(e) => setPatchSize(parseInt(e.target.value) || 512)}
                        min="128"
                        max="2048"
                        step="64"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Default: 512</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Overlap
                      </label>
                      <input
                        type="number"
                        value={overlap}
                        onChange={(e) => setOverlap(parseInt(e.target.value) || 160)}
                        min="0"
                        max="512"
                        step="32"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Default: 160</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Rotation (90° steps)
                      </label>
                      <select
                        value={rotation}
                        onChange={(e) => setRotation(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="0">0° (No rotation)</option>
                        <option value="1">90° Clockwise</option>
                        <option value="2">180°</option>
                        <option value="3">270° Clockwise</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Default: 0°</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Thumbnail Size
                      </label>
                      <input
                        type="number"
                        value={thumbnailSize}
                        onChange={(e) => setThumbnailSize(parseInt(e.target.value) || 256)}
                        min="64"
                        max="512"
                        step="64"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Default: 256</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeThumbnails}
                          onChange={(e) => setIncludeThumbnails(e.target.checked)}
                          className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          Include Thumbnails
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* YOLO Settings */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    YOLO Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Confidence Threshold
                      </label>
                      <input
                        type="number"
                        value={confThreshold}
                        onChange={(e) => setConfThreshold(parseFloat(e.target.value) || 0.25)}
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Default: 0.25 (Range: 0-1)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        IOU Threshold (NMS)
                      </label>
                      <input
                        type="number"
                        value={iouThreshold}
                        onChange={(e) => setIouThreshold(parseFloat(e.target.value) || 0.45)}
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Default: 0.45 (Range: 0-1)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Image Size (Inference)
                      </label>
                      <select
                        value={imgSize}
                        onChange={(e) => setImgSize(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="320">320px</option>
                        <option value="416">416px</option>
                        <option value="512">512px</option>
                        <option value="640">640px (Default)</option>
                        <option value="768">768px</option>
                        <option value="896">896px</option>
                        <option value="1024">1024px</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Default: 640px</p>
                    </div>
                  </div>
                </div>

                {/* Information */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong>Note:</strong> These settings control how each detection model processes
                    your images. Adjust them based on your image characteristics and detection requirements.
                    Both models will always generate annotated images for comparison.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={`flex-1 py-3 px-6 rounded-lg font-medium text-white transition-colors ${
            !file || isUploading
              ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>

        {file && !isUploading && (
          <button
            onClick={() => setFile(null)}
            className="px-6 py-3 rounded-lg font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

