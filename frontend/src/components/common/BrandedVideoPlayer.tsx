import './BrandedVideoPlayer.css';
import React, { useState, useRef, useEffect } from 'react';
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress,
  FaYoutube
} from 'react-icons/fa';
import theme from '../../config/theme';

interface BrandedVideoPlayerProps {
  url: string;
  videoId?: string;
  thumbnail?: string;
  title?: string;
  isYouTube?: boolean;
}

const YOUTUBE_PARAMS = "autoplay=1&rel=0&modestbranding=1&showinfo=0&fs=1&controls=1&disablekb=0&enablejsapi=1&playsinline=1&iv_load_policy=3&color=white&cc_load_policy=0&hl=en&autohide=1";

const BrandedVideoPlayer: React.FC<BrandedVideoPlayerProps> = ({
  url,
  videoId,
  thumbnail,
  title = 'Video',
  isYouTube = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showYouTubePlayer, setShowYouTubePlayer] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isYouTube]);

  const togglePlay = () => {
    if (!videoRef.current || isYouTube) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current || isYouTube) return;
    
    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleYouTubeClick = () => {
    setShowYouTubePlayer(true);
  };

  // For YouTube videos, show embedded player
  if (isYouTube && videoId) {
    if (showYouTubePlayer) {
      return (
        <div className="relative rounded-lg overflow-hidden bg-black max-w-full">
          <div className="relative aspect-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?${YOUTUBE_PARAMS}&origin=${window.location.origin}`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
          <div className="bg-gray-900 p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaYoutube className="text-red-600 text-xl" />
              <p className="text-white text-sm font-medium truncate">{title}</p>
            </div>
            <button
              onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
              className="text-gray-400 hover:text-white text-xs"
            >
              Open in YouTube
            </button>
          </div>
        </div>
      );
    }

    // Show thumbnail preview before playing
    return (
      <div className="relative rounded-lg overflow-hidden bg-black max-w-full">
        <div className="relative group cursor-pointer" onClick={handleYouTubeClick}>
          <img 
            src={thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            className="w-full h-auto"
            onError={(e) => {
              // Fallback to medium quality if maxresdefault doesn't exist
              e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all">
            <div className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform">
              <FaPlay className="text-white text-2xl ml-1" />
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <FaYoutube className="text-red-600 text-3xl drop-shadow-lg" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <p className="text-white text-sm font-medium truncate">{title}</p>
          </div>
        </div>
      </div>
    );
  }

  // For regular videos, show custom player
  return (
    <div 
      ref={containerRef}
      className="relative rounded-lg overflow-hidden bg-black max-w-full group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={url}
        className="w-full h-auto max-h-[500px]"
        onClick={togglePlay}
        playsInline
        preload="metadata"
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.colors.primary }}></div>
        </div>
      )}

      {/* Play button overlay when paused */}
      {!isPlaying && !isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="rounded-full p-4 transition-transform hover:scale-110" style={{ backgroundColor: theme.colors.primary }}>
            <FaPlay className="text-white text-2xl ml-1" />
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div className="px-4 pb-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="video-player-range w-full h-1 rounded-lg"
            style={{
              background: `linear-gradient(to right, ${theme.colors.primary} 0%, ${theme.colors.primary} ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`
            }}
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:opacity-80 transition-opacity"
            >
              {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
            </button>

            {/* Time display */}
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:opacity-80 transition-opacity"
              >
                {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="video-player-range w-20 h-1 rounded-lg"
                style={{
                  background: `linear-gradient(to right, ${theme.colors.primary} 0%, ${theme.colors.primary} ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) 100%)`
                }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Brand watermark */}
            <span className="text-white text-xs opacity-75 font-medium">Attendance Tracker</span>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:opacity-80 transition-opacity"
            >
              {isFullscreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandedVideoPlayer;
