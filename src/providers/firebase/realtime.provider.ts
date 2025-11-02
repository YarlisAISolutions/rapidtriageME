/**
 * Firebase Realtime Provider
 * Implements IRealtimeProvider interface for Firebase Realtime Database
 */

import {
  IRealtimeProvider,
  IConnectionOptions,
  IConnectionStatus,
  IChannel,
  IChannelOptions,
  IPresenceStatus,
  IPresenceInfo,
  IUnsubscribe
} from '../interfaces';

import { FirebaseApp } from 'firebase/app';
import {
  Database,
  getDatabase,
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  onDisconnect,
  serverTimestamp,
  child,
  DataSnapshot,
  off,
  goOnline,
  goOffline,
  onChildAdded,
  onChildChanged,
  onChildRemoved
} from 'firebase/database';

export class FirebaseRealtimeProvider implements IRealtimeProvider {
  private db: Database;
  private connectionRef: any;
  private presenceRef: any;
  private channels: Map<string, IChannel> = new Map();
  private connectionStatus: IConnectionStatus = {
    connected: false
  };
  private userId?: string;

  constructor(app: FirebaseApp) {
    this.db = getDatabase(app);
    this.setupConnectionMonitoring();
  }

  /**
   * Setup connection monitoring
   */
  private setupConnectionMonitoring(): void {
    this.connectionRef = ref(this.db, '.info/connected');

    onValue(this.connectionRef, (snapshot) => {
      const connected = snapshot.val();
      this.connectionStatus = {
        connected,
        lastHeartbeat: connected ? new Date() : this.connectionStatus.lastHeartbeat
      };

      if (connected && this.userId) {
        // Update user presence
        this.updateUserPresence();
      }
    });
  }

  /**
   * Update user presence
   */
  private async updateUserPresence(): Promise<void> {
    if (!this.userId) return;

    const userPresenceRef = ref(this.db, `presence/${this.userId}`);
    const presenceData = {
      online: true,
      lastSeen: serverTimestamp()
    };

    await set(userPresenceRef, presenceData);

    // Set offline on disconnect
    onDisconnect(userPresenceRef).set({
      online: false,
      lastSeen: serverTimestamp()
    });
  }

  /**
   * Connect to realtime database
   */
  async connect(options?: IConnectionOptions): Promise<void> {
    try {
      // Generate or use provided user ID
      this.userId = options?.metadata?.userId || `user_${Date.now()}`;

      // Go online
      goOnline(this.db);

      // Setup reconnection strategy
      if (options?.reconnect) {
        // Firebase handles reconnection automatically
        // We can add custom reconnection logic here if needed
      }

      // Wait for connection
      await new Promise<void>((resolve) => {
        const unsubscribe = onValue(this.connectionRef, (snapshot) => {
          if (snapshot.val()) {
            off(this.connectionRef, 'value', unsubscribe as any);
            resolve();
          }
        });
      });

      // Update presence
      await this.updateUserPresence();
    } catch (error: any) {
      throw new Error(`Failed to connect: ${error.message}`);
    }
  }

  /**
   * Disconnect from realtime database
   */
  async disconnect(): Promise<void> {
    try {
      // Update presence to offline
      if (this.userId) {
        const userPresenceRef = ref(this.db, `presence/${this.userId}`);
        await set(userPresenceRef, {
          online: false,
          lastSeen: serverTimestamp()
        });
      }

      // Clear channels
      this.channels.clear();

      // Go offline
      goOffline(this.db);

      this.connectionStatus = {
        connected: false,
        lastHeartbeat: new Date()
      };
    } catch (error: any) {
      throw new Error(`Failed to disconnect: ${error.message}`);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): IConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Create a channel
   */
  async createChannel(channelId: string, options?: IChannelOptions): Promise<IChannel> {
    try {
      const channelRef = ref(this.db, `channels/${channelId}`);

      const channel: IChannel = {
        id: channelId,
        name: options?.metadata?.name || channelId,
        members: [],
        createdAt: new Date(),
        metadata: options?.metadata || {}
      };

      // Set channel data
      await set(channelRef, {
        ...channel,
        createdAt: serverTimestamp(),
        private: options?.private || false,
        presence: options?.presence || false,
        history: options?.history || false,
        maxMembers: options?.maxMembers || -1
      });

      // Add to local channels
      this.channels.set(channelId, channel);

      // Join channel automatically
      await this.joinChannel(channelId);

      return channel;
    } catch (error: any) {
      throw new Error(`Failed to create channel: ${error.message}`);
    }
  }

  /**
   * Join a channel
   */
  async joinChannel(channelId: string): Promise<IChannel> {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      const channelRef = ref(this.db, `channels/${channelId}`);
      const snapshot = await get(channelRef);

      if (!snapshot.exists()) {
        throw new Error('Channel does not exist');
      }

      const channelData = snapshot.val();

      // Add user to channel members
      const membersRef = ref(this.db, `channels/${channelId}/members/${this.userId}`);
      await set(membersRef, {
        userId: this.userId,
        joinedAt: serverTimestamp()
      });

      // Create channel object
      const channel: IChannel = {
        id: channelId,
        name: channelData.name || channelId,
        members: Object.keys(channelData.members || {}),
        createdAt: new Date(channelData.createdAt),
        metadata: channelData.metadata || {}
      };

      // Add to local channels
      this.channels.set(channelId, channel);

      // Set up disconnect handler
      onDisconnect(membersRef).remove();

      return channel;
    } catch (error: any) {
      throw new Error(`Failed to join channel: ${error.message}`);
    }
  }

