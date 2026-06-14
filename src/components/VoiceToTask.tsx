import { useState, useRef } from 'react'
import { useTaskStore } from '../stores/useTaskStore'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface VoiceToTaskProps {
  onTaskCreated?: () => void
}

export default function VoiceToTask({ onTaskCreated }: VoiceToTaskProps) {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const recognitionRef = useRef<any>(null)
  const addTask = useTaskStore(s => s.addTask)

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Browser tidak mendukung speech recognition')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'id-ID'
    recognition.continuous = false
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      setTranscript(result[0].transcript)
      if (result.isFinal) {
        setRecording(false)
      }
    }
    recognition.onend = () => setRecording(false)
    recognition.onerror = () => setRecording(false)
    recognition.start()
    setRecording(true)
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  const createTask = async () => {
    if (!transcript.trim()) return
    setLoading(true)
    try {
      const timeMatch = transcript.match(/(\d{1,2})[.:](\d{2})/)
      const time = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '09:00'
      const session = parseInt(time.split(':')[0]) < 12 ? 'pagi' : parseInt(time.split(':')[0]) < 17 ? 'siang' : 'malam'
      await addTask({
        title: transcript.replace(/\d{1,2}[.:]\d{2}/g, '').trim() || transcript,
        time,
        session: session as any,
      })
      setTranscript('')
      onTaskCreated?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-primary-500" />
        <p className="text-sm font-medium text-gray-900 dark:text-white">Input Suara</p>
      </div>
      {transcript && (
        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-dark-card rounded-xl p-3">{transcript}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
            recording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
        >
          {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {recording ? 'Berhenti' : 'Mulai Bicara'}
        </button>
        {transcript && (
          <button onClick={createTask} disabled={loading} className="btn-primary px-6">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat'}
          </button>
        )}
      </div>
    </div>
  )
}
