import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    loaderEnabled: localStorage.getItem('loader_enabled') !== 'false'
  }),
  actions: {
    toggleLoader() {
      this.loaderEnabled = !this.loaderEnabled
      localStorage.setItem('loader_enabled', String(this.loaderEnabled))
    },
    setLoaderEnabled(value) {
      this.loaderEnabled = Boolean(value)
      localStorage.setItem('loader_enabled', String(this.loaderEnabled))
    }
  }
})

export default useUiStore
