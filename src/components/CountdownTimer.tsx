"use client";

import { useEffect, useState } from "react";

const REVEAL_DATE = new Date("2026-12-31T23:59:59").getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeLeft(): TimeLeft {
  const now = Date.now();
  const diff = REVEAL_DATE - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const format = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="font-pixel text-2xl sm:text-3xl md:text-4xl text-center text-pink-400 neon-text tracking-widest animate-pulse-glow">
      [
      {" "}
      <span className="text-white">{format(timeLeft.days)}</span>
      <span className="text-pink-400">d</span>
      {" : "}
      <span className="text-white">{format(timeLeft.hours)}</span>
      <span className="text-pink-400">h</span>
      {" : "}
      <span className="text-white">{format(timeLeft.minutes)}</span>
      <span className="text-pink-400">m</span>
      {" : "}
      <span className="text-white">{format(timeLeft.seconds)}</span>
      <span className="text-pink-400">s</span>
      {" "}
      ]
    </div>
  );
}