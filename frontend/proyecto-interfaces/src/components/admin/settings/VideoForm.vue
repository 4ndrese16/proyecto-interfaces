<template>
  <div class="video-form">
    <h5>Administrar Video del Home</h5>
    <div class="video-form-grid">

      <div class="fields-column">
        <form @submit.prevent="saveVideoForm">
          <div class="mb-3">
            <label for="title" class="form-label">Título del Video</label>
            <input type="text" class="form-control" id="title" v-model="title" />
          </div>
          <div class="mb-3">
            <label for="videoFile" class="form-label">Subir Video (.mp4)</label>
            <input type="file" class="form-control" id="videoFile" accept=".mp4" @change="handleVideoChange" />
            <div class="form-text" v-if="videoStore.videoFile">Seleccionado: {{ videoStore.videoFile.name }}</div>
            <div class="form-text" v-else-if="videoStore.currentVideoName">Cargado: {{ videoStore.currentVideoName }}</div>
          </div>
          <div class="mb-3">
            <label for="audio1Label" class="form-label">Etiqueta Audio 1</label>
            <input type="text" class="form-control" id="audio1Label" v-model="audio1Label" />
          </div>
          <div class="mb-3">
            <label for="audio1File" class="form-label">Pista de Audio 1 (.mp3)</label>
            <input type="file" class="form-control" id="audio1File" accept=".mp3" @change="handleAudio1Change" />
            <div class="form-text" v-if="videoStore.audio1File">Seleccionado: {{ videoStore.audio1File.name }}</div>
            <div class="form-text" v-else-if="videoStore.currentAudio1Name">Cargado: {{ videoStore.currentAudio1Name }}</div>
          </div>
          <div class="mb-3">
            <label for="audio2Label" class="form-label">Etiqueta Audio 2</label>
            <input type="text" class="form-control" id="audio2Label" v-model="audio2Label" />
          </div>
          <div class="mb-3">
            <label for="audio2File" class="form-label">Pista de Audio 2 (.mp3)</label>
            <input type="file" class="form-control" id="audio2File" accept=".mp3" @change="handleAudio2Change" />
            <div class="form-text" v-if="videoStore.audio2File">Seleccionado: {{ videoStore.audio2File.name }}</div>
            <div class="form-text" v-else-if="videoStore.currentAudio2Name">Cargado: {{ videoStore.currentAudio2Name }}</div>
          </div>
          <div class="mb-3">
            <label for="subtitle1Label" class="form-label">Etiqueta Subtítulos 1</label>
            <input type="text" class="form-control" id="subtitle1Label" v-model="subtitle1Label" />
          </div>
          <div class="mb-3">
            <label for="subtitle1File" class="form-label">Subtítulos 1 (.vtt)</label>
            <input type="file" class="form-control" id="subtitle1File" accept=".vtt" @change="handleSubtitle1Change" />
            <div class="form-text" v-if="videoStore.subtitle1File">Seleccionado: {{ videoStore.subtitle1File.name }}</div>
            <div class="form-text" v-else-if="videoStore.currentSubtitle1Name">Cargado: {{ videoStore.currentSubtitle1Name }}</div>
          </div>
          <div class="mb-3">
            <label for="subtitle2Label" class="form-label">Etiqueta Subtítulos 2</label>
            <input type="text" class="form-control" id="subtitle2Label" v-model="subtitle2Label" />
          </div>
          <div class="mb-3">
            <label for="subtitle2File" class="form-label">Subtítulos 2 (.vtt)</label>
            <input type="file" class="form-control" id="subtitle2File" accept=".vtt" @change="handleSubtitle2Change" />
            <div class="form-text" v-if="videoStore.subtitle2File">Seleccionado: {{ videoStore.subtitle2File.name }}</div>
            <div class="form-text" v-else-if="videoStore.currentSubtitle2Name">Cargado: {{ videoStore.currentSubtitle2Name }}</div>
          </div>
          <button type="submit" class="btn btn-primary">{{ isEditing ? 'Actualizar' : 'Guardar' }}</button>
        </form>
      </div>

      <div class="preview-column">
        <div class="preview-panel">
          <h6>Vista previa</h6>
          <div class="video-container preview-container" ref="previewContainer" v-if="previewVideoSrc">
            <video ref="videoElement" :src="previewVideoSrc" class="custom-video-player" preload="metadata">
              <track
                v-if="previewSubtitle1Src"
                kind="subtitles"
                :label="subtitle1Label || 'Subtítulos 1'"
                :src="previewSubtitle1Src"
                srclang="es"
                default
              />
              <track
                v-if="previewSubtitle2Src"
                kind="subtitles"
                :label="subtitle2Label || 'Subtítulos 2'"
                :src="previewSubtitle2Src"
                srclang="en"
              />
            </video>

            <audio ref="audioElement" hidden></audio>

            <div class="controls">
              <div class="progress-area">
                <div class="progress-bar" @click.stop="seek">
                  <div class="progress" :style="{ width: progressWidth }"></div>
                </div>
                <div class="time">{{ timeLabel }}</div>
              </div>

              <div class="controls-list">
                <div class="controls-left">
                  <div class="icon" @click.stop="playPause" :title="isPlaying ? 'Pausar' : 'Reproducir'">
                    {{ isPlaying ? '⏸' : '▶' }}
                  </div>
                  <div class="icon" @click.stop="stopVideo" title="Detener">⏹</div>
                  <div class="volume-control">
                    <div class="icon" @click.stop="volumeDown" title="Bajar volumen">🔉</div>
                    <input
                      type="range"
                      class="volume-slider"
                      min="0"
                      max="1"
                      step="0.01"
                      v-model.number="volume"
                      @input="setVolume"
                      title="Ajustar volumen"
                    />
                    <div class="icon" @click.stop="volumeUp" title="Subir volumen">🔊</div>
                  </div>
                </div>
                <div class="controls-right">
                  <div class="icon" @click.stop="toggleAudioMenu" title="Seleccionar pista de audio">🎵</div>
                  <div class="icon" @click.stop="toggleSubtitleMenu" title="Seleccionar subtítulos">📄</div>
                  <div
                    class="icon"
                    @click.stop="toggleFullscreen"
                    :title="isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'"
                  >
                    ⛶
                  </div>
                </div>
              </div>
            </div>

            <ul class="audio-list" :class="{ show: audioMenuOpen }">
              <li @click.stop="selectAudioTrack(-1)" :class="{ active: selectedAudioTrack === -1 }">Pista por defecto</li>
              <li
                v-for="(track, index) in audioTracks"
                :key="index"
                @click.stop="selectAudioTrack(index)"
                :class="{ active: selectedAudioTrack === index }"
              >
                {{ track.label }}
              </li>
            </ul>

            <ul class="subtitle-list" :class="{ show: subtitleMenuOpen }">
              <li @click.stop="selectSubtitleTrack(-1)" :class="{ active: !subtitlesEnabled }">Sin subtítulos</li>
              <li
                v-for="(sub, index) in subtitles"
                :key="sub.id"
                @click.stop="selectSubtitleTrack(index)"
                :class="{ active: subtitlesEnabled && selectedSubtitle === index }"
              >
                {{ sub.label }}
              </li>
            </ul>
          </div>
          <div v-else class="no-video">
            <p>Selecciona primero un video para ver la vista previa.</p>
          </div>

          <div class="subtitle-preview">
            <div v-if="previewSubtitle1Src" class="form-text">Subtítulo 1 listo: {{ subtitle1Label || 'Subtítulos 1' }}</div>
            <div v-if="previewSubtitle2Src" class="form-text">Subtítulo 2 listo: {{ subtitle2Label || 'Subtítulos 2' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useVideoStore } from '@/stores/videoStore.js'
import { saveVideo, updateVideo, getVideo } from '@/api/video.js'

const videoStore = useVideoStore()
const title = ref('Home Video')
const subtitle1Label = ref('Subtítulos 1')
const subtitle2Label = ref('Subtítulos 2')
const audio1Label = ref('Audio 1')
const audio2Label = ref('Audio 2')
const isEditing = ref(false)

const videoElement = ref(null)
const previewContainer = ref(null)
const isPlaying = ref(false)
const volume = ref(1)
const selectedAudioTrack = ref(-1)
const selectedSubtitle = ref(-1)
const subtitlesEnabled = ref(false)
const audioMenuOpen = ref(false)
const subtitleMenuOpen = ref(false)
const isFullscreen = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const videoListenersInitialized = ref(false)

const selectedAudioSrc = computed(() => {
  if (selectedAudioTrack.value === -1) return ''
  const track = audioTracks.value[selectedAudioTrack.value]
  return track ? track.src : ''
})

const audioElement = ref(null)

const videoFileUrl = ref('')
const audio1FileUrl = ref('')
const audio2FileUrl = ref('')
const subtitle1FileUrl = ref('')
const subtitle2FileUrl = ref('')

const loadedVideoUrl = ref('')
const loadedAudio1Url = ref('')
const loadedAudio2Url = ref('')
const loadedSubtitle1Url = ref('')
const loadedSubtitle2Url = ref('')

const previewVideoSrc = computed(() => videoFileUrl.value || loadedVideoUrl.value)
const previewAudio1Src = computed(() => audio1FileUrl.value || loadedAudio1Url.value)
const previewAudio2Src = computed(() => audio2FileUrl.value || loadedAudio2Url.value)
const previewSubtitle1Src = computed(() => subtitle1FileUrl.value || loadedSubtitle1Url.value)
const previewSubtitle2Src = computed(() => subtitle2FileUrl.value || loadedSubtitle2Url.value)

const audioTracks = computed(() => [
  { label: audio1Label.value || 'Audio 1', src: previewAudio1Src.value },
  { label: audio2Label.value || 'Audio 2', src: previewAudio2Src.value }
].filter(track => track.src))

const subtitles = computed(() => [
  { id: 'sub1', label: subtitle1Label.value || 'Subtítulos 1', src: previewSubtitle1Src.value, lang: 'es' },
  { id: 'sub2', label: subtitle2Label.value || 'Subtítulos 2', src: previewSubtitle2Src.value, lang: 'en' }
].filter(sub => sub.src))

watch([previewVideoSrc, previewSubtitle1Src, previewSubtitle2Src], () => {
  previewLoaded()
})

watch(audioTracks, (tracks) => {
  if (tracks.length > 0 && selectedAudioTrack.value === -1) {
    selectedAudioTrack.value = 0
  }
  if (selectedAudioTrack.value >= tracks.length) {
    selectedAudioTrack.value = tracks.length - 1
  }
})

watch(subtitles, (subs) => {
  if (subs.length > 0 && selectedSubtitle.value === -1) {
    subtitlesEnabled.value = true
    selectedSubtitle.value = 0
  }
  if (selectedSubtitle.value >= subs.length) {
    selectedSubtitle.value = subs.length - 1
  }
})

const extractFileName = (url) => {
  if (!url) return ''
  return url.split('/').pop()
}

const createObjectUrl = (file) => file ? URL.createObjectURL(file) : ''
const revokeUrl = (urlRef) => {
  if (urlRef.value) {
    URL.revokeObjectURL(urlRef.value)
    urlRef.value = ''
  }
}

watch(() => videoStore.videoFile, (file) => {
  revokeUrl(videoFileUrl)
  if (file) videoFileUrl.value = createObjectUrl(file)
})

watch(() => videoStore.audio1File, (file) => {
  revokeUrl(audio1FileUrl)
  if (file) audio1FileUrl.value = createObjectUrl(file)
})

watch(() => videoStore.audio2File, (file) => {
  revokeUrl(audio2FileUrl)
  if (file) audio2FileUrl.value = createObjectUrl(file)
})

watch(() => videoStore.subtitle1File, (file) => {
  revokeUrl(subtitle1FileUrl)
  if (file) subtitle1FileUrl.value = createObjectUrl(file)
})

watch(() => videoStore.subtitle2File, (file) => {
  revokeUrl(subtitle2FileUrl)
  if (file) subtitle2FileUrl.value = createObjectUrl(file)
})

const previewLoaded = async () => {
  await nextTick()
  if (!videoElement.value) return
  if (!videoListenersInitialized.value) {
    videoElement.value.volume = volume.value
    videoElement.value.addEventListener('play', () => { isPlaying.value = true })
    videoElement.value.addEventListener('pause', () => { isPlaying.value = false })
    videoElement.value.addEventListener('timeupdate', updateTime)
    videoElement.value.addEventListener('loadedmetadata', () => {
      updateTime()
      if (subtitles.value.length > 0) {
        if (selectedSubtitle.value < 0) {
          subtitlesEnabled.value = true
          selectedSubtitle.value = 0
        }
        selectSubtitleTrack(selectedSubtitle.value)
      }
    })
    videoElement.value.addEventListener('durationchange', updateTime)
    videoElement.value.addEventListener('loadeddata', () => console.log('Loaded data'))
    videoElement.value.addEventListener('canplay', () => console.log('Can play'))
    videoElement.value.addEventListener('error', (e) => console.log('Video error:', e))
    videoElement.value.addEventListener('click', playPause)

    if (audioElement.value) {
      audioElement.value.preload = 'metadata'
      audioElement.value.volume = volume.value
      audioElement.value.addEventListener('loadedmetadata', () => {
        if (!audioElement.value) return
        if (videoElement.value) {
          audioElement.value.currentTime = videoElement.value.currentTime || 0
        }
        if (videoElement.value && !videoElement.value.paused && selectedAudioSrc.value) {
          audioElement.value.play().catch(() => {})
        }
      })
    }

    videoListenersInitialized.value = true
  }
  videoElement.value.load()

  if (audioTracks.value.length > 0 && selectedAudioTrack.value === -1) {
    selectedAudioTrack.value = 0
  }

  if (subtitles.value.length > 0 && selectedSubtitle.value === -1) {
    subtitlesEnabled.value = true
    selectedSubtitle.value = 0
  }
  selectSubtitleTrack(selectedSubtitle.value)
  updateAudioSource()
}

const updateAudioSource = () => {
  if (!audioElement.value) return
  audioElement.value.volume = volume.value
  if (!selectedAudioSrc.value) {
    audioElement.value.pause()
    audioElement.value.src = ''
    return
  }

  audioElement.value.pause()
  audioElement.value.src = selectedAudioSrc.value
  audioElement.value.load()
  audioElement.value.currentTime = videoElement.value?.currentTime || 0
  if (videoElement.value && !videoElement.value.paused) {
    audioElement.value.play().catch(() => {})
  }
}

watch(selectedAudioTrack, updateAudioSource)
watch(selectedAudioSrc, updateAudioSource)

const updateTime = () => {
  if (videoElement.value) {
    currentTime.value = videoElement.value.currentTime
    duration.value = videoElement.value.duration || 0
  }
}

const closeMenus = () => {
  audioMenuOpen.value = false
  subtitleMenuOpen.value = false
}

const toggleAudioMenu = (event) => {
  event.stopPropagation()
  audioMenuOpen.value = !audioMenuOpen.value
  subtitleMenuOpen.value = false
}

const toggleSubtitleMenu = (event) => {
  event.stopPropagation()
  subtitleMenuOpen.value = !subtitleMenuOpen.value
  audioMenuOpen.value = false
}

const selectAudioTrack = (index) => {
  selectedAudioTrack.value = index
  updateAudioSource()
  if (videoElement.value && !videoElement.value.paused && selectedAudioSrc.value) {
    audioElement.value?.play().catch(() => {})
  }
  closeMenus()
}

const selectSubtitleTrack = (index) => {
  if (index === -1) {
    subtitlesEnabled.value = false
    selectedSubtitle.value = -1
  } else {
    subtitlesEnabled.value = true
    selectedSubtitle.value = index
  }
  const tracks = videoElement.value?.textTracks
  if (!tracks) return
  for (let i = 0; i < tracks.length; i++) {
    tracks[i].mode = (i === index && subtitlesEnabled.value) ? 'showing' : 'hidden'
  }
  closeMenus()
}

const playPause = () => {
  if (!videoElement.value) return
  if (videoElement.value.paused) {
    videoElement.value.play()
    if (selectedAudioSrc.value && audioElement.value) {
      audioElement.value.currentTime = videoElement.value.currentTime
      audioElement.value.play()
    }
  } else {
    videoElement.value.pause()
    if (audioElement.value) audioElement.value.pause()
  }
}

const stopVideo = () => {
  if (!videoElement.value) return
  videoElement.value.pause()
  videoElement.value.currentTime = 0
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.currentTime = 0
  }
}

