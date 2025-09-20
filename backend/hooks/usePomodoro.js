import { useEffect, useRef, useState } from "react";
import { savePomodoroSession } from "../utils/pomodoroLocal";

export default function usePomodoro(taskId, workMinutes = 25, shortBreak = 5, longBreak = 15) {
  const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      stopTimer();
      handleSessionComplete();
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  const startTimer = () => {
    if (!isRunning) {
      startTimeRef.current = new Date();
      setIsRunning(true);
    }
  };

  const stopTimer = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    if (startTimeRef.current) {
      const endedAt = new Date();
      const duration = Math.floor((endedAt - startTimeRef.current) / 1000);
      savePomodoroSession({ taskId, duration, startedAt: startTimeRef.current, endedAt });
      startTimeRef.current = null;
    }
  };

  const handleSessionComplete = () => {
    if (!isBreak) {
      setCompletedPomodoros(prev => prev + 1);
      setIsBreak(true);
      setTimeLeft(completedPomodoros % 4 === 3 ? longBreak * 60 : shortBreak * 60);
    } else {
      setIsBreak(false);
      setTimeLeft(workMinutes * 60);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workMinutes * 60);
    clearInterval(timerRef.current);
  };

  return { timeLeft, isRunning, isBreak, completedPomodoros, startTimer, stopTimer, resetTimer };
}
