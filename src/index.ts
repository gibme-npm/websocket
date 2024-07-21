// Copyright (c) 2024, Brandon Lehmann <brandonlehmann@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { EventEmitter } from 'events';
import { Buffer } from 'buffer';
import Timer from '@gibme/timer';
import WebSocket from 'isomorphic-ws';

export enum WebSocketReadyState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3
}

export interface WebSocketClientOptions {
    url: string;
    protocols?: string | string[];
    binaryType?: 'arraybuffer' | 'nodebuffer' | 'fragments';
    autoReconnect?: boolean;
}

export default class WebSocketClient extends EventEmitter {
    private socket?: WebSocket;
    private pre_ready_sent_messages: any[] = [];
    private timer?: Timer;

    /**
     * Constructs a new instances of the class
     * @param options
     */
    constructor (private readonly options: WebSocketClientOptions) {
        super();

        this.options.binaryType ??= 'arraybuffer';
    }

    /**
     * Returns the underlying WebSocket's binary type
     */
    public get binaryType (): 'arraybuffer' | 'nodebuffer' | 'fragments' {
        return this.socket?.binaryType || 'arraybuffer';
    }

    /**
     * Sets the underlying WebSocket's binary type
     *
     * @param value
     */
    public set binaryType (value: 'arraybuffer' | 'nodebuffer' | 'fragments') {
        if (this.socket && this.socket.binaryType) {
            this.socket.binaryType = value;
        }
    }

    /**
     * Returns the amount of data buffered by the underlying WebSocket
     */
    public get bufferedAmount (): number {
        return this.socket?.bufferedAmount || 0;
    }

    /**
     * Returns any extensions currently enabled in the underlying WebSocket
     */
    public get extensions (): string {
        return this.socket?.extensions || '';
    }

    /**
     * Returns the underlying WebSocket protocol
     */
    public get protocol (): string {
        return this.socket?.protocol || '';
    }

    /**
     * Returns the underlying WebSocket's ready state
     */
    public get readyState (): WebSocketReadyState {
        return this.socket?.readyState || 3;
    }

    /**
     * Returns the underlying WebSocket's remote URL
     */
    public get url (): string {
        return this.socket?.url || this.options.url;
    }

    /**
     * Emitted when the underlying WebSocket is closed
     *
     * @param event
     * @param listener
     */
    public on(event: 'close', listener: () => void): this;

    /**
     * Emitted when the underlying WebSocket encounters an error
     *
     * @param event
     * @param listener
     */
    public on(event: 'error', listener: (error: Error) => void): this;

    /**
     * Emitted when the underlying WebSocket receives a message
     *
     * @param event
     * @param listener
     */
    public on(event: 'message', listener: (message: Buffer) => void): this;

    /**
     * Emitted when the underlying WebSocket is opened
     *
     * @param event
     * @param listener
     */
    public on(event: 'open', listener: () => void): this;

    /**
     * Emitted when the underlying WebSocket is ready
     *
     * @param event
     * @param listener
     */
    public on(event: 'ready', listener: () => void): this;

    /** @ignore */
    public on (event: any, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    /**
     * Emitted when the underlying WebSocket is closed
     *
     * @param event
     * @param listener
     */
    public once(event: 'close', listener: () => void): this;

    /**
     * Emitted when the underlying WebSocket encounters an error
     *
     * @param event
     * @param listener
     */
    public once(event: 'error', listener: (error: Error) => void): this;

    /**
     * Emitted when the underlying WebSocket receives a message
     *
     * @param event
     * @param listener
     */
    public once(event: 'message', listener: (message: Buffer) => void): this;

    /**
     * Emitted when the underlying WebSocket is opened
     *
     * @param event
     * @param listener
     */
    public once(event: 'open', listener: () => void): this;

    /**
     * Emitted when the underlying WebSocket is ready
     *
     * @param event
     * @param listener
     */
    public once(event: 'ready', listener: () => void): this;

    /** @ignore */
    public once (event: any, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    /**
     * Emitted when the underlying WebSocket is closed
     *
     * @param event
     * @param listener
     */
    public off(event: 'close', listener: () => void): this;

    /**
     * Emitted when the underlying WebSocket encounters an error
     *
     * @param event
     * @param listener
     */
    public off(event: 'error', listener: (error: Error) => void): this;

    /**
     * Emitted when the underlying WebSocket receives a message
     *
     * @param event
     * @param listener
     */
    public off(event: 'message', listener: (message: Buffer) => void): this;

    /**
     * Emitted when the underlying WebSocket is opened
     *
     * @param event
     * @param listener
     */
    public off(event: 'open', listener: () => void): this;

    /**
     * Emitted when the underlying WebSocket is ready
     *
     * @param event
     * @param listener
     */
    public off(event: 'ready', listener: () => void): this;

    /** @ignore */
    public off (event: any, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    /**
     * Attempts to connect the underlying WebSocket to the remote URL
     *
     * This method also allows us to re-use the class instance, so we do not have
     * to recreate it if we need to 'reconnect' the WebSocket later
     */
    public open (): void {
        try {
            this.socket = new WebSocket(this.options.url, this.options.protocols);

            this.binaryType = this.options.binaryType || 'arraybuffer';

            this.timer = new Timer(10, false);

            this.timer.on('tick', () => {
                if (this.readyState === WebSocketReadyState.OPEN) {
                    this.timer?.destroy();

                    this.emit('ready');

                    // if we tried to send messages before we were ready, send them now
                    const messages = this.pre_ready_sent_messages.slice(0);
                    this.pre_ready_sent_messages = [];

                    for (const message of messages) {
                        this.send(message);
                    }
                }
            });

            this.socket.onopen = () => {
                this.emit('open');

                this.timer?.start();

                if (this.socket) {
                    this.socket.onclose = () => {
                        this.emit('close');

                        if (this.options.autoReconnect) {
                            this.open();
                        }
                    };
                }
            };
            this.socket.onclose = () => {
                if (this.options.autoReconnect) {
                    this.open();
                }
            };
            this.socket.onerror = error => this.emit('error', new Error(error.toString()));
            this.socket.onmessage = event => {
                if (event.data instanceof ArrayBuffer) {
                    return this.emit('message', Buffer.from(event.data));
                } else if (event.data instanceof Buffer) {
                    return this.emit('message', event.data);
                } else if (Array.isArray(event.data)) {
                    if (event.data instanceof Buffer) {
                        event.data.forEach(item => {
                            this.emit('message', item);
                        });
                    }
                } else {
                    return this.emit('message', Buffer.from(event.data));
                }
            };
        } catch (error: any) {
            delete this.socket;

            this.emit('error', new Error(error.toString()));
        }
    }

    /**
     * Alias for `open()`
     */
    public connect (): void {
        return this.open();
    }

    /**
     * Closes the underlying WebSocket
     *
     * @param code
     * @param reason
     */
    public close (code?: number, reason?: string): void {
        if (this.socket) {
            // stomp over the auto-reconnect if we told it to close
            this.socket.onclose = () => this.emit('close');

            this.socket.close(code, reason);
        }
    }

    /**
     * Sends the specified data via the underlying WebSocket
     *
     * @param data
     */
    public send (data: string | ArrayBufferLike | ArrayBufferView | Buffer): void {
        // if we try to send before we are ready, stack them up
        if (this.readyState !== WebSocketReadyState.OPEN) {
            this.pre_ready_sent_messages.push(data);
        } else {
            this.socket?.send(data);
        }
    }
}

export { WebSocketClient, Buffer };
