import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Heart, LogOut, Settings, Sparkles, Moon, Sun, TrendingUp, Star, Gift } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { AvatarEditor } from './AvatarEditor';
import type { User, AppScreen } from '../App';

interface DashboardProps {
  user: User;
  onNavigate: (screen: AppScreen) => void;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Dashboard({ user, onNavigate, onLogout, onUpdateUser, isDarkMode, onToggleDarkMode }: DashboardProps) {
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const currentTime = new Date();
  const hour = currentTime.getHours();
  
  const getGreeting = () => {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const motivationalQuotes = [
    "Every small step is progress.",
    "You're stronger than you think.",
    "Take time to breathe and be present.",
    "Your mental health matters.",
    "Progress, not perfection."
  ];

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  // Mock stress level data - in real app, this would come from user activities
  const stressLevels = user.stressLevels.length > 0 ? user.stressLevels : [
    { week: 'Week 1', level: 7 },
    { week: 'Week 2', level: 6 },
    { week: 'Week 3', level: 5 },
    { week: 'Week 4', level: 4 }
  ];

  const currentStressLevel = stressLevels[stressLevels.length - 1]?.level || 5;
  const previousStressLevel = stressLevels[stressLevels.length - 2]?.level || 7;
  const improvement = previousStressLevel - currentStressLevel;

  const rewardTiers = [
    { min: 0, max: 49, tier: 'Bronze', color: 'bg-amber-100 text-amber-800', icon: '🥉' },
    { min: 50, max: 149, tier: 'Silver', color: 'bg-gray-100 text-gray-800', icon: '🥈' },
    { min: 150, max: 299, tier: 'Gold', color: 'bg-yellow-100 text-yellow-800', icon: '🥇' },
    { min: 300, max: Infinity, tier: 'Diamond', color: 'bg-blue-100 text-blue-800', icon: '💎' }
  ];

  const currentTier = rewardTiers.find(tier => user.rewardPoints >= tier.min && user.rewardPoints <= tier.max) || rewardTiers[0];

  return (
    <div className="min-h-screen bg-background p-3 pb-20 safe-area-top safe-area-bottom max-w-full overflow-x-hidden">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-4 pt-8 pb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
            onClick={() => setIsAvatarEditorOpen(true)}
          >
            <Avatar className="w-12 h-12 border-2 border-border shadow-sm hover:border-primary transition-colors duration-200">
              <AvatarImage src={user.avatar} alt={user.petName} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.petName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <div>
            <h1 className="text-lg text-foreground">
              {getGreeting()}, {user.petName}!
            </h1>
            <p className="text-muted-foreground text-sm">How are you feeling today?</p>
          </div>
        </div>
        
        <div className="flex space-x-1">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="sm" onClick={onToggleDarkMode} className="p-2">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="w-5 h-5" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="sm" onClick={onLogout} className="p-2">
              <LogOut className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Reward Points & Progress */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-primary" />
              <h3 className="text-base text-foreground">Reward Points</h3>
            </div>
            <Badge className={currentTier.color}>
              {currentTier.icon} {currentTier.tier}
            </Badge>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl text-foreground">{user.rewardPoints}</span>
            <span className="text-sm text-muted-foreground">
              {currentTier.max === Infinity ? 'Max tier!' : `${currentTier.max - user.rewardPoints} to next tier`}
            </span>
          </div>
          <Progress 
            value={currentTier.max === Infinity ? 100 : (user.rewardPoints / currentTier.max) * 100} 
            className="h-2" 
          />
          <p className="text-xs text-muted-foreground mt-2">
            💡 Use points for discounts or cash rewards
          </p>
        </Card>
      </motion.div>

      {/* Stress Level Progress */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-base text-foreground">Stress Level Progress</h3>
            </div>
            {improvement > 0 && (
              <Badge className="bg-green-100 text-green-800">
                -{improvement} this week
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            {stressLevels.slice(-4).map((level, index) => (
              <div key={level.week} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{level.week}</span>
                <div className="flex items-center space-x-2">
                  <Progress value={(10 - level.level) * 10} className="w-24 h-2" />
                  <span className="text-sm text-foreground w-8">{level.level}/10</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Lower numbers indicate better stress management
          </p>
        </Card>
      </motion.div>

      {/* Daily Quote */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-4"
      >
        <Card className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-base text-foreground mb-2">Daily Inspiration</h3>
              <p className="text-muted-foreground italic text-sm">"{randomQuote}"</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Main Actions */}
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-all duration-300"
            onClick={() => onNavigate('tasks')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base text-foreground mb-1">Task Scheduler</h3>
                <p className="text-muted-foreground text-sm">Plan your week with gentle guidance</p>
              </div>
              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                <span className="text-muted-foreground text-sm">→</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-all duration-300"
            onClick={() => onNavigate('stress-free')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base text-foreground mb-1">Go Stress Free</h3>
                <p className="text-muted-foreground text-sm">Discover calming activities and mindful practices</p>
              </div>
              <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                <span className="text-muted-foreground text-sm">→</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Anonymous ID */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <Card className="p-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Your anonymous ID</p>
            <p className="font-mono text-xs text-foreground">{user.id}</p>
          </div>
        </Card>
      </motion.div>

      {/* Avatar Editor Modal */}
      <AvatarEditor 
        user={user}
        isOpen={isAvatarEditorOpen}
        onClose={() => setIsAvatarEditorOpen(false)}
        onUpdateUser={onUpdateUser}
      />
    </div>
  );
}