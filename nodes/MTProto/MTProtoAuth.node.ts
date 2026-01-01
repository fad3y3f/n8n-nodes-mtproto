import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { TelegramClient, Api, password as passwordModule } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Logger, LogLevel } from 'telegram/extensions/Logger';

// Create silent logger
const silentLogger = new Logger(LogLevel.NONE);

// Helper functions outside the class
async function requestCode(apiId: number, apiHash: string, phoneNumber: string): Promise<any> {
	const session = new StringSession('');
	const client = new TelegramClient(session, apiId, apiHash, {
		connectionRetries: 5,
		deviceModel: 'n8n MTProto Auth',
		systemVersion: '1.0.0',
		appVersion: '1.0.0',
		baseLogger: silentLogger,
	});

	await client.connect();

	try {
		const result = await client.invoke(
			new Api.auth.SendCode({
				phoneNumber,
				apiId,
				apiHash,
				settings: new Api.CodeSettings({
					allowFlashcall: false,
					currentNumber: false,
					allowAppHash: true,
				}),
			})
		);

		const tempSession = client.session.save() as unknown as string;

		return {
			success: true,
			step: 'code_sent',
			phoneNumber,
			phoneCodeHash: result.phoneCodeHash,
			tempSession,
			timeout: result.timeout,
			message: '✅ Code sent! Check Telegram app or SMS. Use "Submit Code" operation next.',
			nextStep: 'submitCode',
		};
	} finally {
		await client.disconnect();
	}
}

async function submitCode(
	apiId: number,
	apiHash: string,
	phoneNumber: string,
	phoneCodeHash: string,
	phoneCode: string,
	tempSession: string
): Promise<any> {
	const session = new StringSession(tempSession);
	const client = new TelegramClient(session, apiId, apiHash, {
		connectionRetries: 5,
		deviceModel: 'n8n MTProto Auth',
		systemVersion: '1.0.0',
		appVersion: '1.0.0',
		baseLogger: silentLogger,
	});

	await client.connect();

	try {
		const result = await client.invoke(
			new Api.auth.SignIn({
				phoneNumber,
				phoneCodeHash,
				phoneCode,
			})
		);

		const sessionString = client.session.save() as unknown as string;

		if (result instanceof Api.auth.AuthorizationSignUpRequired) {
			return {
				success: false,
				error: 'signup_required',
				message: '❌ This phone number is not registered. Please sign up in Telegram app first.',
			};
		}

		const user = (result as Api.auth.Authorization).user as Api.User;

		return {
			success: true,
			step: 'authorized',
			sessionString,
			user: {
				id: user.id?.toString(),
				firstName: user.firstName,
				lastName: user.lastName,
				username: user.username,
				phone: user.phone,
			},
			message: '✅ SUCCESS! Copy the sessionString above and paste it into your MTProto API credentials.',
			instruction: 'Go to Credentials → MTProto API → paste sessionString → Save',
		};
	} catch (error: any) {
		if (error.message?.includes('SESSION_PASSWORD_NEEDED')) {
			const newTempSession = client.session.save() as unknown as string;
			return {
				success: true,
				step: '2fa_required',
				tempSession: newTempSession,
				message: '🔐 2FA is enabled. Use "Submit 2FA Password" operation next.',
				nextStep: 'submit2FA',
			};
		}
		throw error;
	} finally {
		await client.disconnect();
	}
}

async function submit2FA(apiId: number, apiHash: string, tempSession: string, password: string): Promise<any> {
	const session = new StringSession(tempSession);
	const client = new TelegramClient(session, apiId, apiHash, {
		connectionRetries: 5,
		deviceModel: 'n8n MTProto Auth',
		systemVersion: '1.0.0',
		appVersion: '1.0.0',
		baseLogger: silentLogger,
	});

	await client.connect();

	try {
		const passwordInfo = await client.invoke(new Api.account.GetPassword());
		const passwordSrp = await passwordModule.computeCheck(passwordInfo, password);

		const result = await client.invoke(
			new Api.auth.CheckPassword({
				password: passwordSrp,
			})
		);

		const sessionString = client.session.save() as unknown as string;
		const user = (result as Api.auth.Authorization).user as Api.User;

		return {
			success: true,
			step: 'authorized',
			sessionString,
			user: {
				id: user.id?.toString(),
				firstName: user.firstName,
				lastName: user.lastName,
				username: user.username,
				phone: user.phone,
			},
			message: '✅ SUCCESS! Copy the sessionString above and paste it into your MTProto API credentials.',
			instruction: 'Go to Credentials → MTProto API → paste sessionString → Save',
		};
	} finally {
		await client.disconnect();
	}
}