const setVolume = () => {
  if (videoElement.value) {
    videoElement.value.volume = volume.value
  }
  if (audioElement.value) {
    audioElement.value.volume = volume.value
  }
}

const volumeUp = () => {
  let newVol = volume.value + 0.1
  if (newVol > 1) newVol = 1
  volume.value = newVol
  if (videoElement.value?.muted) videoElement.value.muted = false
}

const volumeDown = () => {
  let newVol = volume.value - 0.1
  if (newVol < 0) newVol = 0
  volume.value = newVol
  if (videoElement.value?.muted && newVol > 0) videoElement.value.muted = false
}

const seek = (event) => {
  if (!videoElement.value || !duration.value || duration.value === 0) return
  const rect = event.currentTarget.getBoundingClientRect()
  const percentage = (event.clientX - rect.left) / rect.width
  videoElement.value.currentTime = percentage * duration.value
  if (audioElement.value && selectedAudioSrc.value) {
    audioElement.value.currentTime = videoElement.value.currentTime
  }
}

const toggleFullscreen = () => {
  const container = previewContainer.value || document.querySelector('.preview-container')
  if (!container) return
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    (container.requestFullscreen || container.webkitRequestFullscreen || container.msRequestFullscreen).call(container)
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document)
  }
}

const updateFullscreen = () => {
  isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement)
}

