import { defineStore } from 'pinia'
import { getAll, getPublic, getSelected, getDefault, setDefaultPalette, setDarkPalette, setDaltonicPalette } from '@/api/colorPalette'

export const useColorStore = defineStore('colors', {
  state: () => ({
    palettes: [],
    defaultId: null,
    darkId: null,
    daltonicId: null,
    currentMode: localStorage.getItem('palette_mode') || 'default',
    adminMode: false
  }),
  getters: {
    defaultPalette: (state) => state.palettes.find(p => p.id === state.defaultId) || null,
    darkPalette: (state) => state.palettes.find(p => p.id === state.darkId) || null,
    daltonicPalette: (state) => state.palettes.find(p => p.id === state.daltonicId) || null
  },
  actions: {
    async load(admin = false) {
      this.adminMode = admin
      try {
        let list = []
        if (admin) {
          list = await getAll()
        } else {
          // prefer fetching selected palettes so admin-selected palettes appear to all users
          try {
            list = await getSelected()
          } catch (e) {
            // fallback to public palettes if endpoint unavailable
            list = await getPublic()
          }
        }
        this.palettes = list || []

        // derive selections
        const d = this.palettes.find(p => p.is_default) || null
        const dk = this.palettes.find(p => p.is_dark) || null
        const dal = this.palettes.find(p => p.is_daltonic) || null
        this.defaultId = d ? d.id : null
        this.darkId = dk ? dk.id : null
        this.daltonicId = dal ? dal.id : null

        // ensure there is always a default if any palettes exist
        if (!this.defaultId && this.palettes.length === 1) {
          const only = this.palettes[0]
          await this.setDefault(only.id)
        }

        // apply persisted mode if possible
        this.applyMode(this.currentMode)
      } catch (e) {
        console.error('Failed to load palettes', e)
      }
    },

    applyPaletteToCss(palette) {
      if (!palette) return
      const root = document.documentElement
      root.style.setProperty('--main-bg-color', palette.main_bg_color)
      root.style.setProperty('--secondary-color', palette.secondary_color)
      root.style.setProperty('--accent-color', palette.accent_color)
      root.style.setProperty('--text-color', palette.text_color)
      root.style.setProperty('--alternate-text-color', palette.alternate_text_color)
    },

    applyMode(mode = 'default') {
      this.currentMode = mode
      localStorage.setItem('palette_mode', mode)
      let pal = null
      if (mode === 'default') pal = this.defaultPalette
      else if (mode === 'dark') pal = this.darkPalette
      else if (mode === 'daltonic') pal = this.daltonicPalette

      if (pal) {
        this.applyPaletteToCss(pal)
        document.body.classList.toggle('palette-dark-mode', mode === 'dark')
        document.body.classList.toggle('palette-daltonic-mode', mode === 'daltonic')
      }
    },

    async setDefault(id) {
      if (!this.adminMode) return
      try {
        await setDefaultPalette(id)
        await this.load(this.adminMode)
      } catch (e) {
        console.error('Failed to set default', e)
        throw e
      }
    },

    async setDark(id) {
      if (!this.adminMode) return
      try {
        await setDarkPalette(id)
        await this.load(this.adminMode)
      } catch (e) {
        console.error('Failed to set dark', e)
        throw e
      }
    },

    async setDaltonic(id) {
      if (!this.adminMode) return
      try {
        await setDaltonicPalette(id)
        await this.load(this.adminMode)
      } catch (e) {
        console.error('Failed to set daltonic', e)
        throw e
      }
    }
  }
})

export default useColorStore