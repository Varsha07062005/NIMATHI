import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Send, Heart, Star, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from 'sonner@2.0.3';
import { api } from '../utils/supabase/client';
import type { User } from '../App';

interface FeedbackFormProps {
  user: User;
  onBack: () => void;
}

export function FeedbackForm({ user, onBack }: FeedbackFormProps) {
  const [formData, setFormData] = useState({
    activityName: '',
    activityDescription: '',
    why: '',
    frequency: '',
    appFeedback: '',
    rating: '',
    additionalSuggestions: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.activityName.trim() || !formData.why.trim()) {
      toast.error('Please fill in the required fields');
      return;
    }

    // Here you would typically send the data to your backend or chatbot
    console.log('Feedback submitted:', formData);
    
    toast.success('Thank you for your feedback! We\'ll use this to improve your experience.');
    
    // Reset form
    setFormData({
      activityName: '',
      activityDescription: '',
      why: '',
      frequency: '',
      appFeedback: '',
      rating: '',
      additionalSuggestions: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      {/* Header */}
      <motion.div 
        className="flex items-center mb-8 pt-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button variant="ghost" onClick={onBack} className="mr-4 p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl text-gray-800">Your Ideas Matter</h1>
          <p className="text-gray-600">Help us personalize your wellness journey</p>
        </div>
      </motion.div>

      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-none">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg text-gray-800 mb-2">Hi {user.petName},</h3>
              <p className="text-gray-700">
                We'd love to hear about activities that bring you peace and joy. Your input helps us create a more personalized experience for you and others on their wellness journey.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Feedback Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 bg-white shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Custom Activity Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg text-gray-800">Tell us about your activity</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="activityName">What activity would you like to add? *</Label>
                <Input
                  id="activityName"
                  value={formData.activityName}
                  onChange={(e) => handleInputChange('activityName', e.target.value)}
                  placeholder="e.g., Gardening, Walking in nature, Listening to music..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityDescription">How would you describe this activity?</Label>
                <Textarea
                  id="activityDescription"
                  value={formData.activityDescription}
                  onChange={(e) => handleInputChange('activityDescription', e.target.value)}
                  placeholder="Describe what this activity involves and how it makes you feel..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="why">Why is this activity meaningful to you? *</Label>
                <Textarea
                  id="why"
                  value={formData.why}
                  onChange={(e) => handleInputChange('why', e.target.value)}
                  placeholder="Share what makes this activity special for your mental health..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">How often do you do this activity?</Label>
                <Input
                  id="frequency"
                  value={formData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  placeholder="e.g., Daily, Weekly, When I need to relax..."
                />
              </div>
            </div>

            {/* App Feedback Section */}
            <div className="border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <Star className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg text-gray-800">App Feedback</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>How would you rate your experience with Nimathi so far?</Label>
                  <RadioGroup 
                    value={formData.rating} 
                    onValueChange={(value) => handleInputChange('rating', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excellent" id="excellent" />
                      <Label htmlFor="excellent">Excellent - It's exactly what I needed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="good" id="good" />
                      <Label htmlFor="good">Good - It's helpful for my wellness</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="okay" id="okay" />
                      <Label htmlFor="okay">Okay - It has potential</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="needs-improvement" id="needs-improvement" />
                      <Label htmlFor="needs-improvement">Needs improvement</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appFeedback">What do you like most about Nimathi?</Label>
                  <Textarea
                    id="appFeedback"
                    value={formData.appFeedback}
                    onChange={(e) => handleInputChange('appFeedback', e.target.value)}
                    placeholder="Share what you appreciate about the app..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalSuggestions">Any other suggestions or ideas?</Label>
                  <Textarea
                    id="additionalSuggestions"
                    value={formData.additionalSuggestions}
                    onChange={(e) => handleInputChange('additionalSuggestions', e.target.value)}
                    placeholder="We'd love to hear your ideas for making Nimathi even better..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                size="lg"
              >
                <Send className="w-5 h-5 mr-2" />
                Submit Feedback
              </Button>
            </motion.div>
          </form>
        </Card>
      </motion.div>

      {/* Encouraging Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-none">
          <p className="text-gray-700 text-sm">
            Thank you for helping us create a more supportive and personalized mental health experience. 
            Your voice makes a difference! 💙
          </p>
        </Card>
      </motion.div>
    </div>
  );
}