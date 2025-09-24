import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Palette, Eraser, RotateCcw, Save, Download, Undo, Redo } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { toast } from 'sonner@2.0.3';
import type { User } from '../App';

interface DrawingCanvasProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
}

export function DrawingCanvas({ user, onBack, onUpdateUser }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#3B82F6');
  const [brushSize, setBrushSize] = useState([5]);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#6B7280', '#000000', '#FFFFFF', '#FFA500',
    '#FF69B4', '#00CED1', '#FFD700', '#FF6347', '#9370DB'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to be responsive
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Set white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Save initial state
        saveCanvasState();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack(prev => [...prev.slice(-19), imageData]); // Keep last 20 states
    setRedoStack([]); // Clear redo stack when new action is performed
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = brushSize[0];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
    } else {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvasState();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
  };

  const undo = () => {
    if (undoStack.length <= 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, currentState]);
    
    const previousState = undoStack[undoStack.length - 2];
    setUndoStack(prev => prev.slice(0, -1));
    
    ctx.putImageData(previousState, 0, 0);
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stateToRestore = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, stateToRestore]);
    
    ctx.putImageData(stateToRestore, 0, 0);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Save drawing data for chatbot integration
    const drawingData = {
      date: new Date().toISOString(),
      sessionDuration: Date.now(), // In a real app, track actual time
      completed: true,
      canvasData: canvas.toDataURL()
    };

    const existingDrawings = JSON.parse(localStorage.getItem('nimathi-drawings') || '[]');
    existingDrawings.push(drawingData);
    localStorage.setItem('nimathi-drawings', JSON.stringify(existingDrawings));

    // Award reward points
    const points = 15; // Fixed points for completing a drawing session
    const updatedUser = {
      ...user,
      rewardPoints: user.rewardPoints + points
    };

    onUpdateUser(updatedUser);
    toast.success(`Drawing saved! You earned ${points} reward points! 🎨`);
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `nimathi-art-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
    
    saveDrawing(); // Also save when downloading
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between p-4 pt-12 pb-4 border-b border-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack} size="sm" className="mr-3 p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl text-foreground">Art Therapy</h1>
            <p className="text-sm text-muted-foreground">Express yourself freely, {user.petName}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={undo} size="sm" disabled={undoStack.length <= 1}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={redo} size="sm" disabled={redoStack.length === 0}>
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Tools Panel */}
      <motion.div 
        className="p-4 border-b border-border bg-card"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            <Button
              variant={tool === 'brush' ? 'default' : 'outline'}
              onClick={() => setTool('brush')}
              size="sm"
            >
              <Palette className="w-4 h-4 mr-2" />
              Brush
            </Button>
            <Button
              variant={tool === 'eraser' ? 'default' : 'outline'}
              onClick={() => setTool('eraser')}
              size="sm"
            >
              <Eraser className="w-4 h-4 mr-2" />
              Eraser
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={clearCanvas} size="sm">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={saveDrawing} size="sm">
              <Save className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={downloadDrawing} size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Color Palette */}
        <div className="flex flex-wrap gap-2 mb-4">
          {colors.map((color) => (
            <motion.button
              key={color}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                currentColor === color ? 'border-foreground scale-110' : 'border-muted-foreground/30'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Brush Size */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-muted-foreground min-w-[60px]">Size: {brushSize[0]}px</span>
          <Slider
            value={brushSize}
            onValueChange={setBrushSize}
            max={50}
            min={1}
            step={1}
            className="flex-1"
          />
          <div 
            className="w-8 h-8 rounded-full border border-muted-foreground/30 flex items-center justify-center"
            style={{ 
              backgroundColor: tool === 'brush' ? currentColor : 'transparent',
              width: Math.max(8, Math.min(32, brushSize[0] + 8)),
              height: Math.max(8, Math.min(32, brushSize[0] + 8))
            }}
          />
        </div>
      </motion.div>

      {/* Canvas */}
      <motion.div 
        className="flex-1 p-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="h-full p-2">
          <div className="w-full h-full rounded-lg overflow-hidden bg-white shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
        </Card>
      </motion.div>

      {/* Tips */}
      <motion.div 
        className="p-4 pt-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-3 bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            💡 Let your emotions flow through colors and shapes. There's no right or wrong way to create art.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}