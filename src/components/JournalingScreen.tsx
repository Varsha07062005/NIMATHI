import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Download, FileText, Calendar, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { api } from '../utils/supabase/client';
import type { User } from '../App';

interface JournalingScreenProps {
  user: User;
  onBack: () => void;
  onUpdateUser: (user: User) => void;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'difficult' | 'struggling';
  tags: string[];
  wordCount: number;
}

export function JournalingScreen({ user, onBack, onUpdateUser }: JournalingScreenProps) {
  const [currentEntry, setCurrentEntry] = useState<JournalEntry>({
    id: '',
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    mood: 'okay',
    tags: [],
    wordCount: 0
  });
  const [previousEntries, setPreviousEntries] = useState<JournalEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const moodOptions = [
    { value: 'great', label: 'Great', emoji: '😊', color: 'bg-green-100 text-green-800' },
    { value: 'good', label: 'Good', emoji: '🙂', color: 'bg-blue-100 text-blue-800' },
    { value: 'okay', label: 'Okay', emoji: '😐', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'difficult', label: 'Difficult', emoji: '😔', color: 'bg-orange-100 text-orange-800' },
    { value: 'struggling', label: 'Struggling', emoji: '😢', color: 'bg-red-100 text-red-800' }
  ];

  const journalPrompts = [
    "What am I grateful for today?",
    "How am I feeling right now and why?",
    "What challenged me today and how did I handle it?",
    "What made me smile today?",
    "What would I like to improve about tomorrow?",
    "What am I proud of myself for?",
    "What emotions did I experience today?",
    "What helped me feel calm or peaceful today?",
    "What's on my mind that I need to process?",
    "How did I show kindness to myself or others today?"
  ];

  useEffect(() => {
    // Load previous entries from backend and localStorage
    const loadEntries = async () => {
      try {
        const sessionData = localStorage.getItem('nimathi-session');
        if (sessionData) {
          const { accessToken } = JSON.parse(sessionData);
          const response = await api.getJournalEntries(user.id, accessToken);
          
          if (response.entries && !response.error) {
            const backendEntries = response.entries.map((entry: any) => ({
              id: entry.id,
              title: entry.title,
              content: entry.content,
              date: entry.createdAt,
              mood: entry.mood || 'okay',
              tags: entry.tags || [],
              wordCount: entry.wordCount || 0
            }));
            setPreviousEntries(backendEntries);
            
            // Update local backup
            localStorage.setItem('nimathi-journal-entries', JSON.stringify(backendEntries));
          }
        } else {
          // Fallback to localStorage if no session
          const stored = localStorage.getItem('nimathi-journal-entries');
          if (stored) {
            setPreviousEntries(JSON.parse(stored));
          }
        }
      } catch (error) {
        console.error('Error loading journal entries:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem('nimathi-journal-entries');
        if (stored) {
          setPreviousEntries(JSON.parse(stored));
        }
      }
    };

    loadEntries();

    // Generate new entry ID
    setCurrentEntry(prev => ({
      ...prev,
      id: `entry-${Date.now()}`
    }));
  }, [user.id]);

  useEffect(() => {
    // Update word count
    const words = currentEntry.content.trim().split(/\s+/).filter(word => word.length > 0);
    setCurrentEntry(prev => ({
      ...prev,
      wordCount: currentEntry.content.trim() === '' ? 0 : words.length
    }));

    // Auto-save every 30 seconds while typing
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    if (currentEntry.content.length > 50) {
      const timeout = setTimeout(() => {
        autoSave();
      }, 30000);
      setAutoSaveTimeout(timeout);
    }

    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [currentEntry.content]);

  const autoSave = () => {
    if (currentEntry.content.trim().length > 20) {
      const draftKey = `nimathi-journal-draft-${user.id}`;
      localStorage.setItem(draftKey, JSON.stringify(currentEntry));
      toast.success('Draft auto-saved', { duration: 2000 });
    }
  };

  const saveEntry = async () => {
    if (!currentEntry.title.trim() || !currentEntry.content.trim()) {
      toast.error('Please add a title and write something in your journal');
      return;
    }

    try {
      const sessionData = localStorage.getItem('nimathi-session');
      if (!sessionData) {
        toast.error('Please log in to save entries');
        return;
      }

      const { accessToken } = JSON.parse(sessionData);

      const entryToSave = {
        ...currentEntry,
        id: `entry-${Date.now()}`,
        date: new Date().toISOString()
      };

      // Save to backend
      const response = await api.createJournalEntry(user.id, {
        title: entryToSave.title,
        content: entryToSave.content,
        mood: entryToSave.mood,
        tags: entryToSave.tags,
        wordCount: entryToSave.wordCount,
        date: entryToSave.date
      }, accessToken);

      if (response.error) {
        toast.error('Failed to save journal entry');
        return;
      }

      // Update local state
      const updatedEntries = [...previousEntries, entryToSave];
      setPreviousEntries(updatedEntries);
      
      // Keep local backup
      localStorage.setItem('nimathi-journal-entries', JSON.stringify(updatedEntries));

      // Record activity for reward points
      await api.recordActivity(user.id, {
        type: 'journaling',
        duration: Math.max(5, Math.floor(currentEntry.wordCount / 50)), // Estimate minutes based on word count
        details: {
          wordCount: currentEntry.wordCount,
          mood: currentEntry.mood,
          title: entryToSave.title
        }
      }, accessToken);

      // Award reward points based on word count
      const points = Math.min(20, Math.floor(currentEntry.wordCount / 25) + 5);
      const updatedUser = {
        ...user,
        rewardPoints: user.rewardPoints + points
      };

      onUpdateUser(updatedUser);

      // Clear draft
      const draftKey = `nimathi-journal-draft-${user.id}`;
      localStorage.removeItem(draftKey);

      toast.success(`Journal entry saved! You earned ${points} reward points! 📝`);

      // Reset form
      setCurrentEntry({
        id: '',
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        mood: 'okay',
        tags: [],
        wordCount: 0
      });

    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save journal entry. Please try again.');
    }
  };

  const exportEntry = () => {
    const entryText = `${currentEntry.title}\n${new Date().toLocaleDateString()}\nMood: ${currentEntry.mood}\n\n${currentEntry.content}`;
    const blob = new Blob([entryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-${currentEntry.date}.txt`;
    link.click();
  };

  const insertPrompt = (prompt: string) => {
    const newContent = currentEntry.content + (currentEntry.content ? '\n\n' : '') + prompt + '\n\n';
    setCurrentEntry(prev => ({
      ...prev,
      content: newContent
    }));
  };

  const selectedMood = moodOptions.find(mood => mood.value === currentEntry.mood);

  return (
    <div className="min-h-screen bg-background">
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
            <h1 className="text-xl text-foreground">Journal</h1>
            <p className="text-sm text-muted-foreground">Your safe space, {user.petName}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportEntry} size="sm" disabled={!currentEntry.content.trim()}>
            <Download className="w-4 h-4" />
          </Button>
          <Button onClick={saveEntry} size="sm" disabled={!currentEntry.title.trim() || !currentEntry.content.trim()}>
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      <div className="p-4 pb-20 space-y-6">
        {/* Entry Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Entry Title</label>
                <Input
                  value={currentEntry.title}
                  onChange={(e) => setCurrentEntry(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What's on your mind today?"
                  className="text-lg"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>{currentEntry.wordCount} words</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">How are you feeling?</label>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map((mood) => (
                    <Button
                      key={mood.value}
                      variant={currentEntry.mood === mood.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentEntry(prev => ({ ...prev, mood: mood.value as any }))}
                      className={currentEntry.mood === mood.value ? mood.color : ''}
                    >
                      <span className="mr-2">{mood.emoji}</span>
                      {mood.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Writing Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4">
            <h3 className="text-base mb-3 text-foreground">💭 Need inspiration?</h3>
            <div className="grid grid-cols-1 gap-2">
              {journalPrompts.slice(0, 3).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => insertPrompt(prompt)}
                  className="text-left p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Main Writing Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4">
            <Textarea
              value={currentEntry.content}
              onChange={(e) => setCurrentEntry(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Start writing your thoughts, feelings, or anything that comes to mind..."
              className="min-h-[400px] text-base leading-relaxed resize-none border-none shadow-none focus-visible:ring-0 p-0"
              style={{ fontSize: '16px' }} // Prevent zoom on iOS
            />
          </Card>
        </motion.div>

        {/* Recent Entries Preview */}
        {previousEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-4">
              <h3 className="text-base mb-3 text-foreground">Recent Entries</h3>
              <div className="space-y-3">
                {previousEntries.slice(-3).reverse().map((entry) => {
                  const entryMood = moodOptions.find(m => m.value === entry.mood);
                  return (
                    <div key={entry.id} className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm truncate pr-2">{entry.title}</h4>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {entryMood && (
                            <Badge variant="secondary" className={`text-xs ${entryMood.color}`}>
                              {entryMood.emoji} {entryMood.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                        <span>{entry.wordCount} words</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-4 bg-muted/50">
            <h3 className="text-sm mb-3 text-foreground">✨ Journaling Tips</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>• Write freely without worrying about grammar or structure</p>
              <p>• Be honest with yourself - this is your safe space</p>
              <p>• Try to write regularly, even if it's just a few sentences</p>
              <p>• Use prompts when you're not sure what to write about</p>
              <p>• Your entries are automatically saved as drafts while you write</p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}