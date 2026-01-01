import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { CustomFile } from 'telegram/client/uploads';
import { Logger, LogLevel } from 'telegram/extensions/Logger';
import bigInt from 'big-integer';

export interface MTProtoCredentials {
	apiId: number;
	apiHash: string;
	phoneNumber: string;
	sessionString?: string;
	twoFactorPassword?: string;
	deviceModel?: string;
	systemVersion?: string;
	appVersion?: string;
}

export interface SendMessageOptions {
	parseMode?: string;
	silent?: boolean;
	replyTo?: number;
	scheduleDate?: string;
}

export interface SendMediaOptions {
	type: 'photo' | 'document';
	buffer: Buffer;
	filename: string;
	mimeType?: string;
	caption?: string;
	parseMode?: string;
	silent?: boolean;
	replyTo?: number;
}

export interface GetMessagesOptions {
	limit?: number;
	offsetId?: number;
	minId?: number;
	maxId?: number;
}

export interface SearchOptions {
	limit?: number;
	fromUser?: string;
	filterType?: string;
}

export class MTProtoClient {
	private client: TelegramClient;
	private credentials: MTProtoCredentials;
	private isConnected: boolean = false;

	constructor(credentials: MTProtoCredentials) {
		this.credentials = credentials;
		const session = new StringSession(credentials.sessionString || '');

		// Suppress gramJS logging to reduce noise
		const logger = new Logger(LogLevel.NONE);

		this.client = new TelegramClient(
			session,
			credentials.apiId,
			credentials.apiHash,
			{
				connectionRetries: 5,
				deviceModel: credentials.deviceModel || 'n8n MTProto Node',
				systemVersion: credentials.systemVersion || '1.0.0',
				appVersion: credentials.appVersion || '1.0.0',
				autoReconnect: false,
				baseLogger: logger,
			}
		);
	}

	async connect(): Promise<void> {
		if (this.isConnected) return;

		// Use connect() instead of start() to avoid update loop for existing sessions
		if (this.credentials.sessionString) {
			await this.client.connect();
		} else {
			await this.client.start({
				phoneNumber: async () => this.credentials.phoneNumber,
				password: async () => this.credentials.twoFactorPassword || '',
				phoneCode: async () => {
					throw new Error(
						'Phone code required. Please generate a session string first using Telegram authentication flow.'
					);
				},
				onError: (err) => {
					throw err;
				},
			});
		}

		this.isConnected = true;
	}

	async disconnect(): Promise<void> {
		if (this.isConnected) {
			// Disconnect without waiting for updates to finish
			try {
				await this.client.disconnect();
			} catch (e) {
				// Ignore disconnect errors
			}
			this.isConnected = false;
		}
	}

	async getSessionString(): Promise<{ sessionString: string }> {
		const session = this.client.session.save() as unknown as string;
		return { sessionString: session };
	}

	async getMe(): Promise<any> {
		const me = await this.client.getMe();
		return this.formatUser(me);
	}

	async logOut(): Promise<{ success: boolean }> {
		await this.client.invoke(new Api.auth.LogOut());
		return { success: true };
	}

	// ========== MESSAGE OPERATIONS ==========

	async sendMessage(chatId: string, message: string, options: SendMessageOptions = {}): Promise<any> {
		const peer = await this.resolvePeer(chatId);

		const result = await this.client.sendMessage(peer, {
			message,
			parseMode: options.parseMode === 'html' ? 'html' : options.parseMode === 'md' ? 'md' : undefined,
			silent: options.silent,
			replyTo: options.replyTo,
			schedule: options.scheduleDate ? Math.floor(new Date(options.scheduleDate).getTime() / 1000) : undefined,
		});

		return this.formatMessage(result);
	}

	async sendMedia(chatId: string, options: SendMediaOptions): Promise<any> {
		const peer = await this.resolvePeer(chatId);

		const file = new CustomFile(options.filename, options.buffer.length, '', options.buffer);

		const result = await this.client.sendFile(peer, {
			file,
			caption: options.caption,
			parseMode: options.parseMode === 'html' ? 'html' : options.parseMode === 'md' ? 'md' : undefined,
			silent: options.silent,
			replyTo: options.replyTo,
			forceDocument: options.type === 'document',
		});

		return this.formatMessage(result);
	}

