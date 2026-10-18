// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// The docs site for setting up a plugged.host panel (Pelican + the plugged.host plugins).
// Static output in dist/, served by the Cloudflare Worker in wrangler.jsonc.
export default defineConfig({
	site: 'https://docs.plugged.host',
	trailingSlash: 'always',
	build: {
		// Stylesheets as files, never inline <style>: the CSP in public/_headers has no
		// 'unsafe-inline' for styles.
		inlineStylesheets: 'never',
	},
	integrations: [
		starlight({
			title: 'plugged.host docs',
			description:
				'How to set up a plugged.host panel: Pelican Panel with the plugged.host plugins, its nodes, storage, Discord bots and status page.',
			logo: { src: './src/assets/logo.png', alt: '' },
			favicon: '/favicon.png',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/plugged-host/plugins' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/plugged-host-1502647500295635085' },
			],
			editLink: { baseUrl: 'https://github.com/plugged-host/docs/edit/main/' },
			customCss: ['./src/styles/fonts.css', './src/styles/theme.css'],
			components: {
				SiteTitle: './src/components/SiteTitle.astro',
			},
			expressiveCode: {
				themes: ['github-dark-default', 'github-light-default'],
				styleOverrides: {
					borderRadius: '0.5rem',
					codeFontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
					uiFontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
					frames: { frameBoxShadowCssValue: 'none' },
				},
			},
			sidebar: [
				{
					label: 'Start here',
					items: ['start/introduction', 'start/requirements', 'start/install-order'],
				},
				{
					label: 'Panel',
					items: [
						'panel/pelican',
						'panel/plugins',
						'panel/web-server',
						'panel/queue-and-scheduler',
						'panel/configuration',
						'panel/doctor',
						'panel/updating',
						'panel/troubleshooting',
					],
				},
				{
					label: 'Nodes',
					items: ['nodes/wings', 'nodes/abuse-agent', 'nodes/devboxes', 'nodes/fivem-image'],
				},
				{
					label: 'Storage and failover',
					items: ['storage/storage-box', 'storage/backup-server', 'storage/failover'],
				},
				{
					label: 'Discord and AI',
					items: ['discord/membership-bot', 'discord/neo', 'discord/rux'],
				},
				{
					label: 'Status page and website',
					items: ['status/status-export', 'status/status-worker', 'status/website'],
				},
				{
					label: 'Plugins',
					items: [{ autogenerate: { directory: 'plugins' } }],
				},
				{
					label: 'Reference',
					items: ['reference/architecture', 'reference/versions', 'reference/commands'],
				},
			],
		}),
	],
});
