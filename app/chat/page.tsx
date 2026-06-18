"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";
import HomeButton from "@/components/HomeButton";
import { Send, MessageCircle } from "lucide-react";

type Role = "admin" | "donor" | "public";

type Message = {
  id: number;
  sender_email: string;
  sender_role: Role;
  receiver_role: Role;
  message: string;
  created_at: string;
  thread_id: number;
};

type Thread = {
  id: number;
  donation_intent_id: number;
  donor_id: string;
  donor_email: string;
  donor_name: string;
  recipient_id: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  status: string;
  created_at: string;
};

function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [me, setMe] = useState<any>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const threadIdFromUrl = searchParams.get("thread");

  useEffect(() => {
    const loadMe = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setMe(profile || null);
    };

    loadMe();
  }, []);

  useEffect(() => {
    if (!me) return;

    const loadThreads = async () => {
      let query = supabase.from("chat_threads").select("*").order("id", { ascending: false });

      if (me.role === "donor") {
        query = query.eq("donor_email", me.email);
      } else if (me.role === "public") {
        query = query.eq("recipient_email", me.email);
      }

      const { data } = await query;
      const rows = (data || []) as Thread[];
      setThreads(rows);

      if (rows.length === 0) {
        setSelectedThread(null);
        return;
      }

      if (threadIdFromUrl) {
        const found = rows.find((t) => String(t.id) === String(threadIdFromUrl));
        if (found) {
          setSelectedThread(found);
          return;
        }
      }

      setSelectedThread((prev) => {
        if (prev) {
          const stillExists = rows.find((t) => t.id === prev.id);
          if (stillExists) return stillExists;
        }
        return rows[0];
      });
    };

    loadThreads();
    const interval = setInterval(loadThreads, 3000);
    return () => clearInterval(interval);
  }, [me, threadIdFromUrl]);

  useEffect(() => {
    if (!selectedThread) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", selectedThread.id)
        .order("id", { ascending: true });

      setMessages((data || []) as Message[]);
    };

    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [selectedThread]);

  const openThread = (thread: Thread) => {
    setSelectedThread(thread);
    router.push(`/chat?thread=${thread.id}`);
  };

  const sendMessage = async () => {
    if (!input.trim() || !me || !selectedThread) return;

    let receiverRole: Role = "public";

    if (me.role === "donor") receiverRole = "public";
    else if (me.role === "public") receiverRole = "donor";
    else receiverRole = "donor";

    const { error } = await supabase.from("chat_messages").insert([
      {
        sender_email: me.email,
        sender_role: me.role,
        receiver_role: receiverRole,
        message: input.trim(),
        thread_id: selectedThread.id,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setInput("");
  };

  const title = useMemo(() => {
    if (me?.role === "admin") return "Admin Communication Hub";
    if (me?.role === "donor") return "Donor Inbox";
    return "Recipient / Hospital Inbox";
  }, [me]);

  const subtitle = useMemo(() => {
    if (me?.role === "admin") return "Monitor donor-recipient conversations.";
    if (me?.role === "donor") return "View incoming recipient conversations and reply.";
    return "Your donor-specific conversations appear here.";
  }, [me]);

  const threadHeading = useMemo(() => {
    if (!selectedThread) return "No conversation selected";

    if (me?.role === "donor") {
      return selectedThread.recipient_name || selectedThread.recipient_email || "Recipient";
    }

    if (me?.role === "public") {
      return selectedThread.donor_name || selectedThread.donor_email || "Donor";
    }

    return `${selectedThread.donor_name || selectedThread.donor_email} ↔ ${
      selectedThread.recipient_name || selectedThread.recipient_email || "Recipient"
    }`;
  }, [selectedThread, me]);

  const threadSubtext = useMemo(() => {
    if (!selectedThread) return "Choose a thread from the inbox list.";

    return `Donor: ${selectedThread.donor_name || selectedThread.donor_email} • Recipient: ${
      selectedThread.recipient_name || selectedThread.recipient_email || "Unknown"
    }`;
  }, [selectedThread]);

  const threadList = (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4 shadow-xl">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-zinc-300" />
        <h3 className="text-lg font-semibold">Inbox</h3>
      </div>

      <div className="space-y-3">
        {threads.length > 0 ? (
          threads.map((thread) => {
            const active = selectedThread?.id === thread.id;

            let primary = "";
            let secondary = "";

            if (me?.role === "donor") {
              primary = thread.recipient_name || "Recipient";
              secondary = thread.recipient_email || "";
            } else if (me?.role === "public") {
              primary = thread.donor_name || "Donor";
              secondary = `${thread.donor_email} • ${thread.donation_intent_id ? "Donation linked" : ""}`;
            } else {
              primary = `${thread.donor_name || thread.donor_email} ↔ ${
                thread.recipient_name || thread.recipient_email || "Recipient"
              }`;
              secondary = `Thread #${thread.id}`;
            }

            return (
              <button
                key={thread.id}
                onClick={() => openThread(thread)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-white/20 bg-white/10"
                    : "border-white/10 bg-black/20 hover:bg-white/5"
                }`}
              >
                <p className="font-medium text-zinc-100">{primary}</p>
                <p className="mt-1 text-sm text-zinc-400">{secondary}</p>
                <p className="mt-2 text-xs text-zinc-500">Status: {thread.status}</p>
              </button>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            No conversations yet.
          </div>
        )}
      </div>
    </div>
  );

  const chatPanel = selectedThread ? (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/70 shadow-xl">
      <div className="border-b border-white/10 p-5">
        <h3 className="text-xl font-semibold">{threadHeading}</h3>
        <p className="mt-1 text-sm text-zinc-400">{threadSubtext}</p>
      </div>

      <div className="max-h-[480px] min-h-[480px] space-y-3 overflow-y-auto p-5">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const mine = me?.email === msg.sender_email;

            return (
              <div
                key={msg.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                    mine
                      ? "bg-zinc-100 text-zinc-950"
                      : "border border-white/10 bg-zinc-950/70 text-zinc-200"
                  }`}
                >
                  <div className="mb-1 text-xs opacity-70">
                    {msg.sender_role} • {msg.sender_email}
                  </div>
                  <div>{msg.message}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-zinc-400">No messages yet.</div>
        )}
      </div>

      <div className="flex gap-3 border-t border-white/10 p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Type your message..."
          className="flex-1 rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
        />
        <button
          onClick={sendMessage}
          className="rounded-2xl bg-zinc-100 px-4 py-3 text-zinc-950"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  ) : (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-8 text-center text-zinc-300 shadow-xl">
      Choose a conversation from the inbox.
    </div>
  );

  const content = (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {threadList}
      {chatPanel}
    </div>
  );

  if (me?.role === "admin") {
    return (
      <AppShell title={title} subtitle={subtitle}>
        {content}
      </AppShell>
    );
  }

  return (
    <div
      className={`min-h-screen text-white ${
        me?.role === "donor"
          ? "bg-[radial-gradient(circle_at_top,#1b2b3a_0%,#101826_30%,#0a0f16_100%)]"
          : "bg-[radial-gradient(circle_at_top,#2d2016_0%,#19130e_30%,#0b0908_100%)]"
      }`}
    >
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">{title}</h1>
              <p className="mt-2 text-zinc-300">{subtitle}</p>
            </div>

            <HomeButton
              href={me?.role === "donor" ? "/donor" : "/public"}
              label="Dashboard"
            />
          </div>
        </div>
        {content}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading chat...
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}