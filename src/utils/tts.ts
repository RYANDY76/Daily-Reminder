export function speak(text: string, lang: string = 'id-ID') {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 0.9
  utterance.pitch = 1.0
  window.speechSynthesis.speak(utterance)
}

export function speakTaskReminder(taskTitle: string, time: string) {
  const text = `Pengingat: ${taskTitle} pada jam ${time}`
  speak(text)
}

export function isTTSAvailable(): boolean {
  return 'speechSynthesis' in window
}