	async getMessages(chatId: string, options: GetMessagesOptions = {}): Promise<any[]> {
		const peer = await this.resolvePeer(chatId);

		const messages = await this.client.getMessages(peer, {
			limit: options.limit || 50,
			offsetId: options.offsetId,
			minId: options.minId,
			maxId: options.maxId,
		});

		return messages.map(msg => this.formatMessage(msg));
	}

	async searchMessages(chatId: string, query: string, options: SearchOptions = {}): Promise<any[]> {
		const peer = await this.resolvePeer(chatId);

		let filter: Api.TypeMessagesFilter | undefined;
		switch (options.filterType) {
			case 'photos':
				filter = new Api.InputMessagesFilterPhotos();
				break;
			case 'videos':
				filter = new Api.InputMessagesFilterVideo();
				break;
			case 'documents':
				filter = new Api.InputMessagesFilterDocument();
				break;
			case 'links':
				filter = new Api.InputMessagesFilterUrl();
				break;
			case 'voice':
				filter = new Api.InputMessagesFilterVoice();
				break;
		}

		const messages = await this.client.getMessages(peer, {
			search: query,
			limit: options.limit || 50,
			filter,
			fromUser: options.fromUser ? await this.resolvePeer(options.fromUser) : undefined,
		});

		return messages.map(msg => this.formatMessage(msg));
	}

	async editMessage(chatId: string, messageId: number, text: string): Promise<any> {
		const peer = await this.resolvePeer(chatId);

		const result = await this.client.editMessage(peer, {
			message: messageId,
			text,
		});

		return this.formatMessage(result);
	}

	async deleteMessages(chatId: string, messageIds: number[]): Promise<{ success: boolean; deletedCount: number }> {
		const peer = await this.resolvePeer(chatId);

		await this.client.deleteMessages(peer, messageIds, { revoke: true });

		return { success: true, deletedCount: messageIds.length };
	}

	async forwardMessages(fromChatId: string, toChatId: string, messageIds: number[]): Promise<any[]> {
		const fromPeer = await this.resolvePeer(fromChatId);
		const toPeer = await this.resolvePeer(toChatId);

		const result = await this.client.forwardMessages(toPeer, {
			messages: messageIds,
			fromPeer,
		});

		if (Array.isArray(result)) {
			return result.map(msg => this.formatMessage(msg));
		}
		return [this.formatMessage(result)];
	}

	// ========== CHAT/DIALOG OPERATIONS ==========

	async getDialogs(limit: number = 50): Promise<any[]> {
		const dialogs = await this.client.getDialogs({ limit });

		return dialogs.map(dialog => ({
			id: dialog.id?.toString(),
			title: dialog.title,
			name: dialog.name,
			unreadCount: dialog.unreadCount,
			unreadMentionsCount: dialog.unreadMentionsCount,
			isUser: dialog.isUser,
			isGroup: dialog.isGroup,
			isChannel: dialog.isChannel,
			date: dialog.date,
			lastMessage: dialog.message ? this.formatMessage(dialog.message) : null,
		}));
	}

	async getChatInfo(chatId: string): Promise<any> {
		const entity = await this.client.getEntity(chatId);
		return this.formatEntity(entity);
	}

	async getChatMembers(chatId: string, limit: number = 50): Promise<any[]> {
		const entity = await this.client.getEntity(chatId);

		if (entity instanceof Api.Chat) {
			const fullChat = await this.client.invoke(
				new Api.messages.GetFullChat({ chatId: entity.id })
			);

			if (fullChat.users) {
				return fullChat.users.slice(0, limit).map(user => this.formatUser(user));
			}
		}

		return [];
	}

	async leaveChat(chatId: string): Promise<{ success: boolean }> {
		const entity = await this.client.getEntity(chatId);

		if (entity instanceof Api.Chat) {
			await this.client.invoke(
				new Api.messages.DeleteChatUser({
					chatId: entity.id,
					userId: new Api.InputUserSelf(),
				})
			);
		}

		return { success: true };
	}