const timeLabel = computed(() => {
  const pad = (value) => String(Math.floor(value)).padStart(2, '0')
  const current = currentTime.value || 0
  const total = duration.value || 0
  const currentMin = Math.floor(current / 60)
  const currentSec = Math.floor(current % 60)
  const totalMin = Math.floor(total / 60)
  const totalSec = Math.floor(total % 60)
  return `${pad(currentMin)}:${pad(currentSec)} / ${pad(totalMin)}:${pad(totalSec)}`
})

const progressWidth = computed(() => {
  if (!duration.value || isNaN(duration.value) || duration.value <= 0) return '0%'
  const width = (currentTime.value / duration.value) * 100
  return `${Math.min(100, Math.max(0, width))}%`
})

const loadVideo = async () => {
  try {
    const videoData = await getVideo()
    if (videoData) {
      title.value = videoData.title || 'Home Video'
      subtitle1Label.value = videoData.subtitle1_label || 'Subtítulos 1'
      subtitle2Label.value = videoData.subtitle2_label || 'Subtítulos 2'
      audio1Label.value = videoData.audio1_label || 'Audio 1'
      audio2Label.value = videoData.audio2_label || 'Audio 2'
      videoStore.setCurrentNames({
        video: extractFileName(videoData.video_path),
        audio1: extractFileName(videoData.audio1_path),
        audio2: extractFileName(videoData.audio2_path),
        subtitle1: extractFileName(videoData.subtitle1_path),
        subtitle2: extractFileName(videoData.subtitle2_path)
      })
      loadedVideoUrl.value = videoData.video_path || ''
      loadedAudio1Url.value = videoData.audio1_path || ''
      loadedAudio2Url.value = videoData.audio2_path || ''
      loadedSubtitle1Url.value = videoData.subtitle1_path || ''
      loadedSubtitle2Url.value = videoData.subtitle2_path || ''
      isEditing.value = true
    }
  } catch (error) {
    console.error('Error loading video:', error)
    title.value = 'Home Video'
    subtitle1Label.value = 'Subtítulos 1'
    subtitle2Label.value = 'Subtítulos 2'
    audio1Label.value = 'Audio 1'
    audio2Label.value = 'Audio 2'
    videoStore.setCurrentNames({})
    loadedVideoUrl.value = ''
    loadedAudio1Url.value = ''
    loadedAudio2Url.value = ''
    loadedSubtitle1Url.value = ''
    loadedSubtitle2Url.value = ''
    isEditing.value = false
  }
}

