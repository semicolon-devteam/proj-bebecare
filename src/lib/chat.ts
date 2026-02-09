import { supabase } from './supabase';

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/**
 * Create a new conversation
 */
export async function createConversation(userId: string, title?: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: title || '새 대화',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return data;
}

/**
 * Get user's conversations
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

/**
 * Save a message to a conversation
 */
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    return null;
  }

  return data;
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<boolean> {
  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation title:', error);
    return false;
  }

  return true;
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }

  return true;
}

/**
 * Generate conversation title from first user message
 */
export function generateConversationTitle(firstMessage: string): string {
  const maxLength = 50;
  const trimmed = firstMessage.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.substring(0, maxLength) + '...';
}
