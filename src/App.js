import React, { useState } from "react";
import Login from "./components/Login";
import Chat from "./components/Chat";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <div style={{ height: "100vh" }}>
      {!currentUser ? (
        <Login onLogin={setCurrentUser} />
      ) : (
        <Chat currentUser={currentUser} />
      )}
    </div>
  );
}

export default App;