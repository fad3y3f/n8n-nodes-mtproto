# n8n-nodes-mtproto

Custom n8n nodes for Telegram MTProto API with integrated GramJS library.

## Features

This package provides full MTProto protocol access to Telegram, allowing you to:

- **Messages**: Send, receive, edit, delete, forward, and search messages
- **Media**: Send photos and documents
- **Chats**: Get dialogs, chat info, members, leave chats
- **Channels**: Join, leave, get info, get members/subscribers
- **Contacts**: Get contacts list, search users globally
- **Users**: Get user info, profile photos
- **Account**: Get current account info, manage sessions
- **Authentication**: Built-in auth flow for session generation directly in n8n

## Installation

### In n8n

1. Go to **Settings** → **Community Nodes**
2. Click **Install a community node**
3. Enter `@fad3y3f/n8n-nodes-mtproto`
4. Click **Install**

### Manual Installation

```bash
cd ~/.n8n/custom
npm install @fad3y3f/n8n-nodes-mtproto
```

## Getting Started

### 1. Get Telegram API Credentials

1. Go to https://my.telegram.org
2. Log in with your phone number
3. Go to "API development tools"
4. Create a new application
5. Note your `api_id` and `api_hash`

### 2. Generate Session String

You have two options to generate a session string:

#### Option A: Using n8n Auth Workflow (Recommended)

Import the authentication workflow below to generate your session string directly in n8n:

<details>
<summary>📋 Click to expand Auth Workflow JSON</summary>

```json
{
  "nodes": [
    {
      "parameters": {
        "options": {
          "responseMode": "responseNodes"
        }
      },
      "type": "@n8n/n8n-nodes-langchain.chatTrigger",
      "typeVersion": 1.4,
      "position": [128, -96],
      "id": "debaa647-7476-4661-aa4d-055efc0f4182",
      "name": "Enter /start for start",
      "webhookId": "0b20cbb1-9762-4067-8311-273edc79711c"
    },
    {
      "parameters": {
        "message": "Enter 2FA code from Telegram",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.chat",
      "typeVersion": 1,
      "position": [512, -96],
      "id": "5b729b14-c25a-493b-b3aa-f8a6f324e714",
      "name": "Enter 2FA code"
    },
    {
      "parameters": {
        "message": "={{ $json.message }}\n\n{{ $json.sessionString }}\n\nEnter anything when MTProto API Credentials will be filled.",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.chat",
      "typeVersion": 1,
      "position": [1088, -96],
      "id": "5bc84084-8455-414d-99c4-1563a6c0861a",
      "name": "Fill MTProto API credentials"
    },
    {
      "parameters": {
        "message": "={{ $json.message }}",
        "waitUserReply": false,
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.chat",
      "typeVersion": 1,
      "position": [1472, -96],
      "id": "a49bb600-36a2-47f1-83bd-41c718f982dc",
      "name": "Confirmation message"
    },
    {
      "parameters": {
        "content": "## Auth in Telegram via MTProto",
        "height": 256,
        "width": 1600
      },
      "type": "n8n-nodes-base.stickyNote",
      "position": [48, -176],
      "typeVersion": 1,
      "id": "afbf5214-4521-4dad-bf42-f6f634ac8ccf",
      "name": "Sticky Note"
    },
    {
      "parameters": {},
      "type": "@fad3y3f/n8n-nodes-mtproto.mtProtoAuth",
      "typeVersion": 1,
      "position": [320, -96],
      "id": "4e9f63f7-0be4-4b78-a6dd-bd12868f69aa",
      "name": "Request code",
      "credentials": {
        "mtProtoApi": {
          "id": "XUqwxRVucm9HMIB9",
          "name": "MTProto account"
        }
      }
    },
    {
      "parameters": {
        "operation": "submitCode",
        "phoneCodeHash": "={{ $('Request code').item.json.phoneCodeHash }}",
        "phoneCode": "={{ $json.chatInput }}",
        "tempSession": "={{ $('Request code').item.json.tempSession }}"
      },
      "type": "@fad3y3f/n8n-nodes-mtproto.mtProtoAuth",
      "typeVersion": 1,
      "position": [704, -96],
      "id": "a83fa8b9-40ab-4744-9ecc-d32dfb4f78e5",
      "name": "Submit verification code",
      "credentials": {
        "mtProtoApi": {
          "id": "XUqwxRVucm9HMIB9",
          "name": "MTProto account"
        }
      }
    },
    {
      "parameters": {
        "operation": "submit2FA"
      },
      "type": "@fad3y3f/n8n-nodes-mtproto.mtProtoAuth",
      "typeVersion": 1,
      "position": [896, -96],
      "id": "73a7592f-d79a-4277-b11b-b6e23f6be0f8",
      "name": "Submit 2FA password",
      "credentials": {
        "mtProtoApi": {
          "id": "XUqwxRVucm9HMIB9",
          "name": "MTProto account"
        }
      }
    },
    {
      "parameters": {
        "operation": "checkSession"
      },
      "type": "@fad3y3f/n8n-nodes-mtproto.mtProtoAuth",
      "typeVersion": 1,
      "position": [1280, -96],
      "id": "41740406-031a-45f3-9399-ede59b23109c",
      "name": "Check session",
      "credentials": {
        "mtProtoApi": {
          "id": "XUqwxRVucm9HMIB9",
          "name": "MTProto account"
        }
      }
    }
  ],
  "connections": {
    "Enter /start for start": {
      "main": [[{"node": "Request code", "type": "main", "index": 0}]]
    },
    "Enter 2FA code": {
      "main": [[{"node": "Submit verification code", "type": "main", "index": 0}]]
    },
    "Fill MTProto API credentials": {
      "main": [[{"node": "Check session", "type": "main", "index": 0}]]
    },
    "Request code": {
      "main": [[{"node": "Enter 2FA code", "type": "main", "index": 0}]]
    },
    "Submit verification code": {
      "main": [[{"node": "Submit 2FA password", "type": "main", "index": 0}]]
    },
    "Submit 2FA password": {
      "main": [[{"node": "Fill MTProto API credentials", "type": "main", "index": 0}]]
    },
    "Check session": {
      "main": [[{"node": "Confirmation message", "type": "main", "index": 0}]]
    }
  },
  "pinData": {}
}
```

