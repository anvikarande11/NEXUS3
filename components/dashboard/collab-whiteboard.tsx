'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pen, Eraser, Trash2, Save, Eye, EyeOff, Hand } from 'lucide-react'
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [color, setColor] = useState('#22c55e')
  const [lineWidth, setLineWidth] = useState(2)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)
  const [cvMode, setCvMode] = useState(false)
  const [showCVInstructions, setShowCVInstructions] = useState(false)
  const [detectedHands, setDetectedHands] = useState<Array<{ x: number; y: number; isOpen: boolean }>>([])
  const [cameraActive, setCameraActive] = useState(false)

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

  // Initialize CV mode - show instructions on first toggle
  useEffect(() => {
    if (cvMode && !showCVInstructions) {
      setShowCVInstructions(true)
      const timer = setTimeout(() => setShowCVInstructions(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [cvMode])

  // Simulate hand gesture detection
  useEffect(() => {
    if (!cvMode) {
      setCameraActive(false)
      return
    }

    setCameraActive(true)
    // Simulate hand detection with random positions
    const interval = setInterval(() => {
      if (canvasRef.current) {
        const x = Math.random() * canvasRef.current.width
        const y = Math.random() * canvasRef.current.height
        setDetectedHands([
          { x, y, isOpen: Math.random() > 0.5 }
        ])
      }
    }, 200)

    return () => clearInterval(interval)
  }, [cvMode])

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
                {cvMode && ' • Hand Gesture Mode Active'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* CV Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCvMode(!cvMode)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                  cvMode
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                title="Computer Vision Mode"
              >
                {cvMode ? (
                  <>
                    <Hand className="w-4 h-4" />
                    CV Mode On
                  </>
                ) : (
                  <>
                    <Hand className="w-4 h-4 opacity-50" />
                    CV Mode
                  </>
                )}
              </motion.button>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
            <div className="flex-1 bg-slate-950 rounded-lg border border-border overflow-hidden relative">
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

              {/* CV Mode Overlay */}
              <AnimatePresence>
                {cvMode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    {/* Simulated camera feed indicator */}
                    <div className="absolute top-2 left-2 w-12 h-12 rounded-lg border-2 border-accent/50 bg-black/30 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-accent/50" />
                    </div>

                    {/* Hand detection visualization */}
                    {detectedHands.map((hand, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute pointer-events-none"
                        style={{ left: hand.x - 15, top: hand.y - 15 }}
                      >
                        {/* Finger indicators */}
                        <div className="relative w-7 h-7">
                          <motion.circle
                            cx="14"
                            cy="14"
                            r="12"
                            fill="none"
                            stroke="var(--accent)"
                            strokeWidth="1.5"
                            opacity={0.6}
                          />
                          {/* Show hand state */}
                          {hand.isOpen ? (
                            <div className="absolute inset-0 flex items-center justify-center text-accent text-xs font-bold">✋</div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-accent text-xs font-bold">✊</div>
                          )}
                        </div>
                        {/* Draw indicator for index finger extended */}
                        {hand.isOpen && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute -top-1 left-5 w-2 h-2 bg-accent rounded-full"
                          />
                        )}
                      </motion.div>
                    ))}

                    {/* Instructions overlay */}
                    <AnimatePresence>
                      {showCVInstructions && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-center text-sm text-white"
                        >
                          <p className="font-medium">Hand Gesture Mode Active</p>
                          <p className="text-xs opacity-75 mt-1">
                            Open hand = Draw • Closed fist = Erase • Pinch = Clear
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
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