onMounted(() => {
  loadVideo()
  document.addEventListener('click', closeMenus)
  document.addEventListener('fullscreenchange', updateFullscreen)
  document.addEventListener('webkitfullscreenchange', updateFullscreen)
})

onUnmounted(() => {
  revokeUrl(videoFileUrl)
  revokeUrl(audio1FileUrl)
  revokeUrl(audio2FileUrl)
  revokeUrl(subtitle1FileUrl)
  revokeUrl(subtitle2FileUrl)
  document.removeEventListener('click', closeMenus)
  document.removeEventListener('fullscreenchange', updateFullscreen)
  document.removeEventListener('webkitfullscreenchange', updateFullscreen)
})

const handleVideoChange = (event) => {
  videoStore.setVideoFile(event.target.files[0])
}

const handleAudio1Change = (event) => {
  videoStore.setAudio1File(event.target.files[0])
}

const handleAudio2Change = (event) => {
  videoStore.setAudio2File(event.target.files[0])
}

const handleSubtitle1Change = (event) => {
  videoStore.setSubtitle1File(event.target.files[0])
}

const handleSubtitle2Change = (event) => {
  videoStore.setSubtitle2File(event.target.files[0])
}

const saveVideoForm = async () => {
  const formData = new FormData()
  formData.append('title', title.value)
  formData.append('subtitle1_label', subtitle1Label.value)
  formData.append('subtitle2_label', subtitle2Label.value)
  formData.append('audio1_label', audio1Label.value)
  formData.append('audio2_label', audio2Label.value)

  if (videoStore.videoFile) formData.append('video', videoStore.videoFile)
  if (videoStore.audio1File) formData.append('audio1', videoStore.audio1File)
  if (videoStore.audio2File) formData.append('audio2', videoStore.audio2File)
  if (videoStore.subtitle1File) formData.append('subtitle1', videoStore.subtitle1File)
  if (videoStore.subtitle2File) formData.append('subtitle2', videoStore.subtitle2File)

  try {
    if (isEditing.value) {
      await updateVideo(formData)
      alert('Video actualizado exitosamente')
    } else {
      await saveVideo(formData)
      alert('Video guardado exitosamente')
      isEditing.value = true
    }
    await loadVideo()
  } catch (error) {
    console.error('Error saving video:', error)
    alert('Error al guardar el video')
  }
}
</script>

