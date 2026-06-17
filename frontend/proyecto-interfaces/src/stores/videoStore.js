import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useVideoStore = defineStore('video', () => {
  const videoFile = ref(null)
  const audio1File = ref(null)
  const audio2File = ref(null)
  const subtitle1File = ref(null)
  const subtitle2File = ref(null)

  const currentVideoName = ref('')
  const currentAudio1Name = ref('')
  const currentAudio2Name = ref('')
  const currentSubtitle1Name = ref('')
  const currentSubtitle2Name = ref('')

  const setVideoFile = (file) => {
    videoFile.value = file
  }
  const setAudio1File = (file) => {
    audio1File.value = file
  }
  const setAudio2File = (file) => {
    audio2File.value = file
  }
  const setSubtitle1File = (file) => {
    subtitle1File.value = file
  }
  const setSubtitle2File = (file) => {
    subtitle2File.value = file
  }

  const setCurrentNames = ({ video, audio1, audio2, subtitle1, subtitle2 }) => {
    currentVideoName.value = video || ''
    currentAudio1Name.value = audio1 || ''
    currentAudio2Name.value = audio2 || ''
    currentSubtitle1Name.value = subtitle1 || ''
    currentSubtitle2Name.value = subtitle2 || ''
  }

  const clearSelectedFiles = () => {
    videoFile.value = null
    audio1File.value = null
    audio2File.value = null
    subtitle1File.value = null
    subtitle2File.value = null
  }

  return {
    videoFile,
    audio1File,
    audio2File,
    subtitle1File,
    subtitle2File,
    currentVideoName,
    currentAudio1Name,
    currentAudio2Name,
    currentSubtitle1Name,
    currentSubtitle2Name,
    setVideoFile,
    setAudio1File,
    setAudio2File,
    setSubtitle1File,
    setSubtitle2File,
    setCurrentNames,
    clearSelectedFiles
  }
})

export default useVideoStore
