import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MTProtoApi implements ICredentialType {
	name = 'mtProtoApi';
	displayName = 'MTProto API';
	documentationUrl = 'https://core.telegram.org/api/obtaining_api_id';
	icon = 'file:telegram.svg' as const;
	properties: INodeProperties[] = [
		{
			displayName: 'API ID',
			name: 'apiId',
			type: 'number',
			default: 0,
			required: true,
			description: 'Your Telegram API ID from my.telegram.org',
		},
		{
			displayName: 'API Hash',
			name: 'apiHash',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Telegram API Hash from my.telegram.org',
		},
		{
			displayName: 'Phone Number',
			name: 'phoneNumber',
			type: 'string',
			default: '',
			required: true,
			placeholder: '+1234567890',
			description: 'Phone number with country code (e.g., +1234567890)',
		},
		{
			displayName: 'Session String',
			name: 'sessionString',
			type: 'string',
			typeOptions: {
				password: true,
				rows: 4,
			},
			default: '',
			description: 'Session string for persistent login. Use MTProto Auth node to generate it.',
		},
		{
			displayName: '2FA Password',
			name: 'twoFactorPassword',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Two-factor authentication password (if enabled)',
		},
		{
			displayName: 'Device Model',
			name: 'deviceModel',
			type: 'string',
			default: 'n8n MTProto Node',
			description: 'Device model shown in Telegram sessions',
		},
		{
			displayName: 'System Version',
			name: 'systemVersion',
			type: 'string',
			default: '1.0.0',
			description: 'System version shown in Telegram sessions',
		},
		{
			displayName: 'App Version',
			name: 'appVersion',
			type: 'string',
			default: '1.0.0',
			description: 'Application version shown in Telegram sessions',
		},
	];
}
