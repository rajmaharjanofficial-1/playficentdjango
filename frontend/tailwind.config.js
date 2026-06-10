/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {extend: {colors: {neonGreen: '#39FF14', neonBlue: '#00D9FF', neonPink: '#FF10F0', neonYellow: '#FFD700'}, fontFamily: {'press-start': ['"Press Start 2P"', 'cursive']}, keyframes: {'glow-pulse': {'0%, 100%': {textShadow: '0 0 5px #39FF14, 0 0 10px #39FF14'}, '50%': {textShadow: '0 0 10px #39FF14, 0 0 20px #39FF14, 0 0 30px #39FF14'}}, 'combo-bounce': {'0%, 100%': {transform: 'scale(1)'}, '50%': {transform: 'scale(1.2)'}}, 'float-up': {'0%': {transform: 'translateY(0) scale(1)', opacity: '1'}, '100%': {transform: 'translateY(-60px) scale(0.8)', opacity: '0'}}}, animation: {'glow-pulse': 'glow-pulse 2s ease-in-out infinite', 'combo-bounce': 'combo-bounce 0.5s ease-in-out', 'float-up': 'float-up 1.5s ease-out forwards'}, dropShadow: {glow: '0 0 8px #39FF14', 'glow-lg': '0 0 15px #39FF14'}}},
  plugins: [],
}
