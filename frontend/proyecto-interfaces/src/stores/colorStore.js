import { defineStore } from 'pinia'

export const useColorStore = defineStore('colors', {
  state: () => ({
    primary: '#0d6efd',
    secondary: '#6c757d'
  }),

  actions: {
    setPrimary(color) {
      this.primary = color
      document.documentElement
        .style.setProperty('--color-primary', color)
    }
  }
})