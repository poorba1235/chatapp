import React, { useState, useEffect } from "react";

// User credentials - In a real app, these would be stored securely in a database
const USERS = [
  { 
    id: "u1", 
    name: "Putha", 
    avatar: "👨", 
    color: "#2196F3",
    password: "putha123", // Simple passwords for demo
    role: "Father",
    sinhalaRole: ""
  },
  { 
    id: "u2", 
    name: "Duwa", 
    avatar: "👩", 
    color: "#E91E63",
    password: "duwa123",
    role: "Mother ",
    sinhalaRole: ""
  },
  { 
    id: "u3", 
    name: "Keerthi", 
    avatar: "👨", 
    color: "#4CAF50",
    password: "keerthi123",
    role: "Son",
    sinhalaRole: ""
  },
  { 
    id: "u4", 
    name: "Priyanka", 
    avatar: "👸", 
    color: "#9C27B0",
    password: "priyanka123",
    role: "Daughter  - Admin",
    sinhalaRole: "",
    isAdmin: true
  },
];

const PRIYANKA_ID = "u4";

export default function Login({ onLogin }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hoveredUser, setHoveredUser] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Check for saved login on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('familyChat_user');
    const savedTimestamp = localStorage.getItem('familyChat_timestamp');
    
    if (savedUser && savedTimestamp) {
      // Check if saved login is less than 7 days old
      const now = new Date().getTime();
      const savedTime = parseInt(savedTimestamp);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      if (now - savedTime < sevenDays) {
        const user = JSON.parse(savedUser);
        onLogin(user);
      } else {
        // Clear expired login
        localStorage.removeItem('familyChat_user');
        localStorage.removeItem('familyChat_timestamp');
      }
    }
  }, [onLogin]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setPassword("");
    setError("");
  };

  const handleLogin = (e) => {
    e?.preventDefault();
    
    if (!selectedUser) {
      setError("කරුණාකර පරිශීලකයෙක් තෝරන්න");
      return;
    }

    if (password === selectedUser.password) {
      // Save to localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('familyChat_user', JSON.stringify(selectedUser));
        localStorage.setItem('familyChat_timestamp', new Date().getTime().toString());
      }
      
      // Add a small animation effect
      const button = document.getElementById(`login-button`);
      if (button) {
        button.style.transform = "scale(0.95)";
        setTimeout(() => {
          button.style.transform = "scale(1)";
          onLogin(selectedUser);
        }, 150);
      } else {
        onLogin(selectedUser);
      }
    } else {
      setError("වැරදි මුරපදයකි! නැවත උත්සාහ කරන්න");
      setPassword("");
    }
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPassword("");
    setError("");
  };

  // If a user is selected, show password input
  if (selectedUser) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: "20px"
      }}>
        <div style={{
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          padding: "40px",
          maxWidth: "400px",
          width: "100%",
          animation: "slideIn 0.5s ease-out"
        }}>
          {/* Back button */}
          <button
            onClick={handleBack}
            style={{
              background: "none",
              border: "none",
              color: "#667781",
              cursor: "pointer",
              fontSize: "14px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}
          >
            ← ආපසු
          </button>

          {/* Selected user info */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div style={{ 
              fontSize: "80px", 
              marginBottom: "10px",
              animation: "bounce 1s infinite"
            }}>
              {selectedUser.avatar}
            </div>
            <h2 style={{ margin: "0 0 5px 0", color: "#333" }}>
              {selectedUser.name}
            </h2>
            <p style={{ 
              margin: "0", 
              color: "#667781",
              fontSize: "14px"
            }}>
              {selectedUser.role}
            </p>
            {selectedUser.isAdmin && (
              <span style={{
                display: "inline-block",
                marginTop: "10px",
                padding: "5px 15px",
                background: "#ffd700",
                color: "#333",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                👑 පරිපාලක (Admin)
              </span>
            )}
          </div>

          {/* Password input form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontSize: "14px",
                fontWeight: "500"
              }}>
                මුරපදය ඇතුළු කරන්න:
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="●●●●●●●●"
                  style={{
                    width: "100%",
                    padding: "12px",
                    paddingRight: "40px",
                    border: error ? "2px solid #f44336" : "2px solid #e0e0e0",
                    borderRadius: "10px",
                    fontSize: "16px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box"
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#667781"
                  }}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {error && (
                <p style={{
                  color: "#f44336",
                  fontSize: "13px",
                  marginTop: "5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}>
                  <span>❌</span> {error}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "20px",
              gap: "8px"
            }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer"
                }}
              />
              <label 
                htmlFor="rememberMe"
                style={{
                  color: "#333",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                මාව මතක තබා ගන්න (Remember me for 7 days)
              </label>
            </div>

            {/* Password hint for demo */}
            <div style={{
              background: "#e8f5e9",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#2e7d32"
            }}>
              <strong>🔑  password already send to whatsap:</strong>
            </div>

            <button
              id="login-button"
              type="submit"
              disabled={!password}
              style={{
                width: "100%",
                padding: "14px",
                background: !password ? "#b3b3b3" : selectedUser.color,
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: !password ? "default" : "pointer",
                transition: "all 0.2s",
                boxShadow: !password ? "none" : `0 5px 15px ${selectedUser.color}80`
              }}
            >
              ඇතුළු වන්න (Login)
            </button>
          </form>

          {/* Demo instructions */}
          <p style={{
            marginTop: "20px",
            textAlign: "center",
            color: "#667781",
            fontSize: "12px",
            borderTop: "1px solid #e0e0e0",
            paddingTop: "20px"
          }}>
            ⭐ උඩ තියෙන මුරපදය ඇතුළු කරන්න ⭐
          </p>
        </div>
      </div>
    );
  }

  // User selection screen
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        padding: "40px",
        maxWidth: "600px",
        width: "100%",
        animation: "slideIn 0.5s ease-out"
      }}>
        {/* Header with Sinhala greeting */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{ fontSize: "60px", marginBottom: "10px" }}>👋</div>
          <h1 style={{ 
            color: "#333", 
            margin: "0 0 10px 0",
            fontSize: "32px"
          }}>
            Family Chat
          </h1>
          <div style={{
            background: "#f0f2f5",
            padding: "15px",
            borderRadius: "10px",
            marginTop: "15px"
          }}>
            <p style={{ 
              margin: "0 0 10px 0", 
              color: "#075e54",
              fontSize: "18px",
              fontWeight: "500"
            }}>
              👇 ඔයා කවුද කියලා තෝරන්න 👇
            </p>
            <p style={{ 
              margin: "0", 
              color: "#667781",
              fontSize: "14px",
              lineHeight: "1.6"
            }}>
              <span style={{ display: "block", marginBottom: "5px" }}>
                🇱🇰 <strong>මෙහෙම කරන්න:</strong>
              </span>
              <span style={{ display: "block", marginBottom: "3px" }}>
                1. පහත තියෙන බටන් එකෙන් ඔයාගේ නම තෝරන්න
              </span>
              <span style={{ display: "block", marginBottom: "3px" }}>
                2. ඊට පස්සේ මුරපදය ඇතුළු කරන්න
              </span>
            </p>
          </div>
        </div>

        {/* User selection buttons */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginTop: "30px"
        }}>
          {USERS.map(user => {
            const isPriyanka = user.id === PRIYANKA_ID;
            
            return (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user)}
                onMouseEnter={() => setHoveredUser(user.id)}
                onMouseLeave={() => setHoveredUser(null)}
                style={{
                  padding: "20px",
                  background: hoveredUser === user.id ? user.color : "#f8f9fa",
                  color: hoveredUser === user.id ? "white" : "#333",
                  border: `3px solid ${user.color}`,
                  borderRadius: "15px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform: hoveredUser === user.id ? "translateY(-5px)" : "translateY(0)",
                  boxShadow: hoveredUser === user.id ? `0 10px 20px ${user.color}40` : "0 2px 5px rgba(0,0,0,0.1)",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Background pattern for hover effect */}
                {hoveredUser === user.id && (
                  <div style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    right: "0",
                    bottom: "0",
                    background: `linear-gradient(45deg, ${user.color}20, ${user.color})`,
                    zIndex: "0"
                  }} />
                )}
                
                {/* Content */}
                <div style={{ position: "relative", zIndex: "1" }}>
                  <div style={{ fontSize: "48px", marginBottom: "10px" }}>
                    {user.avatar}
                  </div>
                  <h3 style={{ 
                    margin: "0 0 5px 0", 
                    fontSize: "20px",
                    fontWeight: "600"
                  }}>
                    {user.name}
                  </h3>
                  <p style={{ 
                    margin: "0", 
                    fontSize: "12px",
                    opacity: "0.8"
                  }}>
                    {user.sinhalaRole}
                  </p>
                  
                  {/* Access badge */}
                  {isPriyanka ? (
                    <span style={{
                      display: "inline-block",
                      marginTop: "10px",
                      padding: "3px 10px",
                      background: "#ffd700",
                      color: "#333",
                      borderRadius: "15px",
                      fontSize: "11px",
                      fontWeight: "bold"
                    }}>
                      🌟 සියල්ලන්ටම කතා කරන්න පුළුවන්
                    </span>
                  ) : (
                    <span style={{
                      display: "inline-block",
                      marginTop: "10px",
                      padding: "3px 10px",
                      background: "#e8f5e9",
                      color: "#2e7d32",
                      borderRadius: "15px",
                      fontSize: "11px"
                    }}>
                      💬 ප්‍රියංකාට විතරයි කතා කරන්න පුළුවන්
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with help text in Sinhala */}
        <div style={{
          marginTop: "30px",
          padding: "20px",
          background: "#f8f9fa",
          borderRadius: "10px",
          borderLeft: "4px solid #075e54"
        }}>
          <p style={{ 
            margin: "0 0 10px 0", 
            color: "#075e54", 
            fontWeight: "bold",
            fontSize: "16px"
          }}>
            ℹ️ <u>වැදගත් තොරතුරු:</u>
          </p>
          <ul style={{ 
            margin: "0", 
            paddingLeft: "20px",
            color: "#555",
            fontSize: "14px",
            lineHeight: "1.8"
          }}>
            <li>👑 <strong>ප්‍රියංකා</strong> - හැමෝටම පණිවිඩ යවන්න පුළුවන් (Admin access)</li>
            <li>👨 <strong>පුත්‍ර</strong> - ප්‍රියංකාට විතරයි පණිවිඩ යවන්න පුළුවන්</li>
            <li>👩 <strong>දුව</strong> - ප්‍රියංකාට විතරයි පණිවිඩ යවන්න පුළුවන්</li>
            <li>👨 <strong>කීර්ති</strong> - ප්‍රියංකාට විතරයි පණිවිඩ යවන්න පුළුවන්</li>
          </ul>
          <p style={{
            margin: "15px 0 0 0",
            textAlign: "center",
            color: "#667781",
            fontSize: "13px",
            borderTop: "1px solid #ddd",
            paddingTop: "15px"
          }}>
            ⭐ ඉහත බටන් වලින් ඔයාගේ නම තෝරන්න ⭐
          </p>
        </div>
      </div>

      {/* Add animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}