import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'File Upload System',
  description: 'Upload and process zip files',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

