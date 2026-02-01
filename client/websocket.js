let socket=null;
let myUserColor="#000000"

const drawFromServer=(data)=>{
    drawStrokeFromServer(data)
}

// Connect to WebSocket server
const connectToServer=()=>{
    socket=io()
    
    // Handle connection established
    socket.on("connect",()=>{
        console.log("User connected",socket.id)
    });

    // Handle drawing step from server
    socket.on("drawing_step",(data)=>{
        drawFromServer(data)
    })

    // Handle canvas rebuild from server
    socket.on("rebuild_canvas",(strokeHistory)=>{ 
        clearCanvas()
        console.log(strokeHistory)
        strokeHistory.forEach(data => {
            drawFromServer(data)
        });  
    })

   

    // Handle users list update from server
    socket.on("users_list", (users) => {
        if (users && users[socket.id]) {
            myUserColor = users[socket.id].color || myUserColor
        }
        updateUsersList(Object.keys(users || {}).length)
    })
         

    // Handle cursor positions from server
    socket.on("cursor_positions",(cursors)=> {
    Object.entries(cursors).forEach(([id, {x,y,color}]) => {
        updateRemoteCursor({
        id,
        position: { x, y },
        color: color || "#000000"
        });
    });
    });


    // Handle cursor updates from server
    socket.on("cursor_update",(cursor)=>{
        updateRemoteCursor(cursor)
    })

    // Handle cursor removal from server
    socket.on("cursor_remove",(cursorId)=>{
        removeRemoteCursor(cursorId)
    })
}

// Send drawing step to server
function sendToServer(data){
    if(!socket || !socket.connected){
        return
    }
    socket.emit("drawing_step",data)
}

// Send undo request to server
function sendUndoToServer(){
    if(socket && socket.connected){
        console.log("server side undo")
        socket.emit("undo")
    }
}

// Send redo request to server
function sendRedoToServer(){
    if (socket && socket.connected){
        console.log("server side redo")
        socket.emit("redo")
    }
}

// Send clear canvas request to server
function sendClearCanvasToServer(){
    if(socket && socket.connected){
        console.log("server side clear")
        socket.emit("clear_canvas")
    }
}


// Send cursor position to server (normalized 0..1)
function sendCursorPositionToServer(normPos, colorHex){
    if(!socket || !socket.connected) return
    socket.emit("cursor_move", { x: normPos.x, y: normPos.y, color: colorHex })
}