<style scoped>
.video-form {
  padding: 20px;
  background: var(--main-bg-color);
  color: var(--text-color);
}

.video-form-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1.3fr) minmax(320px, 1fr);
  gap: 24px;
  align-items: start;
}

.preview-column,
.fields-column {
  width: 100%;
}

.preview-panel {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 16px;
  border-radius: 12px;
}

.preview-panel h6 {
  margin-bottom: 16px;
}

.video-container {
  position: relative;
  width: 100%;
  background: var(--main-bg-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.custom-video-player {
  width: 100%;
  height: auto;
  display: block;
}

.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.preview-container:hover .controls {
  opacity: 1;
}

.progress-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
}

.progress-bar .progress {
  height: 100%;
  background: var(--secondary-color);
  border-radius: 3px;
  transition: width 0.1s ease;
  pointer-events: none;
}

.time {
  color: var(--alternate-text-color);
  font-size: 14px;
  font-weight: 500;
}

.controls-list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.controls-left .icon,
.controls-right .icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
  color: var(--alternate-text-color);
  font-size: 18px;
}

.controls-left .icon:hover,
.controls-right .icon:hover {
  background: rgba(255, 255, 255, 0.2);
}

.volume-slider {
  width: 140px;
  height: 4px;
  cursor: pointer;
  appearance: none;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 2px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--alternate-text-color);
  border: 2px solid var(--text-color);
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--alternate-text-color);
  border: 2px solid var(--text-color);
  cursor: pointer;
}

.audio-list,
.subtitle-list {
  position: absolute;
  bottom: 70px;
  right: 20px;
  background: var(--main-bg-color);
  border: 1px solid var(--text-color);
  border-radius: 4px;
  padding: 10px;
  display: none;
  max-height: 220px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.audio-list.show,
.subtitle-list.show {
  display: block;
}

.audio-list li,
.subtitle-list li {
  list-style: none;
  padding: 8px 12px;
  cursor: pointer;
  color: var(--text-color);
  transition: background 0.2s ease;
}

.audio-list li:hover,
.subtitle-list li:hover {
  background: var(--secondary-color);
  color: var(--alternate-text-color);
}

.audio-list li.active,
.subtitle-list li.active {
  background: var(--secondary-color);
  color: var(--alternate-text-color);
}

.audio-preview audio {
  width: 100%;
}

.subtitle-preview .form-text {
  margin-top: 4px;
}

.no-video {
  padding: 24px;
  text-align: center;
  color: var(--text-color);
}

@media (max-width: 992px) {
  .video-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>