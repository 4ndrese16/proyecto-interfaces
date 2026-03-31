import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import '@/assets/css/bootstrap.min.css'
import '@/assets/css/style.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'


const app = createApp(App)

app.use(createPinia())
app.use(router)

// preload public palettes into store so header can show selections
import { useColorStore } from './stores/colorStore'
import { useFontStore } from './stores/fontStore'
import { useCartStore } from './stores/cartStore'
const pinia = app._context.provides.pinia
try {
	const palStore = useColorStore(pinia)
	palStore.load(false)
} catch (e) {
	// ignore on startup
}

try {
	const fontStore = useFontStore(pinia)
	fontStore.load(false)
} catch (e) {
	// ignore on startup
}

try {
	const cartStore = useCartStore(pinia)
	cartStore.load()
} catch (e) {
	// ignore on startup
}

app.mount('#app')
