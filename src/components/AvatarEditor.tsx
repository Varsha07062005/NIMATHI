import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Upload, User, Palette } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';
import type { User } from '../App';

interface AvatarEditorProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (user: User) => void;
}

export function AvatarEditor({ user, isOpen, onClose, onUpdateUser }: AvatarEditorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);

  // Predefined avatar options
  const avatarOptions = [
    { id: 'default', name: 'Default', url: '', icon: User },
    { id: 'cat', name: 'Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=face' },
    { id: 'dog', name: 'Dog', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=face' },
    { id: 'nature1', name: 'Sunset', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop' },
    { id: 'nature2', name: 'Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop' },
    { id: 'nature3', name: 'Ocean', url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=400&fit=crop' },
    { id: 'abstract1', name: 'Purple Gradient', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=400&fit=crop' },
    { id: 'abstract2', name: 'Blue Gradient', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' },
    { id: 'mandala1', name: 'Mandala', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop' },
  ];

  const handleSave = () => {
    const updatedUser = { ...user, avatar: selectedAvatar };
    onUpdateUser(updatedUser);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs mx-3 rounded-2xl max-h-[85vh] overflow-y-auto w-[calc(100vw-24px)]">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg text-foreground">Edit Avatar</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription className="text-sm text-muted-foreground text-left">
            Choose a new avatar from our gallery or upload your own image to personalize your profile.
          </DialogDescription>
        </DialogHeader>

        {/* Current Avatar Preview */}
        <motion.div 
          className="flex flex-col items-center mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Avatar className="w-20 h-20 border-2 border-border shadow-lg mb-3">
            <AvatarImage src={selectedAvatar} alt={user.petName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {user.petName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">Preview</p>
        </motion.div>

        {/* Upload Option */}
        <Card className="p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm text-foreground mb-1">Upload Custom Image</h4>
              <p className="text-xs text-muted-foreground">Choose from your device</p>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="mt-3 w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </Card>

        {/* Predefined Avatars */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <Palette className="w-4 h-4 text-primary" />
            <h4 className="text-sm text-foreground">Choose from Gallery</h4>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {avatarOptions.map((option) => (
              <motion.div
                key={option.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`cursor-pointer p-2 rounded-xl transition-all duration-200 ${
                  selectedAvatar === option.url 
                    ? 'bg-primary/10 border-2 border-primary' 
                    : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
                }`}
                onClick={() => setSelectedAvatar(option.url)}
              >
                <div className="flex flex-col items-center space-y-2">
                  {option.id === 'default' ? (
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-foreground" />
                    </div>
                  ) : (
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={option.url} alt={option.name} />
                      <AvatarFallback>{option.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <p className="text-xs text-center text-muted-foreground">{option.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}