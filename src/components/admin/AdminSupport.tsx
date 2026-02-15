import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, X, CheckCircle, Plus, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Conversation {
  user_id: string;
  full_name: string;
  unread_count: number;
  last_message: string;
  last_message_at: string;
  is_closed: boolean;
}

const AdminSupport = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newConvoOpen, setNewConvoOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch all users for new conversation dialog
  const { data: allUsers } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filteredUsers = allUsers?.filter(u => {
    const search = userSearch.toLowerCase();
    return (u.full_name?.toLowerCase().includes(search) || u.phone?.includes(search) || u.id.includes(search));
  }) || [];

  const startConversation = (userId: string) => {
    setSelectedUser(userId);
    setNewConvoOpen(false);
    setUserSearch("");
  };

  // Fetch conversations list
  const { data: conversations, refetch: refetchConversations } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: async () => {
      // First get all messages
      const { data: messages, error: messagesError } = await supabase
        .from('support_messages')
        .select('user_id, message, is_read, is_from_admin, created_at, conversation_closed')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Get unique user IDs
      const userIds = [...new Set(messages?.map(m => m.user_id) || [])];
      
      if (userIds.length === 0) return [];

      // Fetch profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id -> profile
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Group by user
      const userMap = new Map<string, Conversation>();
      messages?.forEach((msg) => {
        if (!userMap.has(msg.user_id)) {
          const profile = profileMap.get(msg.user_id);
          userMap.set(msg.user_id, {
            user_id: msg.user_id,
            full_name: profile?.full_name || 'Utilizador',
            unread_count: 0,
            last_message: msg.message,
            last_message_at: msg.created_at,
            is_closed: msg.conversation_closed || false,
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
          event: '*',
          schema: 'public',
          table: 'support_messages',
        },
        () => {
          refetchConversations();
          if (selectedUser) {
            refetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, refetchConversations, refetchMessages]);

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
      refetchConversations();
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem');
    },
  });

  const closeConversation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return;

      // Send closing message
      const { error: messageError } = await supabase.from('support_messages').insert({
        user_id: selectedUser,
        message: "--- Conversa encerrada pelo suporte ---",
        is_from_admin: true,
        is_read: false,
        conversation_closed: true,
      });

      if (messageError) throw messageError;

      // Mark all messages as closed
      const { error: updateError } = await supabase
        .from('support_messages')
        .update({ conversation_closed: true })
        .eq('user_id', selectedUser);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success('Conversa encerrada com sucesso');
      setSelectedUser(null);
      refetchConversations();
    },
    onError: () => {
      toast.error('Erro ao encerrar conversa');
    },
  });

  const reopenConversation = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return;

      // Mark all messages as open
      const { error } = await supabase
        .from('support_messages')
        .update({ conversation_closed: false })
        .eq('user_id', selectedUser);

      if (error) throw error;

      // Send reopening message
      await supabase.from('support_messages').insert({
        user_id: selectedUser,
        message: "--- Conversa reaberta pelo suporte ---",
        is_from_admin: true,
        is_read: false,
        conversation_closed: false,
      });
    },
    onSuccess: () => {
      toast.success('Conversa reaberta');
      refetchConversations();
      refetchMessages();
    },
    onError: () => {
      toast.error('Erro ao reabrir conversa');
    },
  });

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage.mutate();
    }
  };

  const selectedConversation = conversations?.find(c => c.user_id === selectedUser);
  const isConversationClosed = selectedConversation?.is_closed || false;

  return (
    <div className="flex h-[calc(100vh-200px)] gap-0 md:gap-6">
      {/* Conversations List - hidden on mobile when a conversation is selected */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 rounded-xl border border-border bg-card overflow-hidden flex-col`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Conversas</h3>
          <Dialog open={newConvoOpen} onOpenChange={setNewConvoOpen}>
            <Button variant="outline" size="sm" onClick={() => setNewConvoOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Nova
            </Button>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Conversa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por nome, telefone ou ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {filteredUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum utilizador encontrado</p>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => startConversation(u.id)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{u.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.phone || u.id.slice(0, 8)}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
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
                } ${conv.is_closed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      conv.is_closed ? 'bg-muted' : 'bg-primary/20'
                    }`}>
                      {conv.is_closed ? (
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="font-medium">{conv.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {conv.is_closed && (
                      <Badge variant="secondary" className="text-xs">
                        Encerrada
                      </Badge>
                    )}
                    {conv.unread_count > 0 && (
                      <Badge className="bg-primary text-primary-foreground">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
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

      {/* Chat Area - hidden on mobile when no conversation is selected */}
      <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 rounded-xl border border-border bg-card overflow-hidden flex-col`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden p-1 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isConversationClosed ? 'bg-muted' : 'bg-primary/20'
                  }`}>
                    {isConversationClosed ? (
                      <CheckCircle className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{selectedConversation?.full_name}</p>
                      {isConversationClosed && (
                        <Badge variant="secondary" className="text-xs">Encerrada</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ID: {selectedUser.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isConversationClosed ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => reopenConversation.mutate()}
                      disabled={reopenConversation.isPending}
                    >
                      Reabrir Conversa
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => closeConversation.mutate()}
                      disabled={closeConversation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Encerrar
                    </Button>
                  )}
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
                      className={`max-w-[85%] md:max-w-[70%] px-4 py-2 rounded-2xl ${
                        msg.message.includes('--- Conversa') 
                          ? 'bg-muted/50 text-muted-foreground text-center w-full max-w-full'
                          : msg.is_from_admin
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.message.includes('--- Conversa')
                          ? 'text-muted-foreground'
                          : msg.is_from_admin 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 md:p-4 border-t border-border">
              {isConversationClosed ? (
                <div className="text-center text-muted-foreground text-sm py-2">
                  Esta conversa está encerrada. Reabra para continuar.
                </div>
              ) : (
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
              )}
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