  /**
   * Leave a channel
   */
  async leaveChannel(channelId: string): Promise<void> {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      // Remove from channel members
      const membersRef = ref(this.db, `channels/${channelId}/members/${this.userId}`);
      await remove(membersRef);

      // Remove from local channels
      this.channels.delete(channelId);
    } catch (error: any) {
      throw new Error(`Failed to leave channel: ${error.message}`);
    }
  }

  /**
   * Delete a channel
   */
  async deleteChannel(channelId: string): Promise<void> {
    try {
      const channelRef = ref(this.db, `channels/${channelId}`);
      await remove(channelRef);

      // Remove from local channels
      this.channels.delete(channelId);
    } catch (error: any) {
      throw new Error(`Failed to delete channel: ${error.message}`);
    }
  }

  /**
   * Publish a message to a channel
   */
  async publish(channel: string, event: string, data: any): Promise<void> {
    try {
      const messagesRef = ref(this.db, `channels/${channel}/messages`);
      const newMessageRef = push(messagesRef);

      await set(newMessageRef, {
        event,
        data,
        userId: this.userId,
        timestamp: serverTimestamp()
      });
    } catch (error: any) {
      throw new Error(`Failed to publish message: ${error.message}`);
    }
  }

  /**
   * Subscribe to channel messages
   */
  subscribe(channel: string, event: string, callback: (data: any) => void): IUnsubscribe {
    const messagesRef = ref(this.db, `channels/${channel}/messages`);

    // Listen for new messages
    const listener = onChildAdded(messagesRef, (snapshot) => {
      const message = snapshot.val();
      if (message && message.event === event) {
        callback(message.data);
      }
    });

    // Return unsubscribe function
    return () => {
      off(messagesRef, 'child_added', listener);
    };
  }

  /**
   * Broadcast to all channels
   */
  async broadcast(event: string, data: any): Promise<void> {
    try {
      const broadcastRef = ref(this.db, 'broadcasts');
      const newBroadcastRef = push(broadcastRef);

      await set(newBroadcastRef, {
        event,
        data,
        userId: this.userId,
        timestamp: serverTimestamp()
      });
    } catch (error: any) {
      throw new Error(`Failed to broadcast message: ${error.message}`);
    }
  }

  /**
   * Set user presence status
   */
  async setPresence(channel: string, status: IPresenceStatus): Promise<void> {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      const presenceRef = ref(this.db, `channels/${channel}/presence/${this.userId}`);

      await set(presenceRef, {
        ...status,
        lastSeen: serverTimestamp()
      });

      // Remove on disconnect
      if (status.online) {
        onDisconnect(presenceRef).remove();
      }
    } catch (error: any) {
      throw new Error(`Failed to set presence: ${error.message}`);
    }
  }

  /**
   * Get presence info for a channel
   */
  async getPresence(channel: string): Promise<IPresenceInfo[]> {
    try {
      const presenceRef = ref(this.db, `channels/${channel}/presence`);
      const snapshot = await get(presenceRef);

      if (!snapshot.exists()) {
        return [];
      }

      const presenceData = snapshot.val();
      const presenceInfo: IPresenceInfo[] = [];

      for (const [userId, status] of Object.entries(presenceData)) {
        presenceInfo.push({
          userId,
          status: status as IPresenceStatus
        });
      }

      return presenceInfo;
    } catch (error: any) {
      throw new Error(`Failed to get presence: ${error.message}`);
    }
  }

  /**
   * Subscribe to presence changes
   */
  subscribeToPresence(channel: string, callback: (presence: IPresenceInfo[]) => void): IUnsubscribe {
    const presenceRef = ref(this.db, `channels/${channel}/presence`);

    const listener = onValue(presenceRef, async (snapshot) => {
      const presenceInfo = await this.getPresence(channel);
      callback(presenceInfo);
    });

    return () => {
      off(presenceRef, 'value', listener);
    };
  }

  /**
   * Send direct message
   */
  async sendDirectMessage(userId: string, message: any): Promise<void> {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      const dmRef = ref(this.db, `directMessages/${userId}`);
      const newMessageRef = push(dmRef);

      await set(newMessageRef, {
        from: this.userId,
        message,
        timestamp: serverTimestamp(),
        read: false
      });
    } catch (error: any) {
      throw new Error(`Failed to send direct message: ${error.message}`);
    }
  }

  /**
   * Listen for direct messages
   */
  onDirectMessage(callback: (from: string, message: any) => void): IUnsubscribe {
    if (!this.userId) {
      throw new Error('User ID not set');
    }

    const dmRef = ref(this.db, `directMessages/${this.userId}`);

    const listener = onChildAdded(dmRef, async (snapshot) => {
      const messageData = snapshot.val();
      if (messageData && !messageData.read) {
        callback(messageData.from, messageData.message);

        // Mark as read
        const messageRef = ref(this.db, `directMessages/${this.userId}/${snapshot.key}`);
        await update(messageRef, { read: true });
      }
    });

    return () => {
      off(dmRef, 'child_added', listener);
    };
  }

  // Additional helper methods

  /**
   * Create a room for video/audio calls
   */
  async createRoom(roomId: string, options?: {
    type: 'video' | 'audio' | 'screen';
    maxParticipants?: number;
  }): Promise<void> {
    try {
      const roomRef = ref(this.db, `rooms/${roomId}`);

      await set(roomRef, {
        id: roomId,
        type: options?.type || 'video',
        maxParticipants: options?.maxParticipants || 10,
        createdAt: serverTimestamp(),
        createdBy: this.userId,
        participants: {}
      });
    } catch (error: any) {
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  /**
   * Join a room
   */
  async joinRoom(roomId: string, streamData?: any): Promise<void> {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      const participantRef = ref(this.db, `rooms/${roomId}/participants/${this.userId}`);

      await set(participantRef, {
        userId: this.userId,
        joinedAt: serverTimestamp(),
        stream: streamData || null
      });

      // Remove on disconnect
      onDisconnect(participantRef).remove();
    } catch (error: any) {
      throw new Error(`Failed to join room: ${error.message}`);
    }
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string): Promise<void> {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      const participantRef = ref(this.db, `rooms/${roomId}/participants/${this.userId}`);
      await remove(participantRef);
    } catch (error: any) {
      throw new Error(`Failed to leave room: ${error.message}`);
    }
  }

  /**
   * Listen for room participants
   */
  onRoomParticipants(roomId: string, callback: (participants: any[]) => void): IUnsubscribe {
    const participantsRef = ref(this.db, `rooms/${roomId}/participants`);

    const listener = onValue(participantsRef, (snapshot) => {
      const participants = snapshot.val() || {};
      callback(Object.values(participants));
    });

    return () => {
      off(participantsRef, 'value', listener);
    };
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(channel: string, isTyping: boolean): Promise<void> {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      const typingRef = ref(this.db, `channels/${channel}/typing/${this.userId}`);

      if (isTyping) {
        await set(typingRef, {
          userId: this.userId,
          timestamp: serverTimestamp()
        });

        // Remove after 3 seconds
        setTimeout(() => {
          remove(typingRef);
        }, 3000);
      } else {
        await remove(typingRef);
      }
    } catch (error: any) {
      throw new Error(`Failed to send typing indicator: ${error.message}`);
    }
  }

  /**
   * Listen for typing indicators
   */
  onTypingIndicators(channel: string, callback: (users: string[]) => void): IUnsubscribe {
    const typingRef = ref(this.db, `channels/${channel}/typing`);

    const listener = onValue(typingRef, (snapshot) => {
      const typing = snapshot.val() || {};
      const users = Object.keys(typing).filter(id => id !== this.userId);
      callback(users);
    });

    return () => {
      off(typingRef, 'value', listener);
    };
  }
}