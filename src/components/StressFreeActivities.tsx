import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, BookOpen, Brain, Palette, Plus, Heart, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import type { User } from '../App';

interface StressFreeActivitiesProps {
  user: User;
  onBack: () => void;
  onFeedback: () => void;
  onNavigate: (screen: 'meditation' | 'drawing' | 'journaling') => void;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  frequency?: string;
  benefits: string[];
}

export function StressFreeActivities({ user, onBack, onFeedback, onNavigate }: StressFreeActivitiesProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showFlashCards, setShowFlashCards] = useState(false);

  const activities: Activity[] = [
    {
      id: 'journaling',
      title: 'Journaling',
      description: 'Express your thoughts and feelings through writing. A safe space for your inner voice.',
      icon: <BookOpen className="w-6 h-6 text-white" />,
      color: 'from-blue-500 to-blue-600',
      frequency: '10-15 minutes daily',
      benefits: [
        'Improves emotional clarity',
        'Reduces stress and anxiety',
        'Enhances self-awareness',
        'Processes difficult emotions'
      ]
    },
    {
      id: 'meditation',
      title: 'Meditation',
      description: 'Find peace through mindfulness and breathing exercises. Calm your mind and center yourself.',
      icon: <Brain className="w-6 h-6 text-white" />,
      color: 'from-purple-500 to-purple-600',
      frequency: '5-20 minutes, 2-3 times daily',
      benefits: [
        'Reduces anxiety and stress',
        'Improves focus and concentration',
        'Promotes emotional regulation',
        'Enhances overall well-being'
      ]
    },
    {
      id: 'drawing',
      title: 'Art Therapy',
      description: 'Express yourself through colors and creativity. Let your emotions flow onto paper.',
      icon: <Palette className="w-6 h-6 text-white" />,
      color: 'from-pink-500 to-rose-600',
      frequency: 'Whenever you feel inspired',
      benefits: [
        'Non-verbal emotional expression',
        'Reduces stress and tension',
        'Boosts self-esteem',
        'Provides therapeutic release'
      ]
    },
    {
      id: 'other',
      title: 'Other Activities',
      description: 'Have something else in mind? Share your ideas and help us personalize your experience.',
      icon: <Plus className="w-6 h-6 text-white" />,
      color: 'from-green-500 to-emerald-600',
      benefits: [
        'Personalized approach',
        'Your unique preferences',
        'Custom recommendations',
        'Tailored support'
      ]
    }
  ];

  const handleActivitySelect = (activity: Activity) => {
    if (activity.id === 'other') {
      onFeedback();
    } else {
      setSelectedActivity(activity);
      setShowFlashCards(true);
    }
  };

  const startActivity = (activityId: string) => {
    if (activityId === 'journaling') {
      onNavigate('journaling');
    } else if (activityId === 'meditation') {
      onNavigate('meditation');
    } else if (activityId === 'drawing') {
      onNavigate('drawing');
    }
    closeFlashCard();
  };

  const closeFlashCard = () => {
    setShowFlashCards(false);
    setSelectedActivity(null);
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
          <h1 className="text-xl text-foreground">Go Stress Free</h1>
          <p className="text-muted-foreground text-sm">Discover calming activities for your well-being</p>
        </div>
      </motion.div>

      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-none">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg text-gray-800 mb-2">Welcome, {user.petName}</h3>
              <p className="text-gray-700">
                Take a moment to breathe. Choose an activity that speaks to your heart today. 
                Remember, there's no right or wrong choice - only what feels good for you.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Activity Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 bg-white border-none shadow-sm"
              onClick={() => handleActivitySelect(activity)}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${activity.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg text-gray-800 mb-2">{activity.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                  {activity.frequency && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{activity.frequency}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {activity.benefits.slice(0, 2).map((benefit, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={`w-8 h-8 bg-gradient-to-br ${activity.color} bg-opacity-20 rounded-full flex items-center justify-center`}>
                  <span className="text-gray-600">→</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Flash Card Modal */}
      <AnimatePresence>
        {showFlashCards && selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={closeFlashCard}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="p-8 bg-white shadow-2xl">
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${selectedActivity.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {selectedActivity.icon}
                  </div>
                  <h2 className="text-2xl text-gray-800 mb-2">{selectedActivity.title}</h2>
                  <p className="text-gray-600">{selectedActivity.description}</p>
                </div>

                {selectedActivity.frequency && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm text-blue-800 mb-2">Recommended Frequency</h3>
                    <p className="text-blue-700">{selectedActivity.frequency}</p>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg text-gray-800 mb-3">Benefits</h3>
                  <div className="space-y-2">
                    {selectedActivity.benefits.map((benefit, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center space-x-2"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700 text-sm">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    className={`w-full bg-gradient-to-r ${selectedActivity.color} hover:opacity-90`}
                    onClick={() => startActivity(selectedActivity.id)}
                  >
                    Start {selectedActivity.title}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={closeFlashCard}
                  >
                    Maybe Later
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encouraging Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-12 text-center"
      >
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-none">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg text-gray-800">Remember</h3>
            <Sparkles className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-gray-700 text-sm">
            Self-care isn't selfish. Taking time for these activities is an investment in your mental health and overall well-being.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}