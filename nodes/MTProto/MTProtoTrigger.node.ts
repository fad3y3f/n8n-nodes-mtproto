import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

export class MTProtoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Telegram MTProto Trigger',
		name: 'mtProtoTrigger',
		icon: 'file:telegram.svg',
		group: ['trigger'],
		version: 1,
		subtitle: 'Listen for Telegram events',
		description: 'Triggers workflow on Telegram events using MTProto protocol',
		defaults: {
			name: 'MTProto Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'mtProtoApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				options: [
					{
						name: 'New Message',
						value: 'newMessage',
						description: 'Trigger on new messages',
					},
					{
						name: 'Edit Message',
						value: 'editMessage',
						description: 'Trigger when a message is edited',
					},
					{
						name: 'Delete Message',
						value: 'deleteMessage',
						description: 'Trigger when a message is deleted',
					},
					{
						name: 'New Chat Member',
						value: 'chatAction',
						description: 'Trigger on chat member changes',
					},
				],
				default: 'newMessage',
			},
			{
				displayName: 'Chat Filter',
				name: 'chatFilter',
				type: 'options',
				options: [
					{
						name: 'All Chats',
						value: 'all',
					},
					{
						name: 'Private Chats Only',
						value: 'private',
					},
					{
						name: 'Groups Only',
						value: 'groups',
					},
					{
						name: 'Channels Only',
						value: 'channels',
					},
					{
						name: 'Specific Chat',
						value: 'specific',
					},
				],
				default: 'all',
			},
			{
				displayName: 'Chat ID',
				name: 'specificChatId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						chatFilter: ['specific'],
					},
				},
				description: 'ID or username of specific chat to listen to',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Incoming Only',
						name: 'incomingOnly',
						type: 'boolean',
						default: true,
						description: 'Whether to trigger only for incoming messages (not own messages)',
					},
					{
						displayName: 'Include Reply Info',
						name: 'includeReply',
						type: 'boolean',
						default: false,
						description: 'Whether to include information about replied message',
					},
				],
			},
		],
	};

	// Note: This is a placeholder for trigger functionality
	// Full trigger implementation requires n8n's webhook or polling mechanism
	// which is handled differently than regular nodes
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Trigger nodes work differently - they start a listener
		// This execute method would be called when manually testing
		const credentials = await this.getCredentials('mtProtoApi');

		const session = new StringSession(credentials.sessionString as string || '');
		const client = new TelegramClient(
			session,
			credentials.apiId as number,
			credentials.apiHash as string,
			{ connectionRetries: 5 }
		);

		await client.connect();

		// Get latest message as a test
		const dialogs = await client.getDialogs({ limit: 1 });
		const latestMessage = dialogs[0]?.message;

		await client.disconnect();

		if (latestMessage) {
			return [[{
				json: {
					id: latestMessage.id,
					date: latestMessage.date,
					message: latestMessage.message,
					peerId: latestMessage.peerId?.toString(),
					out: latestMessage.out,
				}
			}]];
		}

		return [[]];
	}
}
