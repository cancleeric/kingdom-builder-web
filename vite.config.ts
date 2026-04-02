import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = 'kingdom-builder-web'
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'

export default defineConfig({
  base: isGitHubActions ? `/${repoName}/` : '/',
  plugins: [react()],
})
