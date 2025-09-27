import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw, Music, Clock, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Progress } from "./ui/progress";
import { Card, CardContent } from "./ui/card";

interface MeditationScreenProps {
  onBack: () => void; // parent-controlled back
}

// Tracks (make sure these files exist in /public/audio/)
const tracks = [
  { id: 1, name: "Morning Calm", url: "/audio/morning1.mp3" },
  { id: 2, name: "Evening Peace", url: "/audio/evening1.mp3" },
  { id: 3, name: "Deep Focus", url: "/audio/focus1.mp3" },
];

export function MeditationScreen({ onBack }: MeditationScreenProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(5 * 60); // default 5 minutes
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState(tracks[0]);
  const [customTimer, setCustomTimer] = useState([5]);
  const [volume, setVolume] = useState([50]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Format seconds into mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Start meditation
  const startMeditation = () => {
    if (!selectedTrack) return;

    setIsPlaying(true);
    setDuration(customTimer[0] * 60);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume[0] / 100;
      audioRef.current.play();
    }

    intervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration - 1) {
          stopMeditation();
          completeMeditation();
          return duration;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Stop meditation
  const stopMeditation = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) audioRef.current.pause();
  };

  // Reset meditation
  const resetMeditation = () => {
    stopMeditation();
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  // Meditation completed
  const completeMeditation = () => {
    alert("Meditation Completed! 🌿");
  };

  // Update audio element when track changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = selectedTrack?.url || "";
      if (isPlaying) audioRef.current.play();
    }
    setCurrentTime(0); // reset timer when track changes
  }, [selectedTrack]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white flex flex-col items-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Sticky Header with Back Button */}
      <div className="w-full max-w-lg mb-4 flex items-center sticky top-0 bg-black/30 backdrop-blur-lg z-10 p-3 rounded-xl">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </Button>
        <h1 className="text-xl font-bold ml-4">Guided Meditation</h1>
      </div>

      <Card className="w-full max-w-lg bg-black/30 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
        <CardContent className="p-6 flex flex-col items-center space-y-6">
          {/* Track Selection */}
          <div className="w-full">
            <label className="block mb-2">Select Track:</label>
            <div className="space-y-2">
              {tracks.map((track) => (
                <Button
                  key={track.id}
                  variant={selectedTrack?.id === track.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedTrack(track)}
                >
                  <Music className="mr-2 h-4 w-4" /> {track.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Timer Customization */}
          <div className="w-full">
            <label className="block mb-2">Set Duration (minutes):</label>
            <Slider
              value={customTimer}
              onValueChange={(val) => setCustomTimer(val)}
              max={60}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-sm mt-2">{customTimer[0]} minutes</p>
          </div>

          {/* Volume Control */}
          <div className="w-full">
            <label className="block mb-2">Volume:</label>
            <Slider
              value={volume}
              onValueChange={(val) => {
                setVolume(val);
                if (audioRef.current) audioRef.current.volume = val[0] / 100;
              }}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
            <p className="text-sm mt-2">{volume[0]}%</p>
          </div>

          {/* Timer and Progress */}
          <div className="w-full text-center">
            <div className="flex justify-center items-center space-x-2 mb-2">
              <Clock className="h-5 w-5" />
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <Progress value={(currentTime / duration) * 100} className="h-2" />
          </div>

          {/* Controls */}
          <div className="flex space-x-4">
            <Button
              size="lg"
              className="rounded-full"
              onClick={isPlaying ? stopMeditation : startMeditation}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button size="lg" className="rounded-full" onClick={resetMeditation}>
              <RotateCcw className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={selectedTrack?.url || ""} preload="auto" />
    </motion.div>
  );
}
