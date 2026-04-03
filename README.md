# @gibme/websocket

Simple cross-platform WebSocket client helper for Node.js and browsers.

Provides a unified, event-driven interface with automatic message buffering, auto-reconnect support, and consistent `Buffer`-based message delivery across platforms.

## Installation

```bash
npm install @gibme/websocket
# or
yarn add @gibme/websocket
```

## Requirements

- Node.js >= 22

## Quick Start

```typescript
import WebSocket from '@gibme/websocket';

const socket = new WebSocket({
    url: 'wss://echo.websocket.org/echo',
    autoReconnect: true
});

socket.connect();

socket.on('message', (message) => {
    console.log('Received:', message.toString());
});

socket.send(JSON.stringify({ hello: 'world' }));
```

## Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | *required* | WebSocket server URL |
| `protocols` | `string \| string[]` | `undefined` | WebSocket sub-protocols |
| `binaryType` | `'arraybuffer' \| 'nodebuffer' \| 'fragments'` | `'arraybuffer'` | Binary data representation |
| `autoReconnect` | `boolean` | `false` | Automatically reconnect on close |

## Methods

### `connect()` / `open()`

Opens the WebSocket connection. Can be called again to reconnect after a close.

### `send(data)`

Sends data through the WebSocket. If the connection is not yet open, messages are automatically queued and sent once the connection is ready.

Accepts `string`, `ArrayBufferLike`, `ArrayBufferView`, or `Buffer`.

### `close(code?, reason?)`

Closes the WebSocket connection. Prevents auto-reconnect from triggering.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `readyState` | `number` | Connection state: `0` CONNECTING, `1` OPEN, `2` CLOSING, `3` CLOSED |
| `bufferedAmount` | `number` | Bytes of data queued in the underlying WebSocket |
| `extensions` | `string` | Negotiated extensions |
| `protocol` | `string` | Negotiated sub-protocol |
| `url` | `string` | Remote WebSocket URL |
| `binaryType` | `string` | Get/set binary data representation |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `open` | — | Connection established |
| `ready` | — | Connection confirmed ready; queued messages are flushed |
| `message` | `Buffer` | Message received (always delivered as a `Buffer`) |
| `close` | — | Connection closed |
| `error` | `Error` | An error occurred |

## Browser Support

This package uses [isomorphic-ws](https://github.com/nicolo-ribaudo/isomorphic-ws) to provide a consistent WebSocket API across Node.js and browser environments. A webpack bundle is available at `dist/websocket.min.js` for direct browser usage.

## License

MIT - see [LICENSE](LICENSE) for details.

## Documentation

Full API documentation is available at [https://gibme-npm.github.io/websocket/](https://gibme-npm.github.io/websocket/).
