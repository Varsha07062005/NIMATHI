import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, Sun, Coffee, Sunset, Moon, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { api } from '../utils/supabase/client';
import type { User } from '../App';

interface MeditationScreenProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
}

interface MusicTrack {
  id: string;
  title: string;
  duration: string;
  category: 'morning' | 'break' | 'afternoon' | 'evening' | 'night';
  url: string; // In a real app, this would be actual audio URLs
}

export function MeditationScreen({ user, onBack, onUpdateUser }: MeditationScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('morning');
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300); // 5 minutes default
  const [volume, setVolume] = useState([80]);
  const [customTimer, setCustomTimer] = useState([10]); // 10 minutes default
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const timeCategories = [
    { id: 'morning', label: 'Morning', icon: <Sun className="w-5 h-5" />, color: 'from-yellow-400 to-orange-500' },
    { id: 'break', label: 'Break Time', icon: <Coffee className="w-5 h-5" />, color: 'from-green-400 to-blue-500' },
    { id: 'afternoon', label: 'Afternoon', icon: <Sun className="w-5 h-5" />, color: 'from-blue-400 to-indigo-500' },
    { id: 'evening', label: 'Evening', icon: <Sunset className="w-5 h-5" />, color: 'from-orange-400 to-red-500' },
    { id: 'night', label: 'Night', icon: <Moon className="w-5 h-5" />, color: 'from-purple-400 to-blue-600' }
  ];

  const musicTracks: MusicTrack[] = [
    { id: '1', title: 'Morning Awakening', duration: '10:00', category: 'morning', url: '/audio/morning1.mp3' },
    { id: '2', title: 'Sunrise Meditation', duration: '15:00', category: 'morning', url: '/audio/morning2.mp3' },
    { id: '3', title: 'Peaceful Morning', duration: '8:00', category: 'morning', url: '/audio/morning3.mp3' },
    
    { id: '4', title: 'Midday Reset', duration: '5:00', category: 'break', url: '/audio/break1.mp3' },
    { id: '5', title: 'Quick Refresh', duration: '3:00', category: 'break', url: '/audio/break2.mp3' },
    { id: '6', title: 'Energy Restore', duration: '7:00', category: 'break', url: '/audio/break3.mp3' },
    
    { id: '7', title: 'Afternoon Calm', duration: '12:00', category: 'afternoon', url: '/audio/afternoon1.mp3' },
    { id: '8', title: 'Focus Flow', duration: '20:00', category: 'afternoon', url: '/audio/afternoon2.mp3' },
    { id: '9', title: 'Mindful Moment', duration: '6:00', category: 'afternoon', url: '/audio/afternoon3.mp3' },
    
    { id: '10', title: 'Evening Unwind', duration: '18:00', category: 'evening', url: '/audio/evening1.mp3' },
    { id: '11', title: 'Sunset Serenity', duration: '14:00', category: 'evening', url: '/audio/evening2.mp3' },
    { id: '12', title: 'Day\'s End Peace', duration: '10:00', category: 'evening', url: '/audio/evening3.mp3' },
    
    { id: '13', title: 'Deep Sleep Prep', duration: '25:00', category: 'night', url: '/audio/night1.mp3' },
    { id: '14', title: 'Moonlight Dreams', duration: '30:00', category: 'night', url: '/audio/night2.mp3' },
    { id: '15', title: 'Night Tranquility', duration: '22:00', category: 'night', url: '/audio/night3.mp3' }
  ];

  const getCurrentCategoryTracks = () => {
    return musicTracks.filter(track => track.category === selectedCategory);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startMeditation = () => {
    if (!selectedTrack) return;
    
    setIsPlaying(true);
    setDuration(customTimer[0] * 60); // Convert minutes to seconds
    setCurrentTime(0);
    
    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= duration - 1) {
          stopMeditation();
          completeMeditation();
          return duration;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopMeditation = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetMeditation = () => {
    stopMeditation();
    setCurrentTime(0);
  };

  const completeMeditation = async () => {
    try {
      const sessionData = localStorage.getItem('nimathi-session');
      if (!sessionData) {
        toast.error('Please log in to save meditation progress');
        return;
      }

      const { accessToken } = JSON.parse(sessionData);

      // Record meditation activity in backend
      await api.recordActivity(user.id, {
        type: 'meditation',
        duration: customTimer[0],
        details: {
          category: selectedCategory,
          track: selectedTrack?.title,
          completed: true,
          date: new Date().toISOString()
        }
      }, accessToken);

      // Award reward points
      const points = Math.floor(customTimer[0] * 2); // 2 points per minute
      const updatedUser = {
        ...user,
        rewardPoints: user.rewardPoints + points
      };
      
      // Save meditation session data locally for backup
      const meditationData = {
        date: new Date().toISOString(),
        duration: customTimer[0],
        category: selectedCategory,
        track: selectedTrack?.title,
        completed: true
      };
      
      const existingMeditations = JSON.parse(localStorage.getItem('nimathi-meditations') || '[]');
      existingMeditations.push(meditationData);
      localStorage.setItem('nimathi-meditations', JSON.stringify(existingMeditations));
      
      onUpdateUser(updatedUser);
      toast.success(`Great job ${user.petName}! You earned ${points} reward points! 🧘‍♀️`);

    } catch (error) {
      console.error('Error recording meditation session:', error);
      // Still award points locally even if backend fails
      const points = Math.floor(customTimer[0] * 2);
      const updatedUser = {
        ...user,
        rewardPoints: user.rewardPoints + points
      };
      onUpdateUser(updatedUser);
      toast.success(`Meditation complete! You earned ${points} points! 🧘‍♀️`);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopMeditation();
    } else {
      startMeditation();
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div 
        className="flex items-center p-4 pt-12 pb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button variant="ghost" onClick={onBack} size="sm" className="mr-3 p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl text-foreground">Meditation</h1>
          <p className="text-sm text-muted-foreground">Find your inner peace, {user.petName}</p>
        </div>
      </motion.div>

      <div className="px-4 pb-20 space-y-6">
        {/* Time Category Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4">
            <h3 className="text-base mb-4 text-foreground">Choose your time</h3>
            <div className="grid grid-cols-2 gap-3">
              {timeCategories.map((category) => (
                <motion.button
                  key={category.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedTrack(null);
                  }}
                  className={`p-3 rounded-lg flex items-center space-x-2 transition-all ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {category.icon}
                  <span className="text-sm">{category.label}</span>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Music Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4">
            <h3 className="text-base mb-4 text-foreground">Choose your soundtrack</h3>
            <div className="space-y-2">
              {getCurrentCategoryTracks().map((track) => (
                <motion.button
                  key={track.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTrack(track)}
                  className={`w-full p-3 rounded-lg flex items-center justify-between transition-all ${
                    selectedTrack?.id === track.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedTrack?.id === track.id ? 'bg-primary-foreground/20' : 'bg-primary/10'
                    }`}>
                      <Star className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm">{track.title}</p>
                    </div>
                  </div>
                  <span className="text-xs opacity-70">{track.duration}</span>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Meditation Timer */}
        {selectedTrack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg mb-2 text-foreground">{selectedTrack.title}</h3>
                <div className="text-3xl text-foreground mb-2">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                <Progress value={progress} className="w-full h-2" />
              </div>

              {!isPlaying && currentTime === 0 && (
                <div className="mb-6">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Session Duration: {customTimer[0]} minutes
                  </label>
                  <Slider
                    value={customTimer}
                    onValueChange={setCustomTimer}
                    max={60}
                    min={3}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}

              <div className="mb-6">
                <label className="text-sm text-muted-foreground mb-2 block flex items-center">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Volume: {volume[0]}%
                </label>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={togglePlayPause}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                <Button
                  onClick={resetMeditation}
                  variant="outline"
                  size="lg"
                  className="w-16 h-16 rounded-full"
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Meditation Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-muted/50">
            <h3 className="text-sm mb-3 text-foreground">💡 Meditation Tips</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• Find a quiet, comfortable space</p>
              <p>• Keep your back straight but relaxed</p>
              <p>• Focus on your breath naturally flowing</p>
              <p>• It's okay if your mind wanders - gently return focus</p>
              <p>• Start with shorter sessions and gradually increase</p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}