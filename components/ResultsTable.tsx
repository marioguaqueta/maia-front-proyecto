'use client'

import { useMemo, useState } from 'react'

interface ResultsTableProps {
  data: any
}

interface Detection {
  detection_id?: number
  image_name?: string
  images?: string  // Alternative field name
  species: string
  confidence?: number
  position?: { x: number; y: number }
  x?: number  // Alternative field format
  y?: number  // Alternative field format
  scores: number
  dscores: number
  labels: number
  thumbnail_base64?: string
  count_1?: number
  count_2?: number
  count_3?: number
  count_4?: number
  count_5?: number
  count_6?: number
}

interface GroupedDetection {
  imageName: string
  detections: Detection[]
  totalDetections: number
  speciesCounts: { [key: string]: number }
}

interface Plot {
  image_name: string
  plot_base64: string
}

export default function ResultsTable({ data }: ResultsTableProps) {
  if (!data) return null

  // State for image viewer
  const [selectedImageForViewer, setSelectedImageForViewer] = useState<string | null>(null)
  // State for uploaded images (user can optionally upload original images)
  const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string }>({})
  
  // State for zoom and pan functionality
  const [zoomLevel, setZoomLevel] = useState<{ [key: string]: number }>({})
  const [panPosition, setPanPosition] = useState<{ [key: string]: { x: number; y: number } }>({})
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Check if data contains both herdnet and yolo responses
  const hasHerdnet = data.herdnet !== undefined
  const hasYolo = data.yolo !== undefined

  // Extract HerdNet data
  const herdnetData = hasHerdnet ? data.herdnet : data
  const detectionsArray = herdnetData.detections || herdnetData.data?.detections || []
  const plotsArray: Plot[] = herdnetData.plots || herdnetData.data?.plots || []
  
  // Extract YOLO data
  const yoloImages = hasYolo ? (data.yolo.annotated_images || []) : []
  
  // Create a mapping of image_name to plot_base64 for HerdNet quick lookup
  const plotsMap = useMemo(() => {
    const map: { [key: string]: string } = {}
    plotsArray.forEach((plot: Plot) => {
      map[plot.image_name] = plot.plot_base64
    })
    return map
  }, [plotsArray])

  // Create a mapping of image_name to YOLO annotated image
  const yoloMap = useMemo(() => {
    const map: { [key: string]: any } = {}
    yoloImages.forEach((img: any) => {
      map[img.image_name] = img
    })
    return map
  }, [yoloImages])

  // Handler for image upload
  const handleImageUpload = (imageName: string, file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedImages((prev) => ({
        ...prev,
        [imageName]: reader.result as string,
      }))
    }
    reader.readAsDataURL(file)
  }

  // Zoom and pan handlers
  const getZoom = (imageName: string) => zoomLevel[imageName] || 1
  const getPan = (imageName: string) => panPosition[imageName] || { x: 0, y: 0 }

  const handleZoomIn = (imageName: string) => {
    setZoomLevel((prev) => ({
      ...prev,
      [imageName]: Math.min((prev[imageName] || 1) + 0.25, 5),
    }))
  }

  const handleZoomOut = (imageName: string) => {
    setZoomLevel((prev) => ({
      ...prev,
      [imageName]: Math.max((prev[imageName] || 1) - 0.25, 0.1),
    }))
  }

  const handleResetZoom = (imageName: string) => {
    setZoomLevel((prev) => ({ ...prev, [imageName]: 1 }))
    setPanPosition((prev) => ({ ...prev, [imageName]: { x: 0, y: 0 } }))
  }

  const handleMouseDown = (e: React.MouseEvent, imageName: string) => {
    setIsDragging(imageName)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent, imageName: string) => {
    if (isDragging === imageName) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      const currentPan = getPan(imageName)
      setPanPosition((prev) => ({
        ...prev,
        [imageName]: {
          x: currentPan.x + dx,
          y: currentPan.y + dy,
        },
      }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  // Group detections by image
  const groupedByImage = useMemo(() => {
    const groups: { [key: string]: GroupedDetection } = {}

    detectionsArray.forEach((detection: Detection) => {
      // Handle both image_name and images field
      const imageName = detection.image_name || detection.images
      if (!imageName) return

      if (!groups[imageName]) {
        groups[imageName] = {
          imageName,
          detections: [],
          totalDetections: 0,
          speciesCounts: {},
        }
      }

      groups[imageName].detections.push(detection)
      groups[imageName].totalDetections++

      // Count species
      const species = detection.species
      if (species) {
        groups[imageName].speciesCounts[species] =
          (groups[imageName].speciesCounts[species] || 0) + 1
      }
    })

    return Object.values(groups).sort((a, b) => a.imageName.localeCompare(b.imageName))
  }, [detectionsArray])

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalImages = groupedByImage.length
    const totalDetections = detectionsArray.length
    const speciesCounts: { [key: string]: number } = {}

    detectionsArray.forEach((detection: Detection) => {
      const species = detection.species
      if (species) {
        speciesCounts[species] = (speciesCounts[species] || 0) + 1
      }
    })

    return {
      totalImages,
      totalDetections,
      speciesCounts,
    }
  }, [detectionsArray, groupedByImage])

  return (
    <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
        Detection Results
      </h2>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">Total Images</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {summary.totalImages}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">Total Detections</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {summary.totalDetections}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
          <p className="text-sm text-purple-600 dark:text-purple-400">Avg per Image</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {summary.totalImages > 0
              ? (summary.totalDetections / summary.totalImages).toFixed(1)
              : '0'}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-4 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400">Species Found</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {Object.keys(summary.speciesCounts).length}
          </p>
        </div>
      </div>

      {/* Species Summary */}
      {Object.keys(summary.speciesCounts).length > 0 && (
        <div className="mb-6 bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            Species Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(summary.speciesCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([species, count]) => (
                <div
                  key={species}
                  className="bg-white dark:bg-slate-600 p-3 rounded border border-slate-200 dark:border-slate-500"
                >
                  <p className="text-xs text-slate-600 dark:text-slate-300 capitalize">
                    {species}
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {count}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Grouped Results by Image */}
      {groupedByImage.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Detections by Image
          </h3>

          {groupedByImage.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
            >
              {/* Image Header */}
              <div className="bg-slate-100 dark:bg-slate-700 p-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {group.imageName}
                  </h4>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setSelectedImageForViewer(
                          selectedImageForViewer === group.imageName ? null : group.imageName
                        )
                      }
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                    >
                      {selectedImageForViewer === group.imageName
                        ? 'Hide Maps'
                        : 'Show Detection Maps'}
                    </button>
                    <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full font-semibold">
                      HerdNet: {group.totalDetections}
                    </span>
                    {yoloMap[group.imageName] && (
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
                        YOLO: {yoloMap[group.imageName].detections_count || 0}
                      </span>
                    )}
                  </div>
                </div>
                {/* Species summary for this image */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(group.speciesCounts).map(([species, count]) => (
                    <span
                      key={species}
                      className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs rounded capitalize"
                    >
                      {species}: {count}
                    </span>
                  ))}
                </div>
              </div>

              {/* Detection Map Visualization */}
              {selectedImageForViewer === group.imageName && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-md font-semibold text-slate-900 dark:text-white">
                      Detection Results Comparison
                    </h5>
                    {!plotsMap[group.imageName] && !uploadedImages[group.imageName] && (
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`image-upload-${groupIndex}`}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded cursor-pointer transition-colors"
                        >
                          Upload Original Image
                        </label>
                        <input
                          id={`image-upload-${groupIndex}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleImageUpload(group.imageName, file)
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Display both HerdNet and YOLO images side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* HerdNet Detection Map */}
                    <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-900">
                      <h6 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        HerdNet Detection Map
                      </h6>
                      {/* Zoom Controls for HerdNet */}
                      <div className="mb-3 flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleZoomOut(`herdnet-${group.imageName}`)}
                            className="p-2 bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 rounded border border-slate-300 dark:border-slate-500 transition-colors"
                            title="Zoom Out"
                          >
                            <svg className="w-5 h-5 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleZoomIn(`herdnet-${group.imageName}`)}
                            className="p-2 bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 rounded border border-slate-300 dark:border-slate-500 transition-colors"
                            title="Zoom In"
                          >
                            <svg className="w-5 h-5 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleResetZoom(`herdnet-${group.imageName}`)}
                            className="p-2 bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 rounded border border-slate-300 dark:border-slate-500 transition-colors"
                            title="Reset Zoom"
                          >
                            <svg className="w-5 h-5 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                            {(getZoom(`herdnet-${group.imageName}`) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          🖱️ Drag to pan
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 overflow-hidden">
                        {/* Show backend-generated plot if available */}
                        {plotsMap[group.imageName] ? (
                          <div className="flex flex-col items-center">
                            <div className="mb-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>HerdNet detection map</span>
                            </div>
                            <div 
                              className="relative overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600"
                              style={{ width: '100%', height: '500px', cursor: isDragging === `herdnet-${group.imageName}` ? 'grabbing' : 'grab' }}
                              onMouseDown={(e) => handleMouseDown(e, `herdnet-${group.imageName}`)}
                              onMouseMove={(e) => handleMouseMove(e, `herdnet-${group.imageName}`)}
                              onMouseUp={handleMouseUp}
                              onMouseLeave={handleMouseUp}
                            >
                              <img
                                src={`data:image/jpeg;base64,${plotsMap[group.imageName]}`}
                                alt={`HerdNet detection map for ${group.imageName}`}
                                className="shadow-lg"
                                style={{
                                  transform: `scale(${getZoom(`herdnet-${group.imageName}`)}) translate(${getPan(`herdnet-${group.imageName}`).x / getZoom(`herdnet-${group.imageName}`)}px, ${getPan(`herdnet-${group.imageName}`).y / getZoom(`herdnet-${group.imageName}`)}px)`,
                                  transformOrigin: 'center center',
                                  transition: isDragging === `herdnet-${group.imageName}` ? 'none' : 'transform 0.1s ease-out',
                                  maxWidth: 'none',
                                  height: 'auto',
                                  userSelect: 'none',
                                }}
                                draggable={false}
                              />
                            </div>
                          </div>
                    ) : (
                      /* Fallback to custom SVG visualization */
                      <>
                    {/* Find max coordinates to scale the visualization */}
                    {(() => {
                      const imageUrl = uploadedImages[group.imageName]
                      const maxX = Math.max(
                        ...group.detections.map(
                          (d) => (d.position?.x ?? d.x ?? 0) + 200
                        )
                      )
                      const maxY = Math.max(
                        ...group.detections.map(
                          (d) => (d.position?.y ?? d.y ?? 0) + 200
                        )
                      )
                      // If we have an image, don't scale; otherwise scale to fit
                      const scale = imageUrl ? 1 : Math.min(800 / maxX, 600 / maxY, 1)

                      return (
                        <div className="relative">
                          {imageUrl && (
                            <div className="mb-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>Original image loaded - detections overlaid</span>
                            </div>
                          )}
                          <div 
                            className="relative overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600"
                            style={{ 
                              width: '100%', 
                              height: '600px', 
                              cursor: isDragging === group.imageName ? 'grabbing' : 'grab' 
                            }}
                            onMouseDown={(e) => handleMouseDown(e, group.imageName)}
                            onMouseMove={(e) => handleMouseMove(e, group.imageName)}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                          >
                            <svg
                              width={Math.max(800, maxX * scale)}
                              height={Math.max(600, maxY * scale)}
                              style={{
                                transform: `scale(${getZoom(group.imageName)}) translate(${getPan(group.imageName).x / getZoom(group.imageName)}px, ${getPan(group.imageName).y / getZoom(group.imageName)}px)`,
                                transformOrigin: 'center center',
                                transition: isDragging === group.imageName ? 'none' : 'transform 0.1s ease-out',
                                userSelect: 'none',
                              }}
                            >
                            {/* Background: either image or grid */}
                            <defs>
                              <pattern
                                id={`grid-${groupIndex}`}
                                width="50"
                                height="50"
                                patternUnits="userSpaceOnUse"
                              >
                                <path
                                  d="M 50 0 L 0 0 0 50"
                                  fill="none"
                                  stroke="rgba(148, 163, 184, 0.1)"
                                  strokeWidth="1"
                                />
                              </pattern>
                            </defs>
                            {imageUrl ? (
                              <image
                                href={imageUrl}
                                width="100%"
                                height="100%"
                                preserveAspectRatio="xMidYMid meet"
                              />
                            ) : (
                              <rect width="100%" height="100%" fill={`url(#grid-${groupIndex})`} />
                            )}

                            {/* Detection markers */}
                            {group.detections.map((detection, idx) => {
                              const posX = (detection.position?.x ?? detection.x ?? 0) * scale
                              const posY = (detection.position?.y ?? detection.y ?? 0) * scale
                              const confidenceValue = detection.confidence ?? detection.scores
                              const colors = [
                                '#ef4444',
                                '#f59e0b',
                                '#10b981',
                                '#3b82f6',
                                '#8b5cf6',
                                '#ec4899',
                              ]
                              const color = colors[idx % colors.length]
                              const markerSize = imageUrl ? 12 : 8
                              const ringSize = imageUrl ? 30 : 20

                              return (
                                <g key={idx}>
                                  {/* Shadow for better visibility on images */}
                                  {imageUrl && (
                                    <circle
                                      cx={posX}
                                      cy={posY}
                                      r={markerSize + 2}
                                      fill="black"
                                      opacity="0.3"
                                    />
                                  )}
                                  {/* Detection circle */}
                                  <circle
                                    cx={posX}
                                    cy={posY}
                                    r={markerSize}
                                    fill={color}
                                    opacity={imageUrl ? '0.9' : '0.7'}
                                    stroke="white"
                                    strokeWidth={imageUrl ? '3' : '2'}
                                  />
                                  {/* Detection number */}
                                  <text
                                    x={posX}
                                    y={posY + 5}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize={imageUrl ? '14' : '10'}
                                    fontWeight="bold"
                                    stroke="black"
                                    strokeWidth="0.5"
                                  >
                                    {idx + 1}
                                  </text>
                                  {/* Confidence circle */}
                                  <circle
                                    cx={posX}
                                    cy={posY}
                                    r={ringSize + confidenceValue * (imageUrl ? 30 : 20)}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth={imageUrl ? '3' : '2'}
                                    opacity={imageUrl ? '0.5' : '0.3'}
                                  />
                                  {/* Crosshair for precise location */}
                                  {imageUrl && (
                                    <>
                                      <line
                                        x1={posX - 20}
                                        y1={posY}
                                        x2={posX - markerSize - 2}
                                        y2={posY}
                                        stroke={color}
                                        strokeWidth="2"
                                        opacity="0.7"
                                      />
                                      <line
                                        x1={posX + markerSize + 2}
                                        y1={posY}
                                        x2={posX + 20}
                                        y2={posY}
                                        stroke={color}
                                        strokeWidth="2"
                                        opacity="0.7"
                                      />
                                      <line
                                        x1={posX}
                                        y1={posY - 20}
                                        x2={posX}
                                        y2={posY - markerSize - 2}
                                        stroke={color}
                                        strokeWidth="2"
                                        opacity="0.7"
                                      />
                                      <line
                                        x1={posX}
                                        y1={posY + markerSize + 2}
                                        x2={posX}
                                        y2={posY + 20}
                                        stroke={color}
                                        strokeWidth="2"
                                        opacity="0.7"
                                      />
                                    </>
                                  )}
                                </g>
                              )
                            })}
                          </svg>
                          </div>

                          {/* Legend */}
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {group.detections.map((detection, idx) => {
                              const posX = detection.position?.x ?? detection.x
                              const posY = detection.position?.y ?? detection.y
                              const confidenceValue = detection.confidence ?? detection.scores
                              const colors = [
                                'bg-red-500',
                                'bg-amber-500',
                                'bg-green-500',
                                'bg-blue-500',
                                'bg-purple-500',
                                'bg-pink-500',
                              ]
                              const colorClass = colors[idx % colors.length]

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-2 rounded text-xs"
                                >
                                  <span
                                    className={`${colorClass} w-6 h-6 rounded-full flex items-center justify-center text-white font-bold`}
                                  >
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-semibold text-slate-900 dark:text-white capitalize">
                                      {detection.species}
                                    </p>
                                    <p className="text-slate-600 dark:text-slate-400">
                                      Pos: ({posX}, {posY}) • {(confidenceValue * 100).toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                    </>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        {plotsMap[group.imageName] ? (
                          <p>
                            <strong>🎨 HerdNet:</strong> Detection map with all detections marked directly on the original image.
                          </p>
                        ) : (
                          <p>
                            <strong>ℹ️ HerdNet:</strong> Detection map not available for this image.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* YOLO Detection Map */}
                    <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-900">
                      <h6 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        YOLO Detection Map
                      </h6>
                      
                      {/* Zoom Controls for YOLO */}
                      <div className="mb-3 flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleZoomOut(`yolo-${group.imageName}`)}
                            className="p-2 bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 rounded border border-slate-300 dark:border-slate-500 transition-colors"
                            title="Zoom Out"
                          >
                            <svg className="w-5 h-5 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleZoomIn(`yolo-${group.imageName}`)}
                            className="p-2 bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 rounded border border-slate-300 dark:border-slate-500 transition-colors"
                            title="Zoom In"
                          >
                            <svg className="w-5 h-5 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleResetZoom(`yolo-${group.imageName}`)}
                            className="p-2 bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 rounded border border-slate-300 dark:border-slate-500 transition-colors"
                            title="Reset Zoom"
                          >
                            <svg className="w-5 h-5 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                            {(getZoom(`yolo-${group.imageName}`) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          🖱️ Drag to pan
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 overflow-hidden">
                        {/* Show YOLO annotated image if available */}
                        {yoloMap[group.imageName] ? (
                          <div className="flex flex-col items-center">
                            <div className="mb-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>YOLO annotated image ({yoloMap[group.imageName].detections_count} detections)</span>
                            </div>
                            <div 
                              className="relative overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600"
                              style={{ width: '100%', height: '500px', cursor: isDragging === `yolo-${group.imageName}` ? 'grabbing' : 'grab' }}
                              onMouseDown={(e) => handleMouseDown(e, `yolo-${group.imageName}`)}
                              onMouseMove={(e) => handleMouseMove(e, `yolo-${group.imageName}`)}
                              onMouseUp={handleMouseUp}
                              onMouseLeave={handleMouseUp}
                            >
                              <img
                                src={`data:image/jpeg;base64,${yoloMap[group.imageName].annotated_image_base64}`}
                                alt={`YOLO detection map for ${group.imageName}`}
                                className="shadow-lg"
                                style={{
                                  transform: `scale(${getZoom(`yolo-${group.imageName}`)}) translate(${getPan(`yolo-${group.imageName}`).x / getZoom(`yolo-${group.imageName}`)}px, ${getPan(`yolo-${group.imageName}`).y / getZoom(`yolo-${group.imageName}`)}px)`,
                                  transformOrigin: 'center center',
                                  transition: isDragging === `yolo-${group.imageName}` ? 'none' : 'transform 0.1s ease-out',
                                  maxWidth: 'none',
                                  height: 'auto',
                                  userSelect: 'none',
                                }}
                                draggable={false}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                            <p>YOLO detection not available for this image</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        {yoloMap[group.imageName] ? (
                          <p>
                            <strong>🎯 YOLO:</strong> Annotated image with bounding boxes showing detected animals.
                          </p>
                        ) : (
                          <p>
                            <strong>ℹ️ YOLO:</strong> Detection map not available for this image.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detections Table */}
              <div className="p-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Thumbnail
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Species
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        D-Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {group.detections.map((detection, detIndex) => {
                      // Get position coordinates (handle both formats)
                      const posX = detection.position?.x ?? detection.x
                      const posY = detection.position?.y ?? detection.y
                      // Get confidence (use confidence if available, otherwise scores)
                      const confidenceValue = detection.confidence ?? detection.scores

                      return (
                        <tr key={detIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            {detection.detection_id || detIndex + 1}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {detection.thumbnail_base64 ? (
                              <img
                                src={`data:image/jpeg;base64,${detection.thumbnail_base64}`}
                                alt={`Detection ${detection.detection_id || detIndex + 1}`}
                                className="h-16 w-16 object-contain rounded border border-slate-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400 text-xs">
                                N/A
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 capitalize">
                              {detection.species}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100 font-mono">
                            ({posX}, {posY})
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mr-2">
                                <div
                                  className="bg-primary-500 h-2 rounded-full"
                                  style={{ width: `${(confidenceValue * 100).toFixed(0)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                                {(confidenceValue * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {(detection.scores * 100).toFixed(1)}%
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {detection.dscores !== undefined ? `${(detection.dscores * 100).toFixed(2)}%` : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {groupedByImage.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">No detections found in the results.</p>
        </div>
      )}
    </div>
  )
}
