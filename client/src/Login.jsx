import { useState } from "react";

export default function LoginForm({ handleSubmit }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            background: "#f0f0f0"
        }}>
            <form onSubmit={e=>{
                handleSubmit(e, {username, password})
            }} style={{
                display: "flex",
                flexDirection: "column",
                padding: 20,
                borderRadius: 8,
                background: "#fff",
                boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                width: 300
            }}>
                <h2 style={{ textAlign: "center", marginBottom: 20 }}>Login</h2>

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{
                        padding: 10,
                        marginBottom: 15,
                        borderRadius: 4,
                        border: "1px solid #ccc",
                        fontSize: 14
                    }}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                        padding: 10,
                        marginBottom: 20,
                        borderRadius: 4,
                        border: "1px solid #ccc",
                        fontSize: 14
                    }}
                />

                <button type="submit" style={{
                    padding: 10,
                    borderRadius: 4,
                    border: "none",
                    background: "#0070f3",
                    color: "#fff",
                    fontSize: 16,
                    cursor: "pointer"
                }}>
                    Login
                </button>
            </form>
        </div>
    );
}
