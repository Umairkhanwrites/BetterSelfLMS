'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, FastForward, CheckCircle2 } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string;
  lessonId: string;
  onEnded: () => void;
  onTimeUpdate?: (seconds: number) => void;
  getCurrentTimeRef?: React.MutableRefObject<(() => number) | null>;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

export default function YouTubePlayer({
  videoId,
  lessonId,
  onEnded,
  getCurrentTimeRef
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    // Expose getCurrentTime to parent component for timestamped notes
    if (getCurrentTimeRef) {
      getCurrentTimeRef.current = () => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          return Math.floor(playerRef.current.getCurrentTime());
        }
        return 0;
      };
    }
  }, [getCurrentTimeRef]);

  useEffect(() => {
    // Reset countdown when videoId changes
    setCountdown(null);

    // Load YouTube IFrame API script if not present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player('yt-player-container', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED is 0
            if (event.data === 0) {
              handleVideoEnd();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [videoId, lessonId]);

  const handleVideoEnd = () => {
    // Trigger 5-second countdown overlay (SEC-08)
    let remaining = 5;
    setCountdown(remaining);

    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        setCountdown(null);
        onEnded();
      } else {
        setCountdown(remaining);
      }
    }, 1000);
  };

  const handleSkipCountdown = () => {
    setCountdown(null);
    onEnded();
  };

  const handleReplay = () => {
    setCountdown(null);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();
    }
  };

  return (
    <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Target DOM Element for YouTube Player */}
      <div id="yt-player-container" className="w-full h-full" />

      {/* Top Click-Shield (SEC-08): 60px transparent overlay prevents clicking YouTube title/Share/Watch Later */}
      <div
        className="absolute top-0 left-0 right-0 h-[60px] z-10 bg-transparent select-none cursor-default"
        title="BetterSelf Shielded Player"
      />

      {/* 5-Second Countdown Auto-Play Overlay (SEC-08) */}
      {countdown !== null && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full border-4 border-teal-500 border-t-transparent animate-spin mb-4 flex items-center justify-center">
            <span className="text-xl font-bold font-mono">{countdown}</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-1">Lesson Completed!</h3>
          <p className="text-slate-300 text-sm mb-6">
            Auto-playing next lesson in <strong className="text-teal-400 font-mono text-base">{countdown}s</strong>...
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReplay}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Replay Lesson
            </button>
            <button
              onClick={handleSkipCountdown}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white shadow-lg shadow-teal-900/30 transition-colors"
            >
              <FastForward className="w-4 h-4" />
              Play Next Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
