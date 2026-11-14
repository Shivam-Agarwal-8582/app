
import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { ChatMessage, TypingIndicator } from '../types';
import { apiClient, getWsUrl } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export function useGroupChat(groupId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<StompSubscription[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  // 1. Fetch initial message history
  const fetchHistory = useCallback(async () => {
    if (!groupId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response: any = await apiClient.get(
        `/groups/${groupId}/chat/messages`
      );

      if (response?.data) {
        setMessages(response.data);
      }
    } catch (err: any) {
      console.error('Chat history error:', err);
      setError(err?.message || 'Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // 2. Set up STOMP connection
  useEffect(() => {
    if (!groupId || !token) return;

    fetchHistory();

    const brokerUrl = getWsUrl();

    console.info('Connecting to WebSocket:', brokerUrl);

    const client = new Client({
      brokerURL: brokerUrl,

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      debug: (message) => {
        console.debug('[STOMP]', message);
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      console.info('STOMP connected successfully');

      setIsConnected(true);
      setError(null);

      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];

      // A. Group messages
      const chatSub = client.subscribe(
        `/topic/groups/${groupId}/chat`,
        (message: IMessage) => {
          try {
            const newMsg: ChatMessage = JSON.parse(message.body);

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) {
                return prev.map((m) =>
                  m.id === newMsg.id ? newMsg : m
                );
              }

              return [...prev, newMsg];
            });
          } catch (e) {
            console.error('Error parsing chat message:', e);
          }
        }
      );

      subscriptionsRef.current.push(chatSub);

      // B. Typing indicator
      const typingSub = client.subscribe(
        `/topic/groups/${groupId}/typing`,
        (message: IMessage) => {
          try {
            const typingDto: TypingIndicator = JSON.parse(message.body);

            if (typingDto.userId === user?.id) return;

            setTypingUsers((prev) => {
              const next = new Map(prev);

              if (typingDto.isTyping) {
                next.set(typingDto.userId, typingDto.userName);
              } else {
                next.delete(typingDto.userId);
              }

              return next;
            });
          } catch (e) {
            console.error('Error parsing typing event:', e);
          }
        }
      );

      subscriptionsRef.current.push(typingSub);

      // C. Read receipts
      const readSub = client.subscribe(
        `/topic/groups/${groupId}/read`,
        (message: IMessage) => {
          try {
            const receipt = JSON.parse(message.body);

            setMessages((prev) =>
              prev.map((m) => {
                if (
                  m.id === receipt.messageId &&
                  !m.readByUserIds.includes(receipt.userId)
                ) {
                  return {
                    ...m,
                    readByUserIds: [
                      ...m.readByUserIds,
                      receipt.userId,
                    ],
                  };
                }

                return m;
              })
            );
          } catch (e) {
            console.error('Error parsing read receipt:', e);
          }
        }
      );

      subscriptionsRef.current.push(readSub);
    };

    // STOMP errors
    client.onStompError = (frame) => {
      console.error('STOMP broker error:', frame.headers);
      setError(
        frame.headers['message'] || 'Chat broker error'
      );
    };

    // WebSocket errors
    client.onWebSocketError = (event) => {
      console.error('WebSocket connection error:', event);
      setError('Unable to connect to the chat server.');
    };

    // WebSocket closed
    client.onWebSocketClose = (event) => {
      console.error('WebSocket closed:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });

      setIsConnected(false);
    };

    client.onDisconnect = () => {
      console.info('STOMP disconnected');
      setIsConnected(false);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [groupId, token, fetchHistory, user?.id]);

  // 3. Send message
  const sendMessage = useCallback(
    (content: string, mediaUrl?: string) => {
      if (
        !clientRef.current?.connected ||
        !groupId ||
        !content.trim()
      ) {
        return;
      }

      clientRef.current.publish({
        destination: `/app/groups/${groupId}/chat`,
        body: JSON.stringify({
          content: content.trim(),
          messageType: mediaUrl ? 'IMAGE' : 'TEXT',
          mediaUrl,
        }),
      });
    },
    [groupId]
  );

  // 4. Typing indicator
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!clientRef.current?.connected || !groupId) return;

      clientRef.current.publish({
        destination: `/app/groups/${groupId}/typing`,
        body: JSON.stringify({
          groupId,
          isTyping,
        }),
      });

      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          sendTyping(false);
        }, 3000);
      }
    },
    [groupId]
  );

  // 5. Mark message as read
  const markAsRead = useCallback(
    (messageId: number) => {
      if (!clientRef.current?.connected || !groupId) return;

      clientRef.current.publish({
        destination: `/app/groups/${groupId}/read`,
        body: JSON.stringify(messageId),
      });
    },
    [groupId]
  );

  return {
    messages,
    typingUsers: Array.from(typingUsers.values()),
    isConnected,
    isLoading,
    error,
    sendMessage,
    sendTyping,
    markAsRead,
    reloadHistory: fetchHistory,
  };
}
