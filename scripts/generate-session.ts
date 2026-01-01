import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as readline from 'readline';

/**
 * Session Generator Script
 * Run this script to generate a session string for your Telegram account
 * Usage: npx ts-node scripts/generate-session.ts
 */

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

function question(prompt: string): Promise<string> {
	return new Promise((resolve) => {
		rl.question(prompt, resolve);
	});
}

async function main() {
	console.log('=== Telegram MTProto Session Generator ===\n');

	const apiId = parseInt(await question('Enter your API ID: '), 10);
	const apiHash = await question('Enter your API Hash: ');
	const phoneNumber = await question('Enter your phone number (with country code, e.g., +1234567890): ');

	const session = new StringSession('');
	const client = new TelegramClient(session, apiId, apiHash, {
		connectionRetries: 5,
		deviceModel: 'n8n MTProto Node',
		systemVersion: '1.0.0',
		appVersion: '1.0.0',
	});

	await client.start({
		phoneNumber: async () => phoneNumber,
		password: async () => await question('Enter your 2FA password (leave empty if not set): '),
		phoneCode: async () => await question('Enter the code you received: '),
		onError: (err) => {
			console.error('Error:', err.message);
		},
	});

	console.log('\n=== SUCCESS ===');
	console.log('You are now logged in!');
	console.log('\nYour session string (copy this to n8n credentials):');
	console.log('\n' + client.session.save());
	console.log('\n=== IMPORTANT ===');
	console.log('Save this session string securely. It allows access to your Telegram account.');
	console.log('Do not share it with anyone!');

	await client.disconnect();
	rl.close();
}

main().catch(console.error);
