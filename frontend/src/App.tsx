import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, MessageSquare, Send, Check, Phone, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Officer {
  id: string
  name: string
  status: 'normal' | 'elevated_vitals' | 'emergency'
  last_seen: string
}

interface Message {
  id: string
  officer_id: string
  from_dispatch: boolean
  content: string
  timestamp: string
  read: boolean
  in_response_to?: string
}

function App() {
  const [userType, setUserType] = useState<'dispatch' | 'officer' | null>(null)
  const [officers, setOfficers] = useState<Officer[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [customResponse, setCustomResponse] = useState('')
  const [showCustomResponse, setShowCustomResponse] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    fetchOfficers()
    if (userType) {
      connectWebSocket()
      fetchMessages()
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [userType])

  const connectWebSocket = () => {
    if (!userType) return
    
    const wsUrl = `ws://localhost:8000/ws/${userType}/${userType === 'dispatch' ? 'dispatch_001' : 'officer_001'}`
    wsRef.current = new WebSocket(wsUrl)
    
    wsRef.current.onopen = () => {
      setConnectionStatus('connected')
    }
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'message_received' && userType === 'officer') {
        fetchMessages()
      } else if (data.type === 'officer_response' && userType === 'dispatch') {
        fetchMessages()
      } else if (data.type === 'status_update') {
        fetchOfficers()
      }
    }
    
    wsRef.current.onclose = () => {
      setConnectionStatus('disconnected')
    }
    
    wsRef.current.onerror = () => {
      setConnectionStatus('disconnected')
    }
  }

  const fetchOfficers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/officers`)
      const data = await response.json()
      setOfficers(data.officers)
    } catch (error) {
      console.error('Failed to fetch officers:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const endpoint = userType === 'dispatch' 
        ? `${API_BASE_URL}/api/messages/dispatch`
        : `${API_BASE_URL}/api/messages/officer/officer_001`
      
      const response = await fetch(endpoint)
      const data = await response.json()
      setMessages(data.messages)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!selectedOfficer || !messageContent.trim()) return
    
    try {
      await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer_id: selectedOfficer.id,
          content: messageContent
        })
      })
      
      setMessageContent('')
      fetchMessages()
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const sendQuickResponse = async (messageId: string, content: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/messages/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          content: content
        })
      })
      
      fetchMessages()
      setShowCustomResponse(false)
      setCustomResponse('')
    } catch (error) {
      console.error('Failed to send response:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'emergency': return 'bg-red-500'
      case 'elevated_vitals': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'emergency': return 'Emergency'
      case 'elevated_vitals': return 'Elevated Vitals'
      default: return 'Normal'
    }
  }

  if (!userType) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-6 w-6" />
              Officer Distress Messaging
            </CardTitle>
            <CardDescription>
              Select your role to access the messaging system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setUserType('dispatch')} 
              className="w-full h-12"
              variant="default"
            >
              <Phone className="mr-2 h-4 w-4" />
              911 Dispatch
            </Button>
            <Button 
              onClick={() => setUserType('officer')} 
              className="w-full h-12"
              variant="outline"
            >
              <Shield className="mr-2 h-4 w-4" />
              Officer Interface
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (userType === 'dispatch') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Phone className="h-6 w-6" />
              911 Dispatch - Officer Messaging
            </h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">{connectionStatus}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Officers Status</CardTitle>
                <CardDescription>Monitor officer vital signs and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {officers.map((officer) => (
                    <div 
                      key={officer.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedOfficer?.id === officer.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedOfficer(officer)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(officer.status)}`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{officer.name}</p>
                            <p className="text-sm text-gray-500">ID: {officer.id}</p>
                          </div>
                        </div>
                        <Badge variant={officer.status === 'elevated_vitals' ? 'destructive' : 'secondary'}>
                          {getStatusText(officer.status)}
                        </Badge>
                      </div>
                      {officer.status === 'elevated_vitals' && (
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Officer showing elevated vital signs - consider sending status check
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send Message</CardTitle>
                <CardDescription>
                  {selectedOfficer ? `Messaging ${selectedOfficer.name}` : 'Select an officer to send a message'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setMessageContent('Are you okay? Please respond with your status.')}
                      disabled={!selectedOfficer}
                      variant="outline"
                      size="sm"
                    >
                      Quick: Status Check
                    </Button>
                    <Button 
                      onClick={() => setMessageContent('Your vitals show elevated readings. Do you need assistance?')}
                      disabled={!selectedOfficer}
                      variant="outline"
                      size="sm"
                    >
                      Quick: Vitals Alert
                    </Button>
                  </div>
                  
                  <Textarea
                    placeholder="Type your message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="min-h-24"
                  />
                  
                  <Button 
                    onClick={sendMessage}
                    disabled={!selectedOfficer || !messageContent.trim()}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Message History</CardTitle>
              <CardDescription>Recent communications with officers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No messages yet</p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={message.from_dispatch ? 'default' : 'secondary'}>
                              {message.from_dispatch ? 'Dispatch' : 'Officer'}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-900">{message.content}</p>
                        </div>
                        {message.read && <Check className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const unreadMessages = messages.filter(msg => msg.from_dispatch && !msg.read)
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Officer Interface
          </h1>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{connectionStatus}</span>
          </div>
        </div>

        {unreadMessages.length > 0 && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {unreadMessages.length} unread message(s) from dispatch
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {messages.filter(msg => msg.from_dispatch).map((message) => (
            <Card key={message.id} className={`${!message.read ? 'border-yellow-500' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Message from Dispatch</CardTitle>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm text-gray-500">
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900 mb-4">{message.content}</p>
                
                {!message.read && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => sendQuickResponse(message.id, "I'm OK - All clear")}
                        className="flex-1"
                        variant="default"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        I'm OK
                      </Button>
                      <Button 
                        onClick={() => setShowCustomResponse(!showCustomResponse)}
                        variant="outline"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Custom Response
                      </Button>
                    </div>
                    
                    {showCustomResponse && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Type your custom response..."
                          value={customResponse}
                          onChange={(e) => setCustomResponse(e.target.value)}
                          className="min-h-20"
                        />
                        <Button 
                          onClick={() => sendQuickResponse(message.id, customResponse)}
                          disabled={!customResponse.trim()}
                          className="w-full"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send Response
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {message.read && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Response sent</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {messages.filter(msg => msg.from_dispatch).length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No messages from dispatch</p>
                <p className="text-sm text-gray-400 mt-1">You'll be notified when dispatch sends a status check</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
