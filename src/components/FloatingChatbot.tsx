import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Replace 'ui' components with your actual library imports.
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import type { User as UserType } from '../App';

// IMPORTANT: Never hardcode API keys in production. Use environment variables.
const API_KEY = 'AIzaSyBp5s3VLZnwlNoVhqC6NDzLyPTmBWMlaHk'; 

// Define the shape of a chat message.
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface FloatingChatbotProps {
  user: UserType;
}

export function FloatingChatbot({ user }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello ${user.petName}! I'm Nimmadhi, your wellness companion. I'm here to support you on your mental health journey. How can I help you today? 🌟`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  // Initialize the chat session with Gemini AI.
  useEffect(() => {
    async function initializeChat() {
      try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          systemInstruction: `You are a friendly, warm, slightly humorous, and empathetic mental-health support chatbot for college students called 'Nimmadhi'. Your tone should be encouraging, kind, and safe. Add gentle humor as appropriate to lighten mood but never make fun of user's feelings. When the user is negative or hopeless, reframe gently into hope and small actionable steps. Use positive reframes, remind about past wins, and propose a tiny doable activity. Always check for crisis language and advise immediate help / escalation if needed. Provide helpline and offer to connect to a human counselor when crisis detected. Do NOT provide medical diagnoses. Use supportive coaching and suggest to seek professional help when necessary.`
        });
        
        chatRef.current = model.startChat();
        console.log("Gemini chat session initialized.");
      } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
      }
    }
    initializeChat();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatRef.current) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const result = await chatRef.current.sendMessage(userMessage.text);
      const botReply = await result.response.text();

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: botReply,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error('Gemini API error details:', error);
      
      const message = userMessage.text.toLowerCase();
      let fallbackText = "I'm having some technical difficulties right now, but I'm still here for you! 😊 Your feelings are completely valid.";

      if (message.includes('hurt myself') || message.includes('suicide') || message.includes('end it all')) {
        fallbackText = "I'm really concerned about you right now. Please reach out for immediate help: Call 988 (Suicide & Crisis Lifeline) or text 'HELLO' to 741741. Your life has value, and there are people trained to help. 💙";
      } else if (message.includes('anxious') || message.includes('anxiety')) {
        fallbackText = "I hear you're feeling anxious - that's really tough. While I'm having some tech troubles, I want you to know those feelings are valid. You've got this! 🌟";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: fallbackText,
        sender: 'bot',
        timestamp: new Date()
      }]);

    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-4 right-4 z-50 safe-area-bottom"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-300"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {/* Chat Interface - Fixed Small Size */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-3 w-[calc(100vw-24px)] max-w-sm z-40 safe-area-bottom"
            style={{ height: '350px' }}
          >
            <div className="h-full bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
              {/* Header - Fixed Height */}
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg px-4 py-3 flex items-center space-x-3"
                style={{ height: '60px', minHeight: '60px' }}
              >
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Wellness Assistant</h3>
                  <p className="text-xs opacity-80">Always here for you</p>
                </div>
              </div>

              {/* Messages Area - Scrollable */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 p-3 overflow-y-auto bg-gray-50"
                style={{ 
                  height: 'calc(350px - 60px - 70px)', 
                  minHeight: '220px',
                  maxHeight: '220px'
                }}
              >
                <div className="space-y-3">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`p-3 rounded-lg text-sm break-words ${
                            message.sender === 'user'
                              ? 'bg-blue-500 text-white rounded-br-sm'
                              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border'
                          }`}
                        >
                          {message.text}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 px-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                        message.sender === 'user' 
                          ? 'bg-blue-500 text-white order-1 ml-2' 
                          : 'bg-gray-200 text-gray-600 order-2 mr-2'
                      }`}>
                        {message.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3 h-3 text-gray-600" />
                        </div>
                        <div className="bg-white p-3 rounded-lg rounded-bl-sm shadow-sm border">
                          <div className="flex space-x-1">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                              className="w-2 h-2 bg-gray-400 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Input Area - Fixed at Bottom */}
              <div 
                className="px-3 py-3 bg-white border-t rounded-b-lg"
                style={{ height: '70px', minHeight: '70px' }}
              >
                <div className="flex space-x-2 items-center h-full">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 text-sm h-10"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-10 px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