async function checkSession(apiId: number, apiHash: string, sessionString: string): Promise<any> {
	if (!sessionString) {
		return {
			valid: false,
			message: '❌ No session string in credentials. Run authorization flow first.',
		};
	}

	const session = new StringSession(sessionString);
	const client = new TelegramClient(session, apiId, apiHash, {
		connectionRetries: 5,
		deviceModel: 'n8n MTProto Auth',
		systemVersion: '1.0.0',
		appVersion: '1.0.0',
		baseLogger: silentLogger,
	});

	try {
		await client.connect();
		const me = await client.getMe() as Api.User;

		return {
			valid: true,
			user: {
				id: me.id?.toString(),
				firstName: me.firstName,
				lastName: me.lastName,
				username: me.username,
				phone: me.phone,
			},
			message: '✅ Session is valid! You are logged in.',
		};
	} catch (error: any) {
		return {
			valid: false,
			error: error.message,
			message: '❌ Session is invalid or expired. Run authorization flow again.',
		};
	} finally {
		await client.disconnect();
	}
}

export class MTProtoAuth implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Telegram MTProto Auth',
		name: 'mtProtoAuth',
		icon: 'file:telegram.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Authenticate with Telegram MTProto API and get session string',
		defaults: {
			name: 'MTProto Auth',
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
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Request Code',
						value: 'requestCode',
						description: 'Step 1: Send verification code to your phone',
						action: 'Request verification code',
					},
					{
						name: 'Submit Code',
						value: 'submitCode',
						description: 'Step 2: Verify with the code you received',
						action: 'Submit verification code',
					},
					{
						name: 'Submit 2FA Password',
						value: 'submit2FA',
						description: 'Step 3 (if needed): Enter 2FA password',
						action: 'Submit 2FA password',
					},
					{
						name: 'Check Session',
						value: 'checkSession',
						description: 'Verify if current session is valid',
						action: 'Check session validity',
					},
				],
				default: 'requestCode',
			},

			// Submit Code fields
			{
				displayName: 'Phone Code Hash',
				name: 'phoneCodeHash',
				type: 'string',
				default: '={{$json.phoneCodeHash}}',
				required: true,
				displayOptions: {
					show: {
						operation: ['submitCode'],
					},
				},
				description: 'Phone code hash from "Request Code" step (auto-filled from previous node)',
			},
			{
				displayName: 'Verification Code',
				name: 'phoneCode',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['submitCode'],
					},
				},
				description: 'The code you received in Telegram or SMS',
			},
			{
				displayName: 'Temp Session',
				name: 'tempSession',
				type: 'string',
				default: '={{$json.tempSession}}',
				required: true,
				displayOptions: {
					show: {
						operation: ['submitCode'],
					},
				},
				description: 'Temporary session from "Request Code" step (auto-filled)',
			},

			// 2FA fields
			{
				displayName: 'Temp Session',
				name: 'tempSession2FA',
				type: 'string',
				default: '={{$json.tempSession}}',
				required: true,
				displayOptions: {
					show: {
						operation: ['submit2FA'],
					},
				},
				description: 'Temporary session from "Submit Code" step (auto-filled)',
			},
			{
				displayName: 'Notice',
				name: 'info',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						operation: ['submit2FA'],
					},
				},
				description: '2FA password will be taken from credentials',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('mtProtoApi');
		const operation = this.getNodeParameter('operation', 0) as string;

		const apiId = credentials.apiId as number;
		const apiHash = credentials.apiHash as string;
		const phoneNumber = credentials.phoneNumber as string;

		if (!apiId || !apiHash) {
			throw new NodeOperationError(this.getNode(), 'API ID and API Hash are required in credentials');
		}

		for (let i = 0; i < items.length; i++) {
			try {
				let result: any;

				if (operation === 'requestCode') {
					result = await requestCode(apiId, apiHash, phoneNumber);
				} else if (operation === 'submitCode') {
					const phoneCodeHash = this.getNodeParameter('phoneCodeHash', i) as string;
					const phoneCode = this.getNodeParameter('phoneCode', i) as string;
					const tempSession = this.getNodeParameter('tempSession', i) as string;
					result = await submitCode(apiId, apiHash, phoneNumber, phoneCodeHash, phoneCode, tempSession);
				} else if (operation === 'submit2FA') {
					const tempSession = this.getNodeParameter('tempSession2FA', i) as string;
					const password = credentials.twoFactorPassword as string;
					if (!password) {
						throw new NodeOperationError(this.getNode(), '2FA password is required in credentials');
					}
					result = await submit2FA(apiId, apiHash, tempSession, password);
				} else if (operation === 'checkSession') {
					const sessionString = credentials.sessionString as string;
					result = await checkSession(apiId, apiHash, sessionString);
				}

				returnData.push({ json: result });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { success: false, error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
