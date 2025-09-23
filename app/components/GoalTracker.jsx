'use client';
import React, { useState, useEffect } from 'react';

function getLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function setLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

export default function GoalPracticeTracker() {
  const [subjects, setSubjects] = useState(() => getLocal('goal-tracker-subjects', ['Discrete M.', 'Maths', 'Physics']));
  const [newSubject, setNewSubject] = useState('');
  const [editSubjectIdx, setEditSubjectIdx] = useState(-1);

  const [totalGoal, setTotalGoal] = useState(() => getLocal('goal-tracker-total', 10000));
  const [goalInput, setGoalInput] = useState(totalGoal);
  const [current, setCurrent] = useState(0);

  const [logs, setLogs] = useState(() => getLocal('goal-tracker-logs', []));
  const [inputQuestions, setInputQuestions] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [inputDay, setInputDay] = useState('');

  const MOTIVATION = [
    "I will make it happen.",
    "Consistent practice leads to mastery.",
    "Believe in yourself—keep going!",
    "The journey is progress itself.",
    "You are closer than you think.",
  ];
  const [motivation, setMotivation] = useState(MOTIVATION[0]);

  const [editLogIdx, setEditLogIdx] = useState(-1);
  const [editLogData, setEditLogData] = useState({day: '', questions: '', subject: ''});

  useEffect(() => { setLocal('goal-tracker-subjects', subjects); }, [subjects]);
  useEffect(() => { setLocal('goal-tracker-total', totalGoal); }, [totalGoal]);
  useEffect(() => { setLocal('goal-tracker-logs', logs); }, [logs]);

  useEffect(() => {
    setCurrent(logs.reduce((acc, log) => acc + log.questions, 0));
    setMotivation(MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)]);
  }, [logs, MOTIVATION]);

  const percentComplete = totalGoal > 0 ? (current / totalGoal) * 100 : 0;

  // Subject management
  function handleAddSubject() {
    if (!newSubject.trim() || subjects.includes(newSubject.trim())) return;
    setSubjects([...subjects, newSubject.trim()]);
    setNewSubject('');
  }
  function handleEditSubject(idx) {
    setEditSubjectIdx(idx);
    setNewSubject(subjects[idx]);
  }
  function handleSaveSubject(idx) {
    if (!newSubject.trim()) return;
    setSubjects(subjects.map((sub, i) => i === idx ? newSubject.trim() : sub));
    setEditSubjectIdx(-1);
    if (selectedSubject === subjects[idx]) setSelectedSubject(newSubject.trim());
    setNewSubject('');
  }
  function handleDeleteSubject(idx) {
    const updated = subjects.filter((_, i) => i !== idx);
    setSubjects(updated);
    if (selectedSubject === subjects[idx]) setSelectedSubject(updated[0] || '');
  }

  // Total goal
  function handleSaveGoal() {
    const val = Number(goalInput);
    if (isNaN(val) || val < 1) return;
    setTotalGoal(val);
  }

  // Logs
  function handleAddLog() {
    const q = parseInt(inputQuestions);
    if (!q || q <= 0 || !selectedSubject || !inputDay.trim()) return;
    const day = inputDay.trim();
    setLogs([...logs, { day, subject: selectedSubject, questions: q, date: new Date().toISOString() }]);
    setInputQuestions('');
    setInputDay('');
  }
  function handleStartEditLog(idx) {
    setEditLogIdx(idx);
    setEditLogData({ day: logs[idx].day, questions: logs[idx].questions, subject: logs[idx].subject });
  }
  function handleSaveEditLog(idx) {
    const q = parseInt(editLogData.questions);
    if (!editLogData.day.trim() || !q || q < 1 || !editLogData.subject) return;
    const updated = [...logs];
    updated[idx] = { ...updated[idx], day: editLogData.day.trim(), questions: q, subject: editLogData.subject };
    setLogs(updated);
    setEditLogIdx(-1);
    setEditLogData({ day: '', questions: '', subject: '' });
  }
  function handleDeleteLog(idx) {
    setLogs(logs.filter((_, i) => i !== idx));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-xl">
        <h2 className="text-3xl font-bold text-blue-900 text-center mb-3">
          Question Practice Tracker
        </h2>
        <p className="text-blue-700 text-center mb-4">{motivation}</p>

        <div className="flex flex-col items-center justify-center mb-4">
          <div className="text-blue-800 text-5xl font-extrabold">{current}</div>
          <div className="text-blue-600 text-2xl font-bold">/ {totalGoal.toLocaleString()}</div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              className="bg-white border border-blue-300 rounded px-3 py-1 w-20 text-center text-blue-900"
              min={1}
            />
            <button
              className="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800"
              onClick={handleSaveGoal}
            >
              Set Goal
            </button>
          </div>
        </div>

        <div className="w-full h-4 bg-blue-100 rounded-full mb-1 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
        <div className="text-center text-blue-700 mb-4 font-semibold">
          {percentComplete.toFixed(2)}% Complete
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center justify-center">
          <input
            type="text"
            placeholder="Day / Label"
            className="bg-white border border-blue-300 rounded-md px-3 py-2 w-full sm:w-1/3 text-lg text-blue-900"
            value={inputDay}
            onChange={e => setInputDay(e.target.value)}
          />
          <input
            type="number"
            min={1}
            placeholder="Questions Solved"
            className="bg-white border border-blue-300 rounded-md px-3 py-2 w-full sm:w-1/3 text-lg text-blue-900"
            value={inputQuestions}
            onChange={e => setInputQuestions(e.target.value)}
          />
          <select
            className="bg-white border border-blue-500 rounded-md px-3 py-2 w-full sm:w-1/3 text-lg text-blue-900"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          >
            {subjects.map((sub, idx) => (
              editSubjectIdx === idx ? 
                <option value={sub} key={sub}>{newSubject}</option>
              : <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
        <button
          className="w-full py-3 mt-1 mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition"
          onClick={handleAddLog}
        >
          Add Log Entry
        </button>

        <div className="mb-6">
          <h4 className="text-lg font-bold text-blue-900 mb-2">Subjects:</h4>
          <div className="flex flex-wrap gap-2 items-center">
            {subjects.map((sub, idx) => (
              <span key={sub} className="flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {editSubjectIdx === idx ? (
                  <>
                    <input value={newSubject} onChange={e => setNewSubject(e.target.value)}
                      className="bg-white text-blue-900 px-2 py-1 rounded w-24 border border-blue-300"/>
                    <button onClick={() => handleSaveSubject(idx)}
                      className="ml-1 text-green-600 font-bold">✔</button>
                    <button onClick={() => { setEditSubjectIdx(-1); setNewSubject(''); }}
                      className="ml-1 text-red-600 font-bold">✘</button>
                  </>
                ) : (
                  <>
                    {sub}
                    <button onClick={() => handleEditSubject(idx)}
                      className="ml-1 text-blue-800 hover:text-blue-600">Edit</button>
                    <button onClick={() => handleDeleteSubject(idx)}
                      className="ml-1 text-red-600 hover:text-red-400">Remove</button>
                  </>
                )}
              </span>
            ))}
            <input
              placeholder="Add subject"
              value={editSubjectIdx === -1 ? newSubject : ''}
              onChange={e => setNewSubject(e.target.value)}
              className="bg-white text-blue-900 px-2 py-1 rounded w-24 border border-blue-300"
            />
            <button
              className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              onClick={handleAddSubject}
              disabled={newSubject.trim() === '' || subjects.includes(newSubject.trim())}
            >Add</button>
          </div>
        </div>

        <h3 className="text-xl font-bold text-blue-900 mb-4">Practice History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left rounded-lg border border-blue-200">
            <thead>
              <tr className="text-blue-700 bg-blue-100">
                <th className="px-3 py-2 border-r border-blue-300">Day/Label</th>
                <th className="px-3 py-2 border-r border-blue-300">Subject</th>
                <th className="px-3 py-2 border-r border-blue-300">Questions</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-blue-400 py-4">
                    No entries yet.
                  </td>
                </tr>
              )}
              {logs.map((log, idx) => (
                editLogIdx === idx ? (
                  <tr key={idx} className="border-b border-blue-200 text-blue-900 bg-blue-50">
                    <td className="px-3 py-2 border-r border-blue-300">
                      <input
                        type="text"
                        className="bg-white text-blue-900 border border-blue-400 rounded px-2 py-1 w-full"
                        value={editLogData.day}
                        onChange={e => setEditLogData(d => ({...d, day: e.target.value}))}
                      />
                    </td>
                    <td className="px-3 py-2 border-r border-blue-300">
                      <select
                        className="bg-white text-blue-900 border border-blue-400 rounded px-2 py-1 w-full"
                        value={editLogData.subject}
                        onChange={e => setEditLogData(d => ({...d, subject: e.target.value}))}
                      >
                        {subjects.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 border-r border-blue-300">
                      <input
                        type="number"
                        className="bg-white text-blue-900 border border-blue-400 rounded px-2 py-1 w-full"
                        value={editLogData.questions}
                        onChange={e => setEditLogData(d => ({...d, questions: e.target.value}))}
                      />
                    </td>
                    <td className="px-3 py-2 flex gap-1">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" onClick={() => handleSaveEditLog(idx)}>Save</button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700" onClick={() => setEditLogIdx(-1)}>Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={idx} className="border-b border-blue-200 text-blue-900">
                    <td className="px-3 py-2 border-r border-blue-300">{log.day}</td>
                    <td className="px-3 py-2 border-r border-blue-300">{log.subject}</td>
                    <td className="px-3 py-2 border-r border-blue-300">{log.questions}</td>
                    <td className="px-3 py-2 flex gap-1">
                      <button className="bg-blue-600 text-white font-semibold px-3 py-1 rounded hover:bg-blue-700" onClick={() => handleStartEditLog(idx)}>Edit</button>
                      <button className="bg-red-600 text-white font-semibold px-3 py-1 rounded hover:bg-red-700" onClick={() => handleDeleteLog(idx)}>Delete</button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
