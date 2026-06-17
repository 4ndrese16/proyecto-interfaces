<template>
  <div class="video-container" v-if="videoSrc">
  <video ref="videoElement" crossorigin="anonymous" :key="videoSrc + '-' + subtitles.length" :src="videoSrc" class="custom-video-player" preload="metadata">
      <track v-for="(subtitle, index) in subtitles" :key="subtitle.id + '-' + videoSrc" :src="subtitle.src" :label="subtitle.label" kind="subtitles" :srclang="subtitle.lang" :default="selectedSubtitle === index" />
    </video>

    <audio ref="audioElement" hidden></audio>

    <div class="controls">
      <div class="progress-area">
        <div class="progress-bar" @click="seek">
          <div class="progress" :style="{ width: progressWidth }"></div>
        </div>
        <div class="time">{{ timeLabel }}</div>
      </div>

      <div class="controls-list">
        <div class="controls-left">
          <div class="icon" @click="playPause" :title="isPlaying ? 'Pausar' : 'Reproducir'">
            {{ isPlaying ? '⏸' : '▶' }}
          </div>
          <div class="icon" @click="stopVideo" title="Detener">⏹</div>
          <div class="volume-control">
            <div class="icon" @click="volumeDown" title="Bajar volumen">🔉</div>
            <input type="range" class="volume-slider" min="0" max="1" step="0.01" v-model.number="volume" @input="setVolume" title="Ajustar volumen" />
            <div class="icon" @click="volumeUp" title="Subir volumen">🔊</div>
          </div>
        </div>
        <div class="controls-right">
          <div class="icon" @click="toggleAudioMenu" title="Seleccionar pista de audio">🎵</div>
          <div class="icon" @click="toggleSubtitleMenu" title="Seleccionar subtítulos">📄</div>
          <div class="icon" @click="toggleFullscreen" :title="isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'">
            ⛶
          </div>
        </div>
      </div>
    </div>

    <ul class="audio-list" :class="{ show: audioMenuOpen }">
      <li @click="selectAudioTrack(-1)" :class="{ active: selectedAudioTrack === -1 }">Pista por defecto</li>
      <li v-for="(track, index) in audioTracks" :key="index" @click="selectAudioTrack(index)" :class="{ active: selectedAudioTrack === index }">
        {{ track.label }}
      </li>
    </ul>

    <ul class="subtitle-list" :class="{ show: subtitleMenuOpen }">
      <li @click="selectSubtitleTrack(-1)" :class="{ active: !subtitlesEnabled }">Sin subtítulos</li>
      <li v-for="(sub, index) in subtitles" :key="sub.id" @click="selectSubtitleTrack(index)" :class="{ active: subtitlesEnabled && selectedSubtitle === index }">
        {{ sub.label }}
      </li>
    </ul>
  </div>
  <div v-else class="no-video">
    <p>No hay video disponible. Sube uno desde el panel de administración.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, nextTick, watch } from 'vue'
import { getVideo } from '@/api/video.js'

const videoElement = ref(null)
const isPlaying = ref(false)
const volume = ref(1)
const isMuted = ref(false)
const volumeBeforeMute = ref(1)
const selectedAudioTrack = ref(-1)
const subtitlesEnabled = ref(false)
const selectedSubtitle = ref(-1)
const audioTracks = ref([])
const subtitles = ref([])
const videoSrc = ref('')
const currentTime = ref(0)
const duration = ref(0)
const audioMenuOpen = ref(false)
const subtitleMenuOpen = ref(false)
const isFullscreen = ref(false)
const audioElement = ref(null)

const selectedAudioSrc = computed(() => {
  if (selectedAudioTrack.value === -1) return ''
  const track = audioTracks.value[selectedAudioTrack.value]
  return track ? track.src : ''
})

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
watch(selectedSubtitle, async (index) => {
  if (index >= 0) {
    await nextTick()
    activateSubtitleTrack(index)
  }
})

watch(videoSrc, async () => {
  await nextTick()
  if (videoElement.value) {
    videoElement.value.load()
    activateSubtitleTrack(selectedSubtitle.value)
  }
  updateAudioSource()
})