	// ========== CHANNEL OPERATIONS ==========

	async joinChannel(channel: string): Promise<any> {
		let result;

		if (channel.includes('joinchat/') || channel.includes('+')) {
			// Invite link
			const hash = channel.split('/').pop()?.replace('+', '') || channel.replace('+', '');
			result = await this.client.invoke(
				new Api.messages.ImportChatInvite({ hash })
			);
		} else {
			// Public channel
			const entity = await this.client.getEntity(channel);
			result = await this.client.invoke(
				new Api.channels.JoinChannel({
					channel: entity as unknown as Api.InputChannel,
				})
			);
		}

		return { success: true, result };
	}

	async leaveChannel(chatId: string): Promise<{ success: boolean }> {
		const entity = await this.client.getEntity(chatId);

		await this.client.invoke(
			new Api.channels.LeaveChannel({
				channel: entity as unknown as Api.InputChannel,
			})
		);

		return { success: true };
	}

	async getChannelInfo(chatId: string): Promise<any> {
		const entity = await this.client.getEntity(chatId);

		if (entity instanceof Api.Channel) {
			const fullChannel = await this.client.invoke(
				new Api.channels.GetFullChannel({
					channel: entity as unknown as Api.InputChannel,
				})
			);

			return {
				...this.formatEntity(entity),
				fullInfo: {
					about: (fullChannel.fullChat as Api.ChannelFull).about,
					participantsCount: (fullChannel.fullChat as Api.ChannelFull).participantsCount,
					adminsCount: (fullChannel.fullChat as Api.ChannelFull).adminsCount,
					kickedCount: (fullChannel.fullChat as Api.ChannelFull).kickedCount,
					bannedCount: (fullChannel.fullChat as Api.ChannelFull).bannedCount,
					linkedChatId: (fullChannel.fullChat as Api.ChannelFull).linkedChatId?.toString(),
				},
			};
		}

		return this.formatEntity(entity);
	}

	async getChannelMembers(chatId: string, limit: number = 200, returnAll: boolean = false): Promise<any[]> {
		const entity = await this.client.getEntity(chatId);

		if (entity instanceof Api.Channel) {
			const allMembers: any[] = [];
			const batchSize = 200; // Telegram API max per request
			let offset = 0;
			let hasMore = true;

			while (hasMore) {
				const currentLimit = returnAll ? batchSize : Math.min(batchSize, limit - allMembers.length);
				
				if (currentLimit <= 0) {
					break;
				}

				const result = await this.client.invoke(
					new Api.channels.GetParticipants({
						channel: entity as unknown as Api.InputChannel,
						filter: new Api.ChannelParticipantsSearch({ q: '' }), // Empty search returns all members
						offset,
						limit: currentLimit,
						hash: bigInt(0),
					})
				);

				if (result instanceof Api.channels.ChannelParticipants) {
					const users = result.users.map(user => this.formatUser(user));
					allMembers.push(...users);
					
					// Check if we got fewer results than requested (no more members)
					if (users.length < currentLimit) {
						hasMore = false;
					} else {
						offset += users.length;
					}
					
					// Stop if we reached the limit (when not returnAll)
					if (!returnAll && allMembers.length >= limit) {
						hasMore = false;
					}
				} else {
					hasMore = false;
				}
			}

			return returnAll ? allMembers : allMembers.slice(0, limit);
		}

		return [];
	}

	// ========== CONTACT OPERATIONS ==========

	async getContacts(): Promise<any[]> {
		const result = await this.client.invoke(new Api.contacts.GetContacts({ hash: bigInt(0) }));

		if (result instanceof Api.contacts.Contacts) {
			return result.users.map(user => this.formatUser(user));
		}

		return [];
	}

	async searchGlobal(query: string, limit: number = 50): Promise<any[]> {
		const result = await this.client.invoke(
			new Api.contacts.Search({
				q: query,
				limit,
			})
		);

		return [
			...result.users.map(user => this.formatUser(user)),
			...result.chats.map(chat => this.formatEntity(chat)),
		];
	}

