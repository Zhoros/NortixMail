import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte'
import fs from 'fs'
import path from 'path'

function getHtmlInputs(dir) {
  const entries = {}
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    if (fs.statSync(fullPath).isFile() && file.endsWith('.html')) {
      const name = path.basename(file, '.html')
      entries[name] = fullPath
    }
  }
  return entries
}

export default defineConfig({

	root: './src',
	base: './',
	server: {
		watch: {
			usePolling: true,
			interval: 250,
		}
	},
	plugins: [tailwindcss(), svelte()],
	build: {

		rollupOptions: {
			
			input: getHtmlInputs(path.resolve('./src')),

		},

		outDir: '../../public',
		assetsDir: 'assets',
		emptyOutDir: true,

	}

})

