'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react'

interface FileUploadProps {
  bucket: 'assignment-files' | 'submission-files'
  onUploadComplete: (url: string) => void
  onError?: (error: Error) => void
  accept?: string
  maxSize?: number // in MB
}

export default function FileUpload({ 
  bucket, 
  onUploadComplete, 
  onError,
  accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg',
  maxSize = 10 
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (selected.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    const ext = selected.name.split('.').pop()?.toLowerCase()
    const validExtensions = accept.split(',').map(e => e.trim().replace('.', ''))
    if (!validExtensions.includes(ext || '')) {
      setError(`File type must be: ${accept}`)
      return
    }

    setFile(selected)
    setError(null)
    setSuccess(false)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please login first')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      setSuccess(true)
      onUploadComplete(publicUrl)
    } catch (err) {
      const error = err as Error
      setError(error.message)
      if (onError) onError(error)
    } finally {
      setUploading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleUpload()
  }

  const handleRemove = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    setProgress(0)
  }

  return (
    <div className="space-y-4">
      {!file && (
        <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
          <input
            type="file"
            id={`file-upload-${bucket}`}
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
          />
          <label htmlFor={`file-upload-${bucket}`} className="cursor-pointer block">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Click to upload</p>
            <p className="text-sm text-muted-foreground">
              {accept.replace(/,/g, ', ')} (max {maxSize}MB)
            </p>
          </label>
        </div>
      )}

      {file && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0">
                {success ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <FileText className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
              disabled={uploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {uploading && (
            <div className="mt-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{progress}% uploaded</p>
            </div>
          )}

          {error && (
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="text-sm font-medium text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {!uploading && !success && !error && (
            <button
              onClick={handleUpload}
              className="mt-3 w-full px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Upload File
            </button>
          )}
        </div>
      )}
    </div>
  )
}