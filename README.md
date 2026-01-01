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

## Installation

### In n8n (Docker)

1. Build the package:
```bash
npm install
npm run build
```

2. Copy the built package to your n8n custom nodes directory:
```bash
# If using Docker
docker cp dist/ n8n:/home/node/.n8n/custom/node_modules/n8n-nodes-mtproto/

# Or mount as volume in docker-compose.yml:
volumes:
  - ./n8n-nodes-mtproto:/home/node/.n8n/custom/node_modules/n8n-nodes-mtproto
```

### In n8n (npm global)

```bash
cd ~/.n8n/custom
npm install /path/to/n8n-nodes-mtproto
```

### Development

```bash
npm install
npm run dev  # Watch mode for development
```

## Getting Started

### 1. Get Telegram API Credentials

1. Go to https://my.telegram.org
2. Log in with your phone number
3. Go to "API development tools"
4. Create a new application
5. Note your `api_id` and `api_hash`

### 2. Generate Session String

Before using the nodes, you need to generate a session string:

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

Copy the generated session string - you'll need it for the credentials.

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

Your session string is invalid or expired. Generate a new one using:
```bash
npx ts-node scripts/generate-session.ts
```

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
