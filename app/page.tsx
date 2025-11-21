'use client'

import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import ResultsTable from '@/components/ResultsTable'

export default function Home() {
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info' | null
    message: string
  }>({ type: null, message: '' })
  const [responseData, setResponseData] = useState<any>(null)

  const handleUploadComplete = (success: boolean, message: string, data?: any) => {
    setUploadStatus({
      type: success ? 'success' : 'error',
      message,
    })

    // Always set response data if available (even on partial failures)
    if (data) {
      setResponseData(data)
    } else if (!success) {
      // Clear data on complete failure
      setResponseData(null)
    }

    // Auto-clear status after 5 seconds (but keep the data)
    setTimeout(() => {
      setUploadStatus({ type: null, message: '' })
    }, 5000)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className={`mx-auto ${responseData ? 'max-w-7xl' : 'max-w-3xl'} transition-all duration-300`}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Animal Detection System
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Upload ZIP files containing images for automatic animal detection and species identification
          </p>
        </div>

        {uploadStatus.type && (
          <div
            className={`mb-6 p-4 rounded-lg shadow-md ${
              uploadStatus.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : uploadStatus.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                uploadStatus.type === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : uploadStatus.type === 'error'
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-blue-800 dark:text-blue-200'
              }`}
            >
              {uploadStatus.message}
            </p>
          </div>
        )}

        <FileUpload onUploadComplete={handleUploadComplete} />

        {responseData && <ResultsTable data={responseData} />}

        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            How It Works
          </h2>
          <ul className="space-y-2 text-slate-600 dark:text-slate-300">
            <li className="flex items-start">
              <span className="inline-block w-6 h-6 bg-primary-500 text-white rounded-full text-center mr-3 flex-shrink-0">
                1
              </span>
              <span>Select a ZIP file containing images or drag and drop it into the upload area</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-6 h-6 bg-primary-500 text-white rounded-full text-center mr-3 flex-shrink-0">
                2
              </span>
              <span>The file will be automatically validated (must be a ZIP file containing images)</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-6 h-6 bg-primary-500 text-white rounded-full text-center mr-3 flex-shrink-0">
                3
              </span>
              <span>Click "Upload File" to send it to the backend for analysis</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-6 h-6 bg-primary-500 text-white rounded-full text-center mr-3 flex-shrink-0">
                4
              </span>
              <span>View detection results grouped by image with thumbnails for each detected animal</span>
            </li>
          </ul>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Large files (over 100MB) may take several minutes to upload and process. 
              The system will analyze each image, detect animals, and provide detailed information including species, 
              confidence scores, and position coordinates. Please be patient and do not close the browser window during upload. Maximum file size is 5GB.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

