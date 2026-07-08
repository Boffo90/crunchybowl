import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
	'./app/**/*.{ts,tsx}',
	'./components/**/*.{ts,tsx}'
  ],
  theme: {
	extend: {
  	colors: {
    	crunchy: {
      	pink: '#FFB6C7',
      	'pink-soft': '#FFD8E4',
      	'pink-deep': '#FF8FB1',
      	cream: '#FFF5F0',
      	lavender: '#E8D5F2',
      	peach: '#FFCBA4',
      	dark: '#4A2C3A',
      	accent: '#FF6B9D',
      	muted: '#8B6B7A'
    	}
  	},
  	fontFamily: {
    	sans: ['var(--font-quicksand)', 'system-ui', 'sans-serif'],
    	display: ['var(--font-fredoka)', 'system-ui', 'sans-serif']
  	},
  	borderRadius: {
    	kawaii: '1.5rem'
  	},
  	boxShadow: {
    	kawaii: '0 4px 20px rgba(255, 143, 177, 0.15)',
    	'kawaii-lg': '0 10px 40px rgba(255, 143, 177, 0.2)'
  	}
	}
  },
  plugins: []
};

export default config;