	// ========== USER OPERATIONS ==========

	async getUserByUsername(username: string): Promise<any> {
		// Remove @ if present
		const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
		
		try {
			const resolved = await this.client.invoke(
				new Api.contacts.ResolveUsername({ username: cleanUsername })
			);
			
			if (resolved.users.length > 0) {
				return this.formatUser(resolved.users[0]);
			}
			
			throw new Error(`User with username @${cleanUsername} not found`);
		} catch (error: any) {
			if (error.message?.includes('USERNAME_NOT_OCCUPIED')) {
				throw new Error(`Username @${cleanUsername} does not exist`);
			}
			throw error;
		}
	}

	async getUserFromChannel(userId: string, channelId: string): Promise<any> {
		const entity = await this.client.getEntity(channelId);
		
		if (entity instanceof Api.Channel) {
			try {
				// First get channel participants to cache the user
				const result = await this.client.invoke(
					new Api.channels.GetParticipants({
						channel: entity as unknown as Api.InputChannel,
						filter: new Api.ChannelParticipantsSearch({ q: '' }),
						offset: 0,
						limit: 200,
						hash: bigInt(0),
					})
				);
				
				if (result instanceof Api.channels.ChannelParticipants) {
					const user = result.users.find((u: any) => u.id?.toString() === userId);
					if (user) {
						return this.formatUser(user);
					}
				}
				
				// If not found in first batch, try pagination
				let offset = 200;
				let found = false;
				
				while (!found) {
					const moreResult = await this.client.invoke(
						new Api.channels.GetParticipants({
							channel: entity as unknown as Api.InputChannel,
							filter: new Api.ChannelParticipantsSearch({ q: '' }),
							offset,
							limit: 200,
							hash: bigInt(0),
						})
					);
					
					if (moreResult instanceof Api.channels.ChannelParticipants) {
						if (moreResult.users.length === 0) {
							break; // No more users
						}
						
						const user = moreResult.users.find((u: any) => u.id?.toString() === userId);
						if (user) {
							return this.formatUser(user);
						}
						
						offset += moreResult.users.length;
					} else {
						break;
					}
				}
				
				throw new Error(`User ${userId} not found in channel ${channelId}`);
			} catch (error: any) {
				if (error.message?.includes('not found')) {
					throw error;
				}
				throw new Error(`Failed to get user from channel: ${error.message}`);
			}
		}
		
		// For regular chats/groups
		if (entity instanceof Api.Chat) {
			const fullChat = await this.client.invoke(
				new Api.messages.GetFullChat({ chatId: entity.id })
			);
			
			const user = fullChat.users.find((u: any) => u.id?.toString() === userId);
			if (user) {
				return this.formatUser(user);
			}
			
			throw new Error(`User ${userId} not found in chat ${channelId}`);
		}
		
		throw new Error(`${channelId} is not a channel or chat`);
	}

	async getUserFromContacts(userId: string): Promise<any> {
		const contacts = await this.client.invoke(new Api.contacts.GetContacts({ hash: bigInt(0) }));
		
		if (contacts instanceof Api.contacts.Contacts) {
			// Search by ID
			let user = contacts.users.find((u: any) => u.id?.toString() === userId);
			
			// If not found by ID, try by username
			if (!user && userId.startsWith('@')) {
				const cleanUsername = userId.slice(1).toLowerCase();
				user = contacts.users.find((u: any) => u.username?.toLowerCase() === cleanUsername);
			}
			
			// Try by phone number
			if (!user && userId.startsWith('+')) {
				const cleanPhone = userId.replace(/[^\d]/g, '');
				user = contacts.users.find((u: any) => u.phone?.replace(/[^\d]/g, '') === cleanPhone);
			}
			
			if (user) {
				return this.formatUser(user);
			}
		}
		
		throw new Error(`User ${userId} not found in contacts. Make sure the user is in your contact list.`);
	}

	// ========== HELPER METHODS ==========

	private async resolvePeer(identifier: string): Promise<Api.TypeEntityLike> {
		// Handle numeric IDs
		if (/^-?\d+$/.test(identifier)) {
			return await this.client.getEntity(parseInt(identifier, 10));
		}

		// Handle usernames and phone numbers
		return await this.client.getEntity(identifier);
	}

