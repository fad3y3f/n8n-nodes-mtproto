import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { MTProtoClient } from './MTProtoClient';

export class MTProto implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Telegram MTProto',
		name: 'mtProto',
		icon: 'file:telegram.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Telegram using MTProto protocol',
		defaults: {
			name: 'Telegram MTProto',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'mtProtoApi',
				required: true,
			},
		],
		properties: [
			// Resource
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account',
						value: 'account',
					},
					{
						name: 'Channel',
						value: 'channel',
					},
					{
						name: 'Chat',
						value: 'chat',
					},
					{
						name: 'Contact',
						value: 'contact',
					},
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'User',
						value: 'user',
					},
				],
				default: 'message',
			},

			// ========== ACCOUNT OPERATIONS ==========
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['account'],
					},
				},
				options: [
					{
						name: 'Get Me',
						value: 'getMe',
						description: 'Get current account information',
						action: 'Get current account information',
					},
					{
						name: 'Get Session String',
						value: 'getSession',
						description: 'Generate session string for persistent login',
						action: 'Generate session string',
					},
					{
						name: 'Log Out',
						value: 'logOut',
						description: 'Log out from the current session',
						action: 'Log out from session',
					},
				],
				default: 'getMe',
			},

			// ========== MESSAGE OPERATIONS ==========
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete messages',
						action: 'Delete messages',
					},
					{
						name: 'Edit',
						value: 'edit',
						description: 'Edit a message',
						action: 'Edit a message',
					},
					{
						name: 'Forward',
						value: 'forward',
						description: 'Forward messages',
						action: 'Forward messages',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get multiple messages',
						action: 'Get multiple messages',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search messages',
						action: 'Search messages',
					},
					{
						name: 'Send',
						value: 'send',
						description: 'Send a message',
						action: 'Send a message',
					},
					{
						name: 'Send Media',
						value: 'sendMedia',
						description: 'Send a photo or document',
						action: 'Send media',
					},
				],
				default: 'send',
			},

			// ========== CHAT OPERATIONS ==========
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['chat'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get chat information',
						action: 'Get chat information',
					},
					{
						name: 'Get All',
						value: 'getAll',
						description: 'Get all dialogs/chats',
						action: 'Get all dialogs',
					},
					{
						name: 'Get Members',
						value: 'getMembers',
						description: 'Get chat members',
						action: 'Get chat members',
					},
					{
						name: 'Leave',
						value: 'leave',
						description: 'Leave a chat',
						action: 'Leave a chat',
					},
				],
				default: 'getAll',
			},

			// ========== CHANNEL OPERATIONS ==========
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['channel'],
					},
				},
				options: [
					{
						name: 'Get Info',
						value: 'getInfo',
						description: 'Get channel information',
						action: 'Get channel information',
					},
					{
						name: 'Get Members',
						value: 'getMembers',
						description: 'Get channel members/subscribers',
						action: 'Get channel members',
					},
					{
						name: 'Join',
						value: 'join',
						description: 'Join a channel',
						action: 'Join a channel',
					},
					{
						name: 'Leave',
						value: 'leave',
						description: 'Leave a channel',
						action: 'Leave a channel',
					},
				],
				default: 'getInfo',
			},

			// ========== CONTACT OPERATIONS ==========
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['contact'],
					},
				},
				options: [
					{
						name: 'Get All',
						value: 'getAll',
						description: 'Get all contacts',
						action: 'Get all contacts',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search for users globally',
						action: 'Search for users',
					},
				],
				default: 'getAll',
			},

			// ========== USER OPERATIONS ==========
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['user'],
					},
				},
				options: [
					{
						name: 'Get By Username',
						value: 'getByUsername',
						description: 'Get user by their @username',
						action: 'Get user by username',
					},
					{
						name: 'Get From Channel',
						value: 'getFromChannel',
						description: 'Get user by ID from a channel/chat where they are a member',
						action: 'Get user from channel',
					},
					{
						name: 'Get From Contacts',
						value: 'getFromContacts',
						description: 'Get user from your contacts list',
						action: 'Get user from contacts',
					},
				],
				default: 'getByUsername',
			},

			// ========== COMMON FIELDS ==========

			// Chat/Channel/User ID
			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['message', 'chat', 'channel'],
						operation: ['send', 'sendMedia', 'getMany', 'search', 'get', 'getInfo', 'getMembers', 'leave', 'edit', 'delete', 'forward'],
					},
				},
				description: 'Chat ID, username, or phone number. Can be @username, +phone, or numeric ID.',
			},

			// Chat ID for user.getFromChat
			// Username field for getByUsername
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				required: true,
				default: '',
				placeholder: '@username',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['getByUsername'],
					},
				},
				description: 'Username to search (with or without @)',
			},

			// User ID for getFromChannel and getFromContacts
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['getFromChannel', 'getFromContacts'],
					},
				},
				description: 'Numeric user ID, @username, or phone number (for contacts)',
			},

			// Channel ID for getFromChannel
			{
				displayName: 'Channel/Chat ID',
				name: 'sourceChannelId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['getFromChannel'],
					},
				},
				description: 'Channel or chat ID where the user is a member',
			},

			// Channel to join
			{
				displayName: 'Channel',
				name: 'channel',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['join'],
					},
				},
				description: 'Channel username or invite link',
			},

			// Message text
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send', 'edit'],
					},
				},
				description: 'Message text to send',
			},

			// Message ID for edit/delete
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'number',
				required: true,
				default: 0,
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['edit', 'delete'],
					},
				},
				description: 'ID of the message to edit or delete',
			},

			// Message IDs for forward
			{
				displayName: 'Message IDs',
				name: 'messageIds',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['forward'],
					},
				},
				description: 'Comma-separated list of message IDs to forward',
			},

			// Destination chat for forward
			{
				displayName: 'Destination Chat',
				name: 'destinationChat',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['forward'],
					},
				},
				description: 'Chat ID to forward messages to',
			},

			// Search query
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['message', 'contact'],
						operation: ['search'],
					},
				},
				description: 'Search query',
			},

			// Media type
			{
				displayName: 'Media Type',
				name: 'mediaType',
				type: 'options',
				options: [
					{
						name: 'Photo',
						value: 'photo',
					},
					{
						name: 'Document',
						value: 'document',
					},
				],
				default: 'photo',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['sendMedia'],
					},
				},
				description: 'Type of media to send',
			},

			// Binary property for media
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['sendMedia'],
					},
				},
				description: 'Name of the binary property containing the file data',
			},

			// Caption for media
			{
				displayName: 'Caption',
				name: 'caption',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['sendMedia'],
					},
				},
				description: 'Caption for the media',
			},

			// Filter type for channel members
			{
				displayName: 'Participants Type',
				name: 'participantsType',
				type: 'options',
				default: 'recent',
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['getMembers'],
					},
				},
				options: [
					{
						name: 'Recent',
						value: 'recent',
						description: 'Recent participants',
					},
					{
						name: 'Admins',
						value: 'admins',
						description: 'Channel administrators',
					},
					{
						name: 'Kicked',
						value: 'kicked',
						description: 'Kicked users',
					},
					{
						name: 'Banned',
						value: 'banned',
						description: 'Banned users',
					},
				],
				description: 'Type of participants to retrieve',
			},

			// Return All toggle for channel getMembers
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['getMembers'],
					},
				},
				description: 'Whether to return all members or only up to the limit',
			},

			// Limit for get operations
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				displayOptions: {
					show: {
						resource: ['message', 'chat', 'contact'],
						operation: ['getMany', 'getAll', 'search', 'getMembers'],
					},
				},
				description: 'Maximum number of items to return',
			},

			// Limit for channel members (shown when Return All is false)
			{
				displayName: 'Limit',
				name: 'limitMembers',
				type: 'number',
				default: 200,
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['getMembers'],
						returnAll: [false],
					},
				},
				description: 'Maximum number of members to return',
			},

			// Additional options
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send', 'sendMedia'],
					},
				},
				options: [
					{
						displayName: 'Parse Mode',
						name: 'parseMode',
						type: 'options',
						options: [
							{
								name: 'None',
								value: 'none',
							},
							{
								name: 'HTML',
								value: 'html',
							},
							{
								name: 'Markdown',
								value: 'md',
							},
						],
						default: 'none',
						description: 'Message formatting mode',
					},
					{
						displayName: 'Silent',
						name: 'silent',
						type: 'boolean',
						default: false,
						description: 'Whether to send the message silently (no notification)',
					},
					{
						displayName: 'Reply To Message ID',
						name: 'replyTo',
						type: 'number',
						default: 0,
						description: 'ID of the message to reply to',
					},
					{
						displayName: 'Schedule Date',
						name: 'scheduleDate',
						type: 'dateTime',
						default: '',
						description: 'Date and time to schedule the message',
					},
				],
			},

			// Message history options
			{
				displayName: 'Options',
				name: 'historyOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['getMany'],
					},
				},
				options: [
					{
						displayName: 'Offset ID',
						name: 'offsetId',
						type: 'number',
						default: 0,
						description: 'Message ID to start from (for pagination)',
					},
					{
						displayName: 'Min ID',
						name: 'minId',
						type: 'number',
						default: 0,
						description: 'Minimum message ID to return',
					},
					{
						displayName: 'Max ID',
						name: 'maxId',
						type: 'number',
						default: 0,
						description: 'Maximum message ID to return',
					},
				],
			},

			// Search options
			{
				displayName: 'Options',
				name: 'searchOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['search'],
					},
				},
				options: [
					{
						displayName: 'From User',
						name: 'fromUser',
						type: 'string',
						default: '',
						description: 'Filter messages from specific user',
					},
					{
						displayName: 'Filter Type',
						name: 'filterType',
						type: 'options',
						options: [
							{
								name: 'All',
								value: 'all',
							},
							{
								name: 'Photos',
								value: 'photos',
							},
							{
								name: 'Videos',
								value: 'videos',
							},
							{
								name: 'Documents',
								value: 'documents',
							},
							{
								name: 'Links',
								value: 'links',
							},
							{
								name: 'Voice Messages',
								value: 'voice',
							},
						],
						default: 'all',
						description: 'Filter by message type',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('mtProtoApi');
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const client = new MTProtoClient({
			apiId: credentials.apiId as number,
			apiHash: credentials.apiHash as string,
			phoneNumber: credentials.phoneNumber as string,
			sessionString: credentials.sessionString as string,
			twoFactorPassword: credentials.twoFactorPassword as string,
			deviceModel: credentials.deviceModel as string,
			systemVersion: credentials.systemVersion as string,
			appVersion: credentials.appVersion as string,
		});

		try {
			await client.connect();

			for (let i = 0; i < items.length; i++) {
				try {
					let result: any;

					// ========== ACCOUNT ==========
					if (resource === 'account') {
						if (operation === 'getMe') {
							result = await client.getMe();
						} else if (operation === 'getSession') {
							result = await client.getSessionString();
						} else if (operation === 'logOut') {
							result = await client.logOut();
						}
					}

					// ========== MESSAGE ==========
					else if (resource === 'message') {
						const chatId = this.getNodeParameter('chatId', i) as string;

						if (operation === 'send') {
							const message = this.getNodeParameter('message', i) as string;
							const options = this.getNodeParameter('options', i) as {
								parseMode?: string;
								silent?: boolean;
								replyTo?: number;
								scheduleDate?: string;
							};
							result = await client.sendMessage(chatId, message, options);
						} else if (operation === 'sendMedia') {
							const mediaType = this.getNodeParameter('mediaType', i) as string;
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
							const caption = this.getNodeParameter('caption', i) as string;
							const options = this.getNodeParameter('options', i) as any;

							const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
							const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

							result = await client.sendMedia(chatId, {
								type: mediaType,
								buffer,
								filename: binaryData.fileName || 'file',
								mimeType: binaryData.mimeType,
								caption,
								...options,
							});
						} else if (operation === 'getMany') {
							const limit = this.getNodeParameter('limit', i) as number;
							const historyOptions = this.getNodeParameter('historyOptions', i) as any;
							result = await client.getMessages(chatId, { limit, ...historyOptions });
						} else if (operation === 'search') {
							const query = this.getNodeParameter('query', i) as string;
							const limit = this.getNodeParameter('limit', i) as number;
							const searchOptions = this.getNodeParameter('searchOptions', i) as any;
							result = await client.searchMessages(chatId, query, { limit, ...searchOptions });
						} else if (operation === 'edit') {
							const messageId = this.getNodeParameter('messageId', i) as number;
							const message = this.getNodeParameter('message', i) as string;
							result = await client.editMessage(chatId, messageId, message);
						} else if (operation === 'delete') {
							const messageId = this.getNodeParameter('messageId', i) as number;
							result = await client.deleteMessages(chatId, [messageId]);
						} else if (operation === 'forward') {
							const messageIds = (this.getNodeParameter('messageIds', i) as string)
								.split(',')
								.map(id => parseInt(id.trim(), 10));
							const destinationChat = this.getNodeParameter('destinationChat', i) as string;
							result = await client.forwardMessages(chatId, destinationChat, messageIds);
						}
					}

					// ========== CHAT ==========
					else if (resource === 'chat') {
						if (operation === 'getAll') {
							const limit = this.getNodeParameter('limit', i) as number;
							result = await client.getDialogs(limit);
						} else if (operation === 'get') {
							const chatId = this.getNodeParameter('chatId', i) as string;
							result = await client.getChatInfo(chatId);
						} else if (operation === 'getMembers') {
							const chatId = this.getNodeParameter('chatId', i) as string;
							const limit = this.getNodeParameter('limit', i) as number;
							result = await client.getChatMembers(chatId, limit);
						} else if (operation === 'leave') {
							const chatId = this.getNodeParameter('chatId', i) as string;
							result = await client.leaveChat(chatId);
						}
					}

					// ========== CHANNEL ==========
					else if (resource === 'channel') {
						if (operation === 'join') {
							const channel = this.getNodeParameter('channel', i) as string;
							result = await client.joinChannel(channel);
						} else if (operation === 'leave') {
							const chatId = this.getNodeParameter('chatId', i) as string;
							result = await client.leaveChannel(chatId);
						} else if (operation === 'getInfo') {
							const chatId = this.getNodeParameter('chatId', i) as string;
							result = await client.getChannelInfo(chatId);
						} else if (operation === 'getMembers') {
							const chatId = this.getNodeParameter('chatId', i) as string;
							const participantsType = this.getNodeParameter('participantsType', i) as string;
							const returnAll = this.getNodeParameter('returnAll', i) as boolean;
							const limit = returnAll ? 0 : this.getNodeParameter('limitMembers', i) as number;
							result = await client.getChannelMembers(chatId, limit, returnAll, participantsType);
						}
					}

					// ========== CONTACT ==========
					else if (resource === 'contact') {
						if (operation === 'getAll') {
							result = await client.getContacts();
						} else if (operation === 'search') {
							const query = this.getNodeParameter('query', i) as string;
							const limit = this.getNodeParameter('limit', i) as number;
							result = await client.searchGlobal(query, limit);
						}
					}

					// ========== USER ==========
					else if (resource === 'user') {
						if (operation === 'getByUsername') {
							const username = this.getNodeParameter('username', i) as string;
							result = await client.getUserByUsername(username);
						} else if (operation === 'getFromChannel') {
							const userId = this.getNodeParameter('userId', i) as string;
							const sourceChannelId = this.getNodeParameter('sourceChannelId', i) as string;
							result = await client.getUserFromChannel(userId, sourceChannelId);
						} else if (operation === 'getFromContacts') {
							const userId = this.getNodeParameter('userId', i) as string;
							result = await client.getUserFromContacts(userId);
						}
					}

					// Process result
					if (Array.isArray(result)) {
						returnData.push(...result.map(item => ({ json: item })));
					} else {
						returnData.push({ json: result || { success: true } });
					}
				} catch (error) {
					if (this.continueOnFail()) {
						returnData.push({ json: { error: (error as Error).message } });
						continue;
					}
					throw error;
				}
			}
		} finally {
			await client.disconnect();
		}

		return [returnData];
	}
}
