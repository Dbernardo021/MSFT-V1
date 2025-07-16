from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import json
import asyncio
from datetime import datetime
import uuid

app = FastAPI(title="Officer Distress Messaging API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

officers: Dict[str, dict] = {}
messages: Dict[str, dict] = {}
active_connections: Dict[str, WebSocket] = {}

class Officer(BaseModel):
    id: str
    name: str
    status: str = "normal"  # normal, elevated_vitals, emergency
    last_seen: datetime = datetime.now()

class Message(BaseModel):
    id: str = None
    officer_id: str
    from_dispatch: bool
    content: str
    timestamp: datetime = datetime.now()
    read: bool = False

class MessageRequest(BaseModel):
    officer_id: str
    content: str

class MessageResponse(BaseModel):
    message_id: str
    content: str

def init_sample_data():
    sample_officer = {
        "id": "officer_001",
        "name": "Daniel Bernardo",
        "status": "elevated_vitals",
        "last_seen": datetime.now()
    }
    officers["officer_001"] = sample_officer

init_sample_data()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/")
async def read_root():
    return {"message": "Officer Distress Messaging API", "status": "active"}

@app.get("/api/officers")
async def get_officers():
    return {"officers": list(officers.values())}

@app.get("/api/officers/{officer_id}")
async def get_officer(officer_id: str):
    if officer_id not in officers:
        raise HTTPException(status_code=404, detail="Officer not found")
    return officers[officer_id]

@app.post("/api/officers")
async def create_officer(officer: Officer):
    officer_data = officer.dict()
    officer_data["id"] = str(uuid.uuid4())
    officer_data["last_seen"] = datetime.now()
    officers[officer_data["id"]] = officer_data
    return officer_data

@app.put("/api/officers/{officer_id}/status")
async def update_officer_status(officer_id: str, status: str):
    if officer_id not in officers:
        raise HTTPException(status_code=404, detail="Officer not found")
    
    officers[officer_id]["status"] = status
    officers[officer_id]["last_seen"] = datetime.now()
    
    await broadcast_status_update(officer_id, status)
    
    return officers[officer_id]

@app.post("/api/messages/send")
async def send_message(message_request: MessageRequest):
    if message_request.officer_id not in officers:
        raise HTTPException(status_code=404, detail="Officer not found")
    
    message_id = str(uuid.uuid4())
    message_data = {
        "id": message_id,
        "officer_id": message_request.officer_id,
        "from_dispatch": True,
        "content": message_request.content,
        "timestamp": datetime.now(),
        "read": False
    }
    
    messages[message_id] = message_data
    
    if message_request.officer_id in active_connections:
        await active_connections[message_request.officer_id].send_text(
            json.dumps({
                "type": "message_received",
                "data": message_data,
                "timestamp": message_data["timestamp"].isoformat()
            })
        )
    
    return {"message_id": message_id, "status": "sent"}

@app.post("/api/messages/respond")
async def respond_to_message(response: MessageResponse):
    if response.message_id not in messages:
        raise HTTPException(status_code=404, detail="Message not found")
    
    original_message = messages[response.message_id]
    
    response_id = str(uuid.uuid4())
    response_data = {
        "id": response_id,
        "officer_id": original_message["officer_id"],
        "from_dispatch": False,
        "content": response.content,
        "timestamp": datetime.now(),
        "read": False,
        "in_response_to": response.message_id
    }
    
    messages[response_id] = response_data
    
    messages[response.message_id]["read"] = True
    
    await broadcast_to_dispatch({
        "type": "officer_response",
        "data": response_data,
        "officer": officers[original_message["officer_id"]],
        "timestamp": response_data["timestamp"].isoformat()
    })
    
    return {"response_id": response_id, "status": "sent"}

@app.get("/api/messages/officer/{officer_id}")
async def get_officer_messages(officer_id: str):
    if officer_id not in officers:
        raise HTTPException(status_code=404, detail="Officer not found")
    
    officer_messages = [
        msg for msg in messages.values() 
        if msg["officer_id"] == officer_id
    ]
    
    officer_messages.sort(key=lambda x: x["timestamp"])
    
    return {"messages": officer_messages}

@app.get("/api/messages/dispatch")
async def get_dispatch_messages():
    all_messages = list(messages.values())
    all_messages.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"messages": all_messages}

@app.websocket("/ws/{client_type}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_type: str, client_id: str):
    await websocket.accept()
    
    if client_type == "officer":
        active_connections[client_id] = websocket
    elif client_type == "dispatch":
        active_connections[f"dispatch_{client_id}"] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            elif message_data.get("type") == "status_update" and client_type == "officer":
                await update_officer_status(client_id, message_data.get("status", "normal"))
                
    except WebSocketDisconnect:
        if client_type == "officer" and client_id in active_connections:
            del active_connections[client_id]
        elif client_type == "dispatch" and f"dispatch_{client_id}" in active_connections:
            del active_connections[f"dispatch_{client_id}"]

async def broadcast_status_update(officer_id: str, status: str):
    message = {
        "type": "status_update",
        "officer_id": officer_id,
        "status": status,
        "officer": officers[officer_id],
        "timestamp": datetime.now().isoformat()
    }
    
    dispatch_connections = [
        conn for conn_id, conn in active_connections.items() 
        if conn_id.startswith("dispatch_")
    ]
    
    for connection in dispatch_connections:
        try:
            await connection.send_text(json.dumps(message))
        except:
            pass

async def broadcast_to_dispatch(message: dict):
    dispatch_connections = [
        conn for conn_id, conn in active_connections.items() 
        if conn_id.startswith("dispatch_")
    ]
    
    for connection in dispatch_connections:
        try:
            await connection.send_text(json.dumps(message))
        except:
            pass
