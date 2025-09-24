import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, Clock, Target, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import type { User } from '../App';

interface TaskSchedulerProps {
  user: User;
  onBack: () => void;
}

interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export function TaskScheduler({ user, onBack }: TaskSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Generate next 7 days
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return days;
  };

  const next7Days = getNext7Days();

  const handleAddTask = () => {
    if (!newTask.title.trim() || !selectedDate) {
      toast.error('Please fill in the task title and select a date');
      return;
    }

    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTask.title,
      description: newTask.description,
      date: selectedDate,
      priority: newTask.priority,
      completed: false
    };

    setTasks(prev => [...prev, task]);
    setNewTask({ title: '', description: '', priority: 'medium' });
    setIsDialogOpen(false);
    toast.success('Task added successfully!');
  };

  const getTasksForDate = (date: string) => {
    return tasks.filter(task => task.date === date);
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Header */}
      <motion.div 
        className="flex items-center mb-6 pt-12 pb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button variant="ghost" onClick={onBack} size="sm" className="mr-3 p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl text-foreground">Task Scheduler</h1>
          <p className="text-muted-foreground text-sm">Plan your week with gentle guidance</p>
        </div>
      </motion.div>

      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-none">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-gray-800">Hello {user.petName},</p>
              <p className="text-sm text-gray-600">Take your time to plan. Remember, progress over perfection.</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 7-Day Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-lg text-gray-800 mb-4">Next 7 Days</h2>
        <div className="grid grid-cols-7 gap-2">
          {next7Days.map((day, index) => {
            const isSelected = selectedDate === day.date;
            const dayTasks = getTasksForDate(day.date);
            
            return (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`p-3 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-white hover:bg-blue-50'
                  }`}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <div className="text-center">
                    <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                      {day.dayName}
                    </p>
                    <p className={`text-lg ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                      {day.dayNumber}
                    </p>
                    <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                      {day.monthName}
                    </p>
                    {dayTasks.length > 0 && (
                      <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                        isSelected ? 'bg-white' : 'bg-blue-500'
                      }`} />
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Add Task Button */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Task for {next7Days.find(d => d.date === selectedDate)?.dayName}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taskTitle">Task Title</Label>
                  <Input
                    id="taskTitle"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What would you like to accomplish?"
                  />
                </div>
                <div>
                  <Label htmlFor="taskDescription">Description (Optional)</Label>
                  <Textarea
                    id="taskDescription"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add any additional details..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Priority Level</Label>
                  <div className="flex space-x-2 mt-2">
                    {(['low', 'medium', 'high'] as const).map((priority) => (
                      <Button
                        key={priority}
                        variant={newTask.priority === priority ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewTask(prev => ({ ...prev, priority }))}
                        className={newTask.priority === priority ? getPriorityColor(priority) : ''}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleAddTask} className="w-full">
                  <Target className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      )}

      {/* Tasks for Selected Date */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg text-gray-800">
            Tasks for {next7Days.find(d => d.date === selectedDate)?.dayName}, {next7Days.find(d => d.date === selectedDate)?.monthName} {next7Days.find(d => d.date === selectedDate)?.dayNumber}
          </h3>
          
          <AnimatePresence>
            {getTasksForDate(selectedDate).map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-4 ${task.completed ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
                  <div className="flex items-start space-x-3">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleTaskComplete(task.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                        task.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {task.completed && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-white text-sm"
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.button>
                    <div className="flex-1">
                      <h4 className={`text-gray-800 ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${getPriorityColor(task.priority)}`}>
                        {task.priority} priority
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {getTasksForDate(selectedDate).length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No tasks scheduled for this day</p>
              <p className="text-sm text-gray-500 mt-1">Take your time to plan at your own pace</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {!selectedDate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-gray-600">Select a day to start planning</p>
          <p className="text-sm text-gray-500 mt-1">Choose any day from the next 7 days</p>
        </motion.div>
      )}
    </div>
  );
}