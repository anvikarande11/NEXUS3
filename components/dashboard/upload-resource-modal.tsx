'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, Link2, Video, StickyNote, Plus, Check } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export function UploadResourceModal() {
  const { isUploadOpen, closeUpload, addNode } = useDashboardStore()
  const [dragActive, setDragActive] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [resourceName, setResourceName] = useState('')
  const [resourceType, setResourceType] = useState<'pdf' | 'video' | 'link' | 'note'>('pdf')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'video/mp4', 'image/png', 'image/jpeg', 'text/plain']
      return validTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.mp4')
    })
    setUploadedFiles(prev => [...prev, ...validFiles])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleCreateNode = async () => {
    if (selectedClass && resourceName.trim()) {
      setIsCreating(true)
      
      // Simulate file upload and node creation
      setTimeout(() => {
        addNode(selectedClass, resourceName)
        setResourceName('')
        setUploadedFiles([])
        setIsCreating(false)
        closeUpload()
      }, 600)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <AnimatePresence>
      {isUploadOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="border-b border-border p-6 flex items-center justify-between sticky top-0 bg-card">
              <div>
                <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Upload Resource
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Add materials and auto-generate mastery path nodes
                </p>
              </div>
              <button
                onClick={closeUpload}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Select Class */}
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Select Subject
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border text-sm focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Choose a subject...</option>
                  <option value="cp-1">DBMS</option>
                  <option value="cp-2">DSA</option>
                  <option value="cp-3">Operating Systems</option>
                  <option value="cp-4">Computer Networks</option>
                  <option value="cp-5">Machine Learning</option>
                  <option value="cp-6">Mathematics</option>
                </select>
              </div>

              {/* Resource Name */}
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Node Title
                </label>
                <Input
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  placeholder="e.g., Binary Search Tree Fundamentals"
                  className="bg-muted/50 border-border text-sm"
                />
              </div>

              {/* Resource Type */}
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Resource Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'pdf', label: 'PDF', icon: FileText },
                    { id: 'video', label: 'Video', icon: Video },
                    { id: 'link', label: 'Link', icon: Link2 },
                    { id: 'note', label: 'Note', icon: StickyNote }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setResourceType(type.id as any)}
                      className={`p-2 rounded-lg border transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                        resourceType === type.id
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag Drop Zone */}
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Upload Files
                </label>
                <label
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer block ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30 hover:border-primary/50'
                  }`}
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-card-foreground">
                    Drop files or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDFs, videos, images supported
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleInputChange}
                    className="hidden"
                    accept=".pdf,.mp4,.png,.jpg,.jpeg,.txt"
                  />
                </label>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-card-foreground block">
                    Uploaded Files ({uploadedFiles.length})
                  </label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-card-foreground truncate">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4 flex gap-2 justify-end bg-muted/20 sticky bottom-0">
              <Button variant="outline" onClick={closeUpload}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateNode}
                disabled={!selectedClass || !resourceName.trim() || isCreating}
                className="relative"
              >
                {isCreating && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="absolute"
                  >
                    <Upload className="w-4 h-4" />
                  </motion.span>
                )}
                <Plus className={`w-4 h-4 mr-2 ${isCreating ? 'opacity-0' : ''}`} />
                {isCreating ? 'Creating...' : 'Create Node'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