</details>

**How to use the Auth Workflow:**

1. Import the workflow JSON above into n8n
2. Create MTProto API credentials with your `api_id`, `api_hash`, and phone number (leave session string empty)
3. Activate the workflow and open the Chat Trigger URL
4. Type `/start` to begin the authentication
5. Enter the verification code sent to your Telegram
6. Enter your 2FA password (if enabled)
7. Copy the generated session string to your MTProto API credentials

#### Option B: Using CLI Script

```bash
npm install
npx ts-node scripts/generate-session.ts
```

Follow the prompts:
1. Enter your API ID
2. Enter your API Hash
3. Enter your phone number (with country code)
4. Enter the verification code sent to Telegram
5. Enter 2FA password (if enabled)

### 3. Configure Credentials in n8n

1. Open n8n
2. Go to Credentials → Create New
3. Search for "MTProto API"
4. Fill in:
   - **API ID**: Your Telegram API ID
   - **API Hash**: Your Telegram API Hash
   - **Phone Number**: Your phone number with country code
   - **Session String**: The string generated in step 2
   - **2FA Password**: (Optional) Your two-factor authentication password

## Available Nodes

### Telegram MTProto

Main node for interacting with Telegram.

#### Resources & Operations

**Account**
- `Get Me` - Get current account information
- `Get Session String` - Generate/retrieve session string
- `Log Out` - Log out from current session

**Message**
- `Send` - Send a text message
- `Send Media` - Send a photo or document
- `Get Many` - Get message history
- `Search` - Search messages in a chat
- `Edit` - Edit a message
- `Delete` - Delete messages
- `Forward` - Forward messages to another chat

**Chat**
- `Get All` - Get all dialogs/chats
- `Get` - Get chat information
- `Get Members` - Get chat members
- `Leave` - Leave a chat

**Channel**
- `Join` - Join a channel (public or via invite link)
- `Leave` - Leave a channel
- `Get Info` - Get channel information
- `Get Members` - Get channel subscribers

**Contact**
- `Get All` - Get all contacts
- `Search` - Search users globally

**User**
- `Get` - Get user information
- `Get Photos` - Get user profile photos

### MTProto Auth

Node for authentication operations:

- `Request Code` - Send verification code to phone number
- `Submit Code` - Submit the verification code
- `Submit 2FA` - Submit two-factor authentication password
- `Check Session` - Verify session is active and get session string

### MTProto Trigger (Experimental)

Trigger node for listening to Telegram events.

## Usage Examples

### Send a Message

1. Add "Telegram MTProto" node
2. Select Resource: "Message"
3. Select Operation: "Send"
4. Enter Chat ID: `@username` or numeric ID
5. Enter Message text

### Get All Chats

1. Add "Telegram MTProto" node
2. Select Resource: "Chat"
3. Select Operation: "Get All"
4. Set Limit: 50

### Search Messages

1. Add "Telegram MTProto" node
2. Select Resource: "Message"
3. Select Operation: "Search"
4. Enter Chat ID
5. Enter search Query
6. Optionally filter by type (photos, videos, etc.)

### Join a Channel

1. Add "Telegram MTProto" node
2. Select Resource: "Channel"
3. Select Operation: "Join"
4. Enter channel username or invite link

## Chat ID Formats

The nodes accept multiple formats for identifying chats:

- **Username**: `@username` or `username`
- **Phone number**: `+1234567890`
- **Numeric ID**: `123456789` or `-100123456789`
- **Invite link**: `https://t.me/joinchat/XXXXX` or `t.me/+XXXXX`

## Important Notes

### Session Management

- The session string allows full access to your Telegram account
- Keep it secure and never share it
- Each session appears in Telegram's active sessions
- You can terminate sessions from Telegram settings

### Rate Limits

Telegram has rate limits. If you send too many requests:
- You may get `FLOOD_WAIT_X` errors
- The node will need to wait X seconds before retrying
- Consider adding delays between operations

### Media Files

When sending media:
- Use the binary data from previous nodes
- Supported: photos (jpg, png, gif) and documents (any file)
- Maximum file size depends on your Telegram account type

## Troubleshooting

### "Phone code required" Error

Your session string is invalid or expired. Generate a new one using the Auth Workflow or CLI script.

### "AUTH_KEY_UNREGISTERED" Error

The session was terminated. Generate a new session string.

### "FLOOD_WAIT_X" Error

You've hit rate limits. Wait X seconds before making more requests.

### "PEER_ID_INVALID" Error

The chat ID format is incorrect or the chat doesn't exist. Try:
- Using @username format
- Getting the numeric ID from "Get All Chats"

## Development

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
npm run lintfix
```

### Formatting

```bash
npm run format
```

## License

MIT

## Credits

- [GramJS](https://github.com/gram-js/gramjs) - Telegram MTProto client
- [n8n](https://n8n.io/) - Workflow automation platform