	private formatMessage(message: any): any {
		if (!message) return null;

		return {
			id: message.id,
			date: message.date,
			message: message.message || message.text,
			out: message.out,
			mentioned: message.mentioned,
			mediaUnread: message.mediaUnread,
			silent: message.silent,
			post: message.post,
			fromScheduled: message.fromScheduled,
			editDate: message.editDate,
			postAuthor: message.postAuthor,
			views: message.views,
			forwards: message.forwards,
			replyToMsgId: message.replyTo?.replyToMsgId,
			fromId: message.fromId?.userId?.toString() || message.fromId?.channelId?.toString(),
			peerId: message.peerId?.userId?.toString() ||
				message.peerId?.chatId?.toString() ||
				message.peerId?.channelId?.toString(),
			hasMedia: !!message.media,
			mediaType: message.media?.className,
		};
	}

	private formatUser(user: any): any {
		if (!user) return null;

		return {
			id: user.id?.toString(),
			accessHash: user.accessHash?.toString(),
			firstName: user.firstName,
			lastName: user.lastName,
			username: user.username,
			usernames: user.usernames?.map((u: any) => ({
				username: u.username,
				active: u.active,
				editable: u.editable,
			})),
			phone: user.phone,
			bot: user.bot,
			botChatHistory: user.botChatHistory,
			botNochats: user.botNochats,
			botInlineGeo: user.botInlineGeo,
			botInlinePlaceholder: user.botInlinePlaceholder,
			botInfoVersion: user.botInfoVersion,
			verified: user.verified,
			restricted: user.restricted,
			restrictionReason: user.restrictionReason?.map((r: any) => ({
				platform: r.platform,
				reason: r.reason,
				text: r.text,
			})),
			scam: user.scam,
			fake: user.fake,
			premium: user.premium,
			self: user.self,
			contact: user.contact,
			mutualContact: user.mutualContact,
			deleted: user.deleted,
			support: user.support,
			min: user.min,
			applyMinPhoto: user.applyMinPhoto,
			status: user.status ? {
				type: user.status.className,
				wasOnline: user.status.wasOnline,
				expires: user.status.expires,
			} : null,
			langCode: user.langCode,
			color: user.color ? {
				color: user.color.color,
				backgroundEmojiId: user.color.backgroundEmojiId?.toString(),
			} : null,
			profileColor: user.profileColor ? {
				color: user.profileColor.color,
				backgroundEmojiId: user.profileColor.backgroundEmojiId?.toString(),
			} : null,
			emojiStatus: user.emojiStatus ? {
				documentId: user.emojiStatus.documentId?.toString(),
				until: user.emojiStatus.until,
			} : null,
			storiesMaxId: user.storiesMaxId,
			storiesUnavailable: user.storiesUnavailable,
			contactRequirePremium: user.contactRequirePremium,
			botCanEdit: user.botCanEdit,
			botAttachMenu: user.botAttachMenu,
			botBusiness: user.botBusiness,
		};
	}

	private formatEntity(entity: any): any {
		if (!entity) return null;

		const base = {
			id: entity.id?.toString(),
			className: entity.className,
		};

		if (entity instanceof Api.User) {
			return { ...base, ...this.formatUser(entity) };
		}

		if (entity instanceof Api.Chat) {
			return {
				...base,
				title: entity.title,
				participantsCount: entity.participantsCount,
				date: entity.date,
				creator: entity.creator,
				deactivated: entity.deactivated,
				callActive: entity.callActive,
				callNotEmpty: entity.callNotEmpty,
			};
		}

		if (entity instanceof Api.Channel) {
			return {
				...base,
				title: entity.title,
				username: entity.username,
				date: entity.date,
				creator: entity.creator,
				broadcast: entity.broadcast,
				megagroup: entity.megagroup,
				verified: entity.verified,
				restricted: entity.restricted,
				scam: entity.scam,
				fake: entity.fake,
				participantsCount: entity.participantsCount,
			};
		}

		return base;
	}
}
