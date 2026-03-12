import React, { useEffect, useState, useRef, useCallback } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, where, updateDoc, getDocs } from "firebase/firestore";

const USERS = [
  { id: "u1", name: "Putha", avatar: "👨" },
  { id: "u2", name: "Duwa", avatar: "👩" },
  { id: "u3", name: "Keerthi", avatar: "👨" },
  { id: "u4", name: "Priyanka", avatar: "👩" },
];

// Priyanka's ID
const PRIYANKA_ID = "u4";

// Notification sound
const notificationSound = new Audio('./notification.mp3');

export default function Chat({ currentUser }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [unreadCount, setUnreadCount] = useState({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const notificationRef = useRef(null);

  const isPriyanka = currentUser.id === PRIYANKA_ID;
  const isMobile = windowWidth <= 768;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationPermission(true);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            setNotificationPermission(true);
          }
        });
      }
    }
  }, []);

  // Filter users based on access rules
  const getAvailableUsers = () => {
    if (isPriyanka) {
      return USERS.filter(u => u.id !== currentUser.id);
    } else {
      return USERS.filter(u => u.id === PRIYANKA_ID);
    }
  };

  const availableUsers = getAvailableUsers();
  
  // Filter users by search term
  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Show browser notification
  const showNotification = useCallback((sender, messageText) => {
    if (document.hasFocus() && selectedUser?.id === sender) {
      return;
    }

    notificationSound.play().catch(e => console.log("Audio play failed:", e));

    if (notificationPermission && "Notification" in window) {
      const senderName = USERS.find(u => u.id === sender)?.name || "Unknown";
      
      const notification = new Notification(`💬 Message from ${senderName}`, {
        body: messageText,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'family-chat',
        renotify: true,
        vibrate: [200, 100, 200] // Vibration pattern for mobile
      });

      notification.onclick = () => {
        window.focus();
        setSelectedUser(USERS.find(u => u.id === sender));
        if (isMobile) {
          setShowSidebar(false);
        }
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    }
  }, [notificationPermission, selectedUser, isMobile]);

  // Listen for messages
  useEffect(() => {
    if (!selectedUser) return;

    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, snapshot => {
      const allMsgs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() 
      }));

      const filtered = allMsgs.filter(
        m =>
          (m.sender === currentUser.id && m.receiver === selectedUser.id) ||
          (m.sender === selectedUser.id && m.receiver === currentUser.id)
      );

      const newMessages = filtered.filter(m => 
        !messages.some(old => old.id === m.id) &&
        m.sender !== currentUser.id
      );

      newMessages.forEach(msg => {
        showNotification(msg.sender, msg.text);
      });

      setMessages(filtered);
    });

    return () => unsubscribe();
  }, [selectedUser, currentUser.id, messages, showNotification]);

  // Track unread messages
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, snapshot => {
      const allMsgs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));

      const counts = {};
      USERS.forEach(user => {
        if (user.id !== currentUser.id) {
          const unread = allMsgs.filter(m => 
            m.sender === user.id && 
            m.receiver === currentUser.id &&
            !m.read &&
            (!selectedUser || selectedUser.id !== user.id)
          ).length;
          
          if (unread > 0) {
            counts[user.id] = unread;
          }
        }
      });
      
      setUnreadCount(counts);

      const totalUnread = Object.values(counts).reduce((a, b) => a + b, 0);
      document.title = totalUnread > 0 ? `(${totalUnread}) Family Chat` : "Family Chat";
    });

    return () => unsubscribe();
  }, [currentUser.id, selectedUser]);

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser) return;

    await addDoc(collection(db, "messages"), {
      text: text.trim(),
      sender: currentUser.id,
      receiver: selectedUser.id,
      timestamp: new Date(),
      read: false
    });

    setText("");
    inputRef.current?.focus();
  };

  // Mark messages as read
  useEffect(() => {
    if (!selectedUser) return;

    const markAsRead = async () => {
      const q = query(
        collection(db, "messages"),
        where("sender", "==", selectedUser.id),
        where("receiver", "==", currentUser.id),
        where("read", "==", false)
      );

      const snapshot = await getDocs(q);
      snapshot.docs.forEach(async (doc) => {
        await updateDoc(doc.ref, { read: true });
      });
    };

    markAsRead();
  }, [selectedUser, currentUser.id]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Simulate typing indicator
  useEffect(() => {
    if (text) {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [text]);

  const handleLogout = () => {
    localStorage.removeItem('familyChat_user');
    localStorage.removeItem('familyChat_timestamp');
    window.location.reload();
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    if (isMobile) {
      setShowSidebar(true);
    }
  };

  // Mobile styles
  const mobileStyles = {
    sidebar: {
      width: "100%",
      position: "absolute",
      left: showSidebar ? 0 : "-100%",
      top: 0,
      bottom: 0,
      zIndex: 10,
      transition: "left 0.3s ease-in-out"
    },
    chatArea: {
      width: "100%",
      position: "absolute",
      left: !showSidebar ? 0 : "100%",
      top: 0,
      bottom: 0,
      zIndex: 5,
      transition: "left 0.3s ease-in-out"
    }
  };

  return (
    <div style={{ 
      position: "relative",
      width: "100%",
      height: "100vh",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: "#f0f2f5",
      overflow: "hidden"
    }}>
      {/* Sidebar */}
      <div style={{ 
        width: isMobile ? "100%" : "320px",
        height: "100%",
        background: "#fff",
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        position: isMobile ? "absolute" : "relative",
        ...(isMobile ? mobileStyles.sidebar : {}),
        ...(isMobile ? {} : { flexShrink: 0 })
      }}>
        {/* Sidebar Header with Logout */}
        <div style={{ 
          padding: isMobile ? "15px" : "20px", 
          background: "#075e54",
          color: "#fff"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: isMobile ? "20px" : "24px" }}>
              {USERS.find(u => u.id === currentUser.id)?.avatar}
            </span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0", fontSize: isMobile ? "16px" : "18px" }}>
                {currentUser.name}
              </h3>
              <p style={{ margin: "5px 0 0", fontSize: "11px", opacity: "0.8" }}>
                {isPriyanka ? "Admin" : "Chat with Priyanka"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                padding: isMobile ? "4px 8px" : "5px 10px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: isMobile ? "11px" : "12px",
                display: "flex",
                alignItems: "center",
                gap: "3px"
              }}
            >
              🚪 {!isMobile && "Logout"}
            </button>
          </div>
          
          {/* Mobile Search Toggle */}
          {isMobile && (
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={() => setShowSearch(!showSearch)}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "20px",
                  color: "white",
                  textAlign: "left",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                🔍 {showSearch ? "Close search" : "Search members..."}
              </button>
            </div>
          )}
        </div>

        {/* Search Bar - Desktop */}
        {!isMobile && (
          <div style={{ padding: "12px", background: "#f6f6f6" }}>
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "none",
                borderRadius: "20px",
                outline: "none",
                background: "#fff"
              }}
            />
          </div>
        )}

        {/* Mobile Search Bar */}
        {isMobile && showSearch && (
          <div style={{ padding: "10px", background: "#f6f6f6" }}>
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                padding: "10px",
                border: "none",
                borderRadius: "20px",
                outline: "none",
                background: "#fff"
              }}
            />
          </div>
        )}

        {/* Notification Status */}
        {!notificationPermission && (
          <div style={{
            padding: "10px",
            background: "#fff3cd",
            color: "#856404",
            fontSize: isMobile ? "11px" : "12px",
            textAlign: "center",
            borderBottom: "1px solid #ffeeba"
          }}>
            🔔 Enable notifications
            <button
              onClick={() => Notification.requestPermission()}
              style={{
                marginLeft: "10px",
                background: "#856404",
                color: "white",
                border: "none",
                padding: "2px 8px",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "11px"
              }}
            >
              Enable
            </button>
          </div>
        )}

        {/* Users List */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(u => (
              <div
                key={u.id}
                onClick={() => handleUserSelect(u)}
                style={{
                  padding: isMobile ? "12px 15px" : "15px 20px",
                  cursor: "pointer",
                  background: selectedUser?.id === u.id && !isMobile ? "#f0f2f5" : "#fff",
                  borderBottom: "1px solid #f0f2f5",
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "12px" : "15px",
                  transition: "background 0.2s",
                  position: "relative",
                  ...(selectedUser?.id === u.id && !isMobile ? {
                    borderLeft: "4px solid #075e54"
                  } : {})
                }}
                onMouseEnter={(e) => {
                  if (!isMobile && selectedUser?.id !== u.id) {
                    e.currentTarget.style.background = "#f5f5f5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile && selectedUser?.id !== u.id) {
                    e.currentTarget.style.background = "#fff";
                  }
                }}
              >
                <span style={{ fontSize: isMobile ? "28px" : "32px" }}>{u.avatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: isMobile ? "14px" : "16px"
                  }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.name}
                    </span>
                    {unreadCount[u.id] > 0 && (
                      <span style={{
                        background: "#25D366",
                        color: "white",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        flexShrink: 0
                      }}>
                        {unreadCount[u.id]}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: isMobile ? "11px" : "12px", color: "#667781" }}>
                    {u.id === PRIYANKA_ID ? "Admin" : "Family Member"}
                  </div>
                </div>
                {u.id === PRIYANKA_ID && !isPriyanka && (
                  <span style={{ 
                    fontSize: isMobile ? "10px" : "11px", 
                    color: "#075e54",
                    background: "#e8f5e9",
                    padding: "2px 6px",
                    borderRadius: "12px",
                    whiteSpace: "nowrap"
                  }}>
                    Only
                  </span>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "#667781" }}>
              No members available
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ 
        flex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#efeae2",
        position: isMobile ? "absolute" : "relative",
        ...(isMobile ? mobileStyles.chatArea : {})
      }}>
        {selectedUser ? (
          <>
            {/* Chat Header with Back Button for Mobile */}
            <div style={{ 
              padding: isMobile ? "10px 15px" : "15px 20px", 
              background: "#f0f2f5",
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "10px" : "15px"
            }}>
              {isMobile && (
                <button
                  onClick={handleBackToUsers}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    padding: "5px",
                    color: "#075e54"
                  }}
                >
                  ←
                </button>
              )}
              <span style={{ fontSize: isMobile ? "28px" : "32px" }}>{selectedUser.avatar}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ 
                  margin: "0", 
                  fontSize: isMobile ? "15px" : "16px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {selectedUser.name}
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: isMobile ? "11px" : "12px", color: "#667781" }}>
                  {isTyping ? "typing..." : "Online"}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{ 
              flex: 1, 
              overflowY: "auto", 
              padding: isMobile ? "10px" : "20px",
              background: "#efeae2",
              WebkitOverflowScrolling: "touch"
            }}>
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                  <div style={{ 
                    textAlign: "center", 
                    margin: isMobile ? "15px 0" : "20px 0",
                    fontSize: isMobile ? "11px" : "12px",
                    color: "#667781"
                  }}>
                    <span style={{ 
                      background: "#e4e6eb",
                      padding: isMobile ? "4px 10px" : "5px 12px",
                      borderRadius: "15px"
                    }}>
                      {date}
                    </span>
                  </div>
                  
                  {dateMessages.map((msg, index) => {
                    const isMine = msg.sender === currentUser.id;
                    const otherUser = USERS.find(u => u.id === (isMine ? msg.receiver : msg.sender));
                    
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: "flex",
                          justifyContent: isMine ? "flex-end" : "flex-start",
                          marginBottom: index === dateMessages.length - 1 ? "5px" : "3px"
                        }}
                      >
                        <div
                          style={{
                            maxWidth: isMobile ? "80%" : "65%",
                            padding: isMobile ? "6px 10px" : "8px 12px",
                            borderRadius: "12px",
                            background: isMine ? "#dcf8c6" : "#fff",
                            position: "relative",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            ...(isMine ? {
                              borderBottomRightRadius: "4px"
                            } : {
                              borderBottomLeftRadius: "4px"
                            })
                          }}
                        >
                          {!isMine && (
                            <strong style={{ 
                              color: "#075e54",
                              fontSize: isMobile ? "12px" : "13px",
                              display: "block",
                              marginBottom: "2px"
                            }}>
                              {otherUser.name}
                            </strong>
                          )}
                          <p style={{ 
                            margin: "0", 
                            fontSize: isMobile ? "14px" : "14px", 
                            wordBreak: "break-word",
                            lineHeight: "1.4"
                          }}>
                            {msg.text}
                          </p>
                          <div style={{
                            fontSize: isMobile ? "10px" : "11px",
                            color: "#667781",
                            textAlign: "right",
                            marginTop: "2px"
                          }}>
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ 
              padding: isMobile ? "10px" : "15px 20px", 
              background: "#f0f2f5",
              display: "flex",
              gap: isMobile ? "8px" : "10px",
              alignItems: "center"
            }}>
              <input
                ref={inputRef}
                style={{ 
                  flex: 1, 
                  padding: isMobile ? "10px 12px" : "12px 15px",
                  border: "none",
                  borderRadius: "25px",
                  outline: "none",
                  fontSize: isMobile ? "14px" : "15px",
                  background: "#fff"
                }}
                type="text"
                value={text}
                placeholder={`Message ${selectedUser.name}...`}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />
              <button 
                onClick={sendMessage} 
                disabled={!text.trim()}
                style={{
                  width: isMobile ? "40px" : "45px",
                  height: isMobile ? "40px" : "45px",
                  borderRadius: "50%",
                  border: "none",
                  background: text.trim() ? "#075e54" : "#b3b3b3",
                  color: "#fff",
                  fontSize: isMobile ? "18px" : "20px",
                  cursor: text.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (!isMobile && text.trim()) {
                    e.currentTarget.style.background = "#128C7E";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile && text.trim()) {
                    e.currentTarget.style.background = "#075e54";
                  }
                }}
              >
                ➤
              </button>
            </div>
          </>
        ) : (
          <div style={{ 
            flex: 1, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            flexDirection: "column",
            color: "#667781",
            background: "#f0f2f5",
            padding: "20px",
            textAlign: "center"
          }}>
            <span style={{ fontSize: isMobile ? "48px" : "64px", marginBottom: "20px" }}>💬</span>
            <h2 style={{ 
              margin: "0 0 10px", 
              fontSize: isMobile ? "20px" : "24px", 
              color: "#41525d" 
            }}>
              {isPriyanka ? "Welcome, Priyanka!" : "Welcome to Family Chat"}
            </h2>
            <p style={{ 
              margin: "0", 
              fontSize: isMobile ? "13px" : "14px", 
              maxWidth: isMobile ? "280px" : "400px"
            }}>
              {isPriyanka 
                ? "You have admin access. You can chat with all family members."
                : "Select Priyanka from the sidebar to start chatting."}
            </p>
            {isMobile && !selectedUser && (
              <button
                onClick={() => setShowSidebar(true)}
                style={{
                  marginTop: "20px",
                  padding: "12px 24px",
                  background: "#075e54",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  fontSize: "16px",
                  cursor: "pointer"
                }}
              >
                Select a member
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}