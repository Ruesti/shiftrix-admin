import type { Config } from 'tailwindcss'


const config: Config = {
content: [
'./src/**/*.{js,ts,jsx,tsx}',
],
theme: {
extend: {
colors: {
softbrew: {
blue: '#0EA5E9',
black: '#111827',
white: '#FFFFFF',
gray: '#F3F4F6',
mid: '#9CA3AF',
},
product: {
shiftrix: '#F97316',
}
},
borderRadius: { brand: '1rem' }
},
},
plugins: [],
}
export default config