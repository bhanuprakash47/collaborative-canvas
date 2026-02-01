const express = require('express');
const cors=require("cors")
const http=require("http")
const {Server}=require("socket.io")
const state=require("./state-manager");


//Initialize Express app and HTTP server
const app = express(); 
app.use(cors()) 
app.use(express.json())

const server=http.createServer(app)

//Initialize Socket.io server
const io= new Server(server,{
    cors:{
        origin:"*",
    }
})

// Serve static files from the 'client' directory
app.use(express.static('client'))

//store drawing history for undo/redo
let strokeHistory=[]
let redoStack=[]

// Handle socket.io connections
io.on("connection",(socket)=>{
    console.log("User is connected successfully",socket.id)

    const cursors=state.getCursors()

    const user=state.addUser(socket.id)
    console.log(user)
    const users=state.getUsers()
    console.log(users)
    // Send the updated users list to all clients
    io.emit("users_list",users)
    
    // Send current cursor positions with colors to the newly connected client.
    const cursorsWithColor = {};
    Object.entries(state.getCursors()).forEach(([id, pos]) => {
    cursorsWithColor[id] = {
        x: pos.x,
        y: pos.y,
        color: state.getUser(id)?.color || "#000000"
    };
    });
    socket.emit("cursor_positions", cursorsWithColor);


    // Handle drawing step from client
    socket.on("drawing_step",(data)=>{
        try{
            if (!data || !data.start || !data.end) return;
            strokeHistory.push(data)
            redoStack=[]
            socket.broadcast.emit("drawing_step",data)
        }catch(err){
            console.error("Error handling drawing step:",err)
        }
    })

    // Handle undo request from client
    socket.on("undo",()=>{
        console.log("Undo received from",socket.id)
        try{
            if(strokeHistory.length===0) return;

            const lastStroke=strokeHistory.pop()
            redoStack.push(lastStroke)

            io.emit("rebuild_canvas",strokeHistory)
        }catch(err){
            console.error("Error handling undo:",err)
        }
    })

    // Handle redo request from client
    socket.on("redo",()=>{
        console.log("Redo received from",socket.id)
        try{
            if(redoStack.length===0) return;

            const restoredStroke= redoStack.pop()
            strokeHistory.push(restoredStroke)

            io.emit("rebuild_canvas",strokeHistory)
        }catch(err){
            console.error("Error handling redo:",err)
        }
    })

    // Handle clear canvas request from client
    socket.on("clear_canvas",()=>{
        console.log("Clear canvas received from",socket.id)
        try{
            strokeHistory=[]
            redoStack=[]
            
            io.emit("rebuild_canvas",strokeHistory)
        }catch(err){
            console.error("Error handling clear canvas:",err)
        }
    })

    // Handle cursor movement from client
    socket.on("cursor_move",(data)=>{
        try{
            const cursor=state.addCursor(socket.id,data)
            socket.broadcast.emit("cursor_update",{
                id:socket.id,
                position:data,
                color:state.getUser(socket.id)?.color
            })
        }catch(err){
            console.error("Error handling cursor move:",err)
        }
    })

    // Handle client disconnection
    socket.on("disconnect",()=>{
        try{
        // Remove user's cursor and notify other clients
            state.removeCursors(socket.id)
            socket.broadcast.emit("cursor_remove",socket.id)
        }catch(err){
            console.error("Error handling disconnect:",err)
        }

        try{
        // Remove user and update users list
            state.removeUser(socket.id)
            io.emit("users_list",state.getUsers())
        }catch(err){
            console.error("Error handling user removal:",err)
        }
        console.log("User is disconnected",socket.id)
    })
})

// Start the server
const PORT=process.env.PORT || 3000
server.listen(PORT,()=>{
    console.log("server running in port",PORT)
})