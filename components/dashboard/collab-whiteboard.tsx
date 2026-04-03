'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pen, Eraser, Trash2, Save } from 'lucide-react'
import { useDashboardStore, type CollabDrawing } from '@/lib/store'
import { Button } from '@/components/ui/button'

export function CollabWhiteboard() {
  const {
    isWhiteboardOpen,
    toggleWhiteboard,
    currentSession,
    startSession,
    endSession,
    addDrawing,
    clearDrawings,
    addParticipant,
  } = useDashboardStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [color, setColor] = useState('#22c55e')
  const [lineWidth, setLineWidth] = useState(2)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)

  // Initialize session
  useEffect(() => {
    if (isWhiteboardOpen && !currentSession) {
      startSession('DSA', 'Study Session')
      addParticipant({
        id: 'user-1',
        name: 'You',
        avatar: 'ME',
        color: '#22c55e',
        cursorX: 0,
        cursorY: 0,
      })
    }
  }, [isWhiteboardOpen, currentSession, startSession, addParticipant])

  // Redraw canvas when drawings change
  useEffect(() => {
    if (!canvasRef.current || !currentSession) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    // Redraw all drawings
    currentSession.drawings.forEach((drawing) => {
      ctx.strokeStyle = drawing.type === 'eraser' ? '#0f172a' : drawing.color
      ctx.lineWidth = drawing.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (drawing.points.length > 0) {
        ctx.beginPath()
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y)
        drawing.points.forEach((point) => {
          ctx.lineTo(point.x, point.y)
        })
        ctx.stroke()
      }
    })
  }, [currentSession?.drawings])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setLastX(x)
    setLastY(y)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isDrawing || !currentSession) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()

    setLastX(x)
    setLastY(y)
  }

  const handleMouseUp = () => {
    if (!isDrawing || !canvasRef.current || !currentSession) return

    setIsDrawing(false)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get the current drawing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const points: { x: number; y: number }[] = []

    // Simple point extraction (in real implementation, would track during drawing)
    addDrawing({
      id: crypto.randomUUID(),
      points,
      color,
      width: lineWidth,
      type: tool,
      createdBy: 'user-1',
      timestamp: Date.now(),
    })
  }

  const handleClose = () => {
    endSession()
    toggleWhiteboard()
  }

  return (
    <AnimatePresence>
      {isWhiteboardOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col"
        >
          {/* Header */}
          <div className="border-b border-border bg-card/95 backdrop-blur px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-card-foreground">
                {currentSession?.title || 'Collaborative Whiteboard'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentSession?.participants.length || 1} participant{(currentSession?.participants.length || 1) !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Canvas and Toolbar */}
          <div className="flex-1 flex gap-4 p-4">
            {/* Toolbar */}
            <div className="w-20 bg-card/50 border border-border rounded-lg p-3 flex flex-col gap-2">
              {/* Tool Buttons */}
              <button
                onClick={() => setTool('pen')}
                className={`p-2 rounded-lg transition-colors ${
                  tool === 'pen'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
                title="Pen"
              >
                <Pen className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-lg transition-colors ${
                  tool === 'eraser'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
              </button>

              <div className="h-px bg-border" />

              {/* Color Picker */}
              {tool === 'pen' && (
                <div className="space-y-1">
                  {['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#ec4899'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-full h-6 rounded-md transition-all border-2 ${
                        color === c ? 'border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                      title="Color"
                    />
                  ))}
                </div>
              )}

              <div className="h-px bg-border" />

              {/* Line Width */}
              <input
                type="range"
                min="1"
                max="10"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-full"
                title="Line width"
              />

              <div className="h-px bg-border" />

              {/* Action Buttons */}
              <button
                onClick={clearDrawings}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-destructive transition-colors"
                title="Clear canvas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-slate-950 rounded-lg border border-border overflow-hidden">
              <canvas
                ref={canvasRef}
                width={1200}
                height={700}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-full cursor-crosshair"
              />
            </div>

            {/* Participants Panel */}
            <div className="w-40 bg-card/50 border border-border rounded-lg p-3 flex flex-col gap-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase">Participants</h3>
              <div className="space-y-2">
                {currentSession?.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="p-2 rounded-lg bg-muted/50 border border-border text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: participant.color }}
                      />
                      <span className="truncate text-card-foreground">{participant.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-card/95 backdrop-blur px-6 py-3 flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={handleClose}>
              <Save className="w-4 h-4 mr-2" />
              Save & Exit
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
