// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// The docs site for running a panel like plugged.host: the v3 panel (a fork of Calagopus), its
// Wings fork on the nodes, and the plugged.host features built into both.
// Static output in dist/, served by the Cloudflare Worker in wrangler.jsonc.
export default defineConfig({
	site: 'https://docs.plugged.host',
	trailingSlash: 'always',
	build: {
		// Stylesheets as files, never inline <style>: the CSP keeps styles to 'self' plus the
		// style attributes Expressive Code needs.
		inlineStylesheets: 'never',
	},
	integrations: [
		starlight({
			title: 'plugged.host docs',
			description:
				'How to run a panel like plugged.host: the v3 panel (a fork of Calagopus), its Wings fork, and every plugged.host feature with its setup.',
			logo: { src: './src/assets/logo.png', alt: '' },
			favicon: '/favicon.png',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/plugged-host/panel' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/plugged-host-1502647500295635085' },
			],
			editLink: { baseUrl: 'https://github.com/plugged-host/docs/edit/main/' },
			customCss: ['./src/styles/fonts.css', './src/styles/theme.css'],
			components: {
				SiteTitle: './src/components/SiteTitle.astro',
				SocialIcons: './src/components/SocialIcons.astro',
				// Dark only, like the panel.
				ThemeProvider: './src/components/ThemeProvider.astro',
				ThemeSelect: './src/components/ThemeSelect.astro',
			},
			expressiveCode: {
				themes: ['github-dark-default'],
				// Plain code frames everywhere: no terminal window with its three dots.
				defaultProps: { frame: 'code' },
				styleOverrides: {
					// The panel's code well: the raise over the page floor, rounded-xl, no edge.
					borderRadius: '0.75rem',
					borderColor: 'transparent',
					codeBackground: '#17191c',
					codeFontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
					uiFontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
					frames: {
						frameBoxShadowCssValue: 'none',
						editorBackground: '#17191c',
						editorTabBarBackground: '#17191c',
						editorActiveTabBackground: '#17191c',
						editorActiveTabIndicatorTopColor: 'transparent',
						editorActiveTabIndicatorBottomColor: 'transparent',
						editorTabBarBorderBottomColor: 'rgb(255 255 255 / 0.05)',
						terminalBackground: '#17191c',
						terminalTitlebarBackground: '#17191c',
						terminalTitlebarBorderBottomColor: 'rgb(255 255 255 / 0.05)',
					},
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
						'panel/database',
						'panel/install',
						'panel/web-server',
						'panel/first-admin',
						'panel/configuration',
						'panel/updating',
						'panel/building',
						'panel/branding',
						'panel/troubleshooting',
					],
				},
				{
					label: 'Nodes',
					items: [
						'nodes/wings',
						'nodes/eggs',
						'nodes/telemetry',
						'nodes/placement',
						'nodes/allocations',
						'nodes/failover',
					],
				},
				{
					label: 'Servers',
					items: [
						'servers/create-server',
						'servers/server-settings',
						'servers/startup-commands',
						'servers/moving-servers',
						'servers/allowance-cuts',
						'servers/backups',
						'servers/subdomains',
						'servers/server-chat',
						'servers/devboxes',
					],
				},
				{
					label: 'Starting servers',
					items: ['starts/start-gates', 'starts/start-queue', 'starts/limbo'],
				},
				{
					label: 'Games',
					items: ['games/minecraft', 'games/fivem'],
				},
				{
					label: 'Accounts',
					items: [
						'accounts/noprofit',
						'accounts/admin-users',
						'accounts/notifications',
						'accounts/welcome-tour',
						'accounts/reviews',
						'accounts/languages',
					],
				},
				{
					label: 'Economy and ads',
					items: ['economy/credits-and-tokens', 'economy/ads', 'economy/partners'],
				},
				{
					label: 'Safety',
					items: ['safety/abuse', 'safety/standing', 'safety/suspension'],
				},
				{
					label: 'Discord and AI',
					items: ['discord/integration', 'discord/rux', 'ai/neo', 'ai/neo-discord'],
				},
				{
					label: 'Status page and website',
					items: ['status/status-page', 'status/status-worker', 'status/website'],
				},
				{
					label: 'Reference',
					items: ['reference/architecture', 'reference/versions', 'reference/commands'],
				},
			],
		}),
	],
});
