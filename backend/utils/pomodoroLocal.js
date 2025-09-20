// utils/pomodoroLocal.js

// Get saved sessions from localStorage
export function getPomodoroSessions() {
  const data = localStorage.getItem("pomodoro_sessions");
  return data ? JSON.parse(data) : [];
}

// Save a new session
export function savePomodoroSession(session) {
  const sessions = getPomodoroSessions();
  sessions.push(session);
  localStorage.setItem("pomodoro_sessions", JSON.stringify(sessions));
}

// Get total worked time for a task (in seconds)
export function getWorkedSeconds(taskId) {
  return getPomodoroSessions()
    .filter(s => s.taskId === taskId)
    .reduce((total, s) => total + s.duration, 0);
}

// Clear all sessions (useful after syncing with backend)
export function clearPomodoroSessions() {
  localStorage.removeItem("pomodoro_sessions");
}
