import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User } from "lucide-react";
import { toast } from "sonner";

interface Conversation {
  user_id: string;
  full_name: string;
  unread_count: number;
  last_message: string;
  last_message_at: string;
}

const AdminSupport = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch conversations list
  const { data: conversations } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from('support_messages')
        .select(`
          user_id,
          message,
          is_read,
          is_from_admin,
          created_at,
          profiles:user_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user
      const userMap = new Map<string, Conversation>();
      messages?.forEach((msg) => {
        if (!userMap.has(msg.user_id)) {
          userMap.set(msg.user_id, {
            user_id: msg.user_id,
            full_name: (msg.profiles as any)?.full_name || 'Utilizador',
            unread_count: 0,
            last_message: msg.message,
            last_message_at: msg.created_at,
          });
        }
        if (!msg.is_read && !msg.is_from_admin) {
          const conv = userMap.get(msg.user_id)!;
          conv.unread_count++;
        }
      });

      return Array.from(userMap.values());
    },
  });

  // Fetch messages for selected user
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['admin-messages', selectedUser],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', selectedUser)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark as read
      await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('user_id', selectedUser)
        .eq('is_from_admin', false);

      return data;
    },
    enabled: !!selectedUser,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-support-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
          if (selectedUser) {
            refetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, queryClient, refetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !newMessage.trim()) return;

      const { error } = await supabase.from('support_messages').insert({
        user_id: selectedUser,
        message: newMessage.trim(),
        is_from_admin: true,
        is_read: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem');
    },
  });

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage.mutate();
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6">
      {/* Conversations List */}
      <div className="w-80 rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Conversas</h3>
        </div>
        <ScrollArea className="h-[calc(100%-60px)]">
          {conversations?.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              Nenhuma conversa
            </p>
          ) : (
            conversations?.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => setSelectedUser(conv.user_id)}
                className={`w-full p-4 text-left hover:bg-muted/50 transition-colors border-b border-border/50 ${
                  selectedUser === conv.user_id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{conv.full_name}</span>
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge className="bg-primary text-primary-foreground">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate pl-10">
                  {conv.last_message}
                </p>
                <p className="text-xs text-muted-foreground pl-10 mt-1">
                  {new Date(conv.last_message_at).toLocaleString('pt-PT')}
                </p>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">
                    {conversations?.find(c => c.user_id === selectedUser)?.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ID: {selectedUser.slice(0, 8)}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_from_admin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                        msg.is_from_admin
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.is_from_admin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-3">
                <Input
                  placeholder="Escreva a sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend} disabled={sendMessage.isPending || !newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Seleccione uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