watch(subtitles, async (subs) => {
  if (subs.length === 0) {
    selectedSubtitle.value = -1
    subtitlesEnabled.value = false
    return
  }
  if (selectedSubtitle.value >= subs.length || selectedSubtitle.value < 0) {
    selectedSubtitle.value = 0
    subtitlesEnabled.value = true
  }
  if (videoElement.value) {
    videoElement.value.load()
  }
  await nextTick()
  activateSubtitleTrack(selectedSubtitle.value)
})

const updateTime = () => {
  if (videoElement.value) {
    currentTime.value = videoElement.value.currentTime
    duration.value = videoElement.value.duration || 0
    console.log('Duration:', duration.value, 'Current:', currentTime.value)
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

const activateSubtitleTrack = (index, attempt = 0) => {
  const tracks = videoElement.value?.textTracks
  if (!tracks || tracks.length === 0) {
    if (attempt < 20) {
      setTimeout(() => activateSubtitleTrack(index, attempt + 1), 120)
    }
    return
  }

  for (let i = 0; i < tracks.length; i++) {
    tracks[i].mode = (i === index && subtitlesEnabled.value) ? 'showing' : 'hidden'
  }
}

const selectSubtitleTrack = (index) => {
  if (index === -1) {
    subtitlesEnabled.value = false
    selectedSubtitle.value = -1
  } else {
    subtitlesEnabled.value = true
    selectedSubtitle.value = index
  }
  activateSubtitleTrack(selectedSubtitle.value)
  closeMenus()
}

onMounted(async () => {
  try {
    const videoData = await getVideo()
    console.log('Video data:', videoData)
    if (videoData) {
      videoSrc.value = videoData.video_path
      console.log('Video src set to:', videoSrc.value)
      audioTracks.value = [
        { label: videoData.audio1_label, src: videoData.audio1_path },
        { label: videoData.audio2_label, src: videoData.audio2_path }
      ].filter(track => track.src)
      subtitles.value = [
        { id: 'sub1', label: videoData.subtitle1_label, src: videoData.subtitle1_path, lang: 'es' },
        { id: 'sub2', label: videoData.subtitle2_label, src: videoData.subtitle2_path, lang: 'en' }
      ].filter(sub => sub.src)

      if (audioTracks.value.length > 0 && selectedAudioTrack.value === -1) {
        selectedAudioTrack.value = 0
      }
      if (subtitles.value.length > 0 && selectedSubtitle.value === -1) {
        subtitlesEnabled.value = true
        selectedSubtitle.value = 0
      }
    }

    await nextTick()

    if (videoElement.value) {
      videoElement.value.volume = volume.value
      videoElement.value.addEventListener('play', () => { isPlaying.value = true })
      videoElement.value.addEventListener('pause', () => { isPlaying.value = false })
      videoElement.value.addEventListener('timeupdate', updateTime)
      const tryActivateSubtitle = () => {
        if (subtitles.value.length > 0) {
          if (selectedSubtitle.value < 0) {
            subtitlesEnabled.value = true
            selectedSubtitle.value = 0
          }
          activateSubtitleTrack(selectedSubtitle.value)
        }
      }

      videoElement.value.addEventListener('loadedmetadata', () => {
        updateTime()
        tryActivateSubtitle()
      })
      videoElement.value.addEventListener('durationchange', updateTime)
      videoElement.value.addEventListener('loadeddata', () => {
        console.log('Loaded data')
        tryActivateSubtitle()
      })
      videoElement.value.addEventListener('canplay', () => {
        console.log('Can play')
        tryActivateSubtitle()
      })
      videoElement.value.addEventListener('error', (e) => console.log('Video error:', e))
      videoElement.value.addEventListener('click', playPause)

      if (audioElement.value) {
        audioElement.value.volume = volume.value
        audioElement.value.preload = 'metadata'
        audioElement.value.addEventListener('loadedmetadata', () => {
          if (!audioElement.value) return
          audioElement.value.currentTime = videoElement.value?.currentTime || 0
          if (videoElement.value && !videoElement.value.paused && selectedAudioSrc.value) {
            audioElement.value.play().catch(() => {})
          }
        })
      }

      // Forzar carga de metadata
      if (videoSrc.value) {
        videoElement.value.load()
      }

      if (audioTracks.value.length > 0 && selectedAudioTrack.value === -1) {
        selectedAudioTrack.value = 0
      }
      if (subtitles.value.length > 0 && selectedSubtitle.value === -1) {
        subtitlesEnabled.value = true
        selectedSubtitle.value = 0
      }
      updateAudioSource()
      if (subtitles.value.length > 0) {
        activateSubtitleTrack(selectedSubtitle.value)
      }
    }

    document.addEventListener('click', closeMenus)
    document.addEventListener('fullscreenchange', updateFullscreen)
    document.addEventListener('webkitfullscreenchange', updateFullscreen)
  } catch (error) {
    console.error('Error loading video:', error)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenus)
  document.removeEventListener('fullscreenchange', updateFullscreen)
  document.removeEventListener('webkitfullscreenchange', updateFullscreen)
})

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

const toggleMute = () => {
  if (!videoElement.value) return
  if (videoElement.value.muted) {
    videoElement.value.muted = false
    volume.value = volumeBeforeMute.value
  } else {
    volumeBeforeMute.value = volume.value
    videoElement.value.muted = true
    volume.value = 0
  }
  isMuted.value = videoElement.value.muted
}

const volumeUp = () => {
  let newVol = volume.value + 0.1
  if (newVol > 1) newVol = 1
  volume.value = newVol
  if (videoElement.value?.muted) videoElement.value.muted = false
  isMuted.value = false
}

const volumeDown = () => {
  let newVol = volume.value - 0.1
  if (newVol < 0) newVol = 0
  volume.value = newVol
  if (videoElement.value?.muted && newVol > 0) videoElement.value.muted = false
  isMuted.value = videoElement.value?.muted || false
}

const seek = (event) => {
  console.log('Seek event', event.clientX, duration.value)
  if (!videoElement.value || !duration.value || duration.value === 0) return
  const rect = event.currentTarget.getBoundingClientRect()
  const percentage = (event.clientX - rect.left) / rect.width
  videoElement.value.currentTime = percentage * duration.value
  if (audioElement.value && selectedAudioSrc.value) {
    audioElement.value.currentTime = videoElement.value.currentTime
  }
  console.log('Set time to:', percentage * duration.value)
}

const toggleFullscreen = () => {
  const container = document.querySelector('.video-container')
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
  const currentSec = current % 60
  const totalMin = Math.floor(total / 60)
  const totalSec = total % 60
  return `${pad(currentMin)}:${pad(currentSec)} / ${pad(totalMin)}:${pad(totalSec)}`
})

const progressWidth = computed(() => {
  if (!duration.value || isNaN(duration.value) || duration.value <= 0) return '0%'
  const width = (currentTime.value / duration.value) * 100
  return `${Math.min(100, Math.max(0, width))}%`
})
</script>

<style scoped>
.video-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: var(--main-bg-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-container:hover .controls {
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
  flex-wrap: nowrap;
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

.speed-options,
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
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.speed-options.show,
.audio-list.show,
.subtitle-list.show {
  display: block;
}

.speed-options li,
.audio-list li,
.subtitle-list li {
  list-style: none;
  padding: 8px 12px;
  cursor: pointer;
  color: var(--text-color);
  transition: background 0.2s ease;
}

.speed-options li:hover,
.audio-list li:hover,
.subtitle-list li:hover {
  background: var(--secondary-color);
  color: var(--alternate-text-color);
}

.speed-options li.active,
.audio-list li.active,
.subtitle-list li.active {
  background: var(--secondary-color);
  color: var(--alternate-text-color);
}

.caption {
  color: var(--alternate-text-color);
  font-size: 12px;
  position: absolute;
  bottom: 80px;
  left: 20px;
  right: 20px;
  text-align: center;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px;
  border-radius: 4px;
  display: none;
}

.caption.show {
  display: block;
}

.no-video {
  padding: 40px;
  text-align: center;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .controls {
    padding: 15px;
  }

  .controls-list {
    flex-direction: column;
    align-items: stretch;
  }

  .controls-left,
  .controls-right {
    justify-content: center;
  }

  .volume-range {
    width: 60px;
  }
}
</style>