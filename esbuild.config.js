const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Files to bundle
const entryPoints = [
	'nodes/MTProto/MTProto.node.ts',
	'nodes/MTProto/MTProtoAuth.node.ts',
	'nodes/MTProto/MTProtoTrigger.node.ts',
	'credentials/MTProtoApi.credentials.ts',
];

async function build() {
	// Clean dist directory
	if (fs.existsSync('dist')) {
		fs.rmSync('dist', { recursive: true });
	}
	fs.mkdirSync('dist', { recursive: true });
	fs.mkdirSync('dist/nodes/MTProto', { recursive: true });
	fs.mkdirSync('dist/credentials', { recursive: true });

	// Bundle each entry point
	for (const entry of entryPoints) {
		const outfile = entry
			.replace('.ts', '.js')
			.replace('nodes/', 'dist/nodes/')
			.replace('credentials/', 'dist/credentials/');

		console.log(`Bundling ${entry} -> ${outfile}`);

		await esbuild.build({
			entryPoints: [entry],
			bundle: true,
			platform: 'node',
			target: 'node18',
			outfile,
			format: 'cjs',
			external: [
				'n8n-workflow',
				'n8n-core',
			],
			sourcemap: true,
			minify: false,
			keepNames: true,
			// Handle native modules
			loader: {
				'.node': 'file',
			},
		});
	}

	// Copy static assets
	const svgSrc = 'nodes/MTProto/telegram.svg';
	const svgDst = 'dist/nodes/MTProto/telegram.svg';
	if (fs.existsSync(svgSrc)) {
		fs.copyFileSync(svgSrc, svgDst);
		console.log(`Copied ${svgSrc} -> ${svgDst}`);
	}

	// Copy SVG for credentials
	const credSvgSrc = 'credentials/telegram.svg';
	const credSvgDst = 'dist/credentials/telegram.svg';
	if (fs.existsSync(credSvgSrc)) {
		fs.copyFileSync(credSvgSrc, credSvgDst);
		console.log(`Copied ${credSvgSrc} -> ${credSvgDst}`);
	}

	console.log('Build completed successfully!');
}

build().catch((err) => {
	console.error('Build failed:', err);
	process.exit(1);
});
