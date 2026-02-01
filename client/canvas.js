let canvas=document.getElementById("drawing-board")
let strokewidth=document.getElementById("stroke-width")
let color=document.getElementById("color")
let brush=document.getElementById("brush")
let eraser=document.getElementById("eraser")
let undoBtn=document.getElementById("undo")
let redoBtn=document.getElementById("redo")
let clearBtn=document.getElementById("clear")
let usersDiv=document.getElementById("users")



let ctx=canvas.getContext("2d")
let isDrawing=false;
let prevPos=null;
let currentPos=null
let rafId=null

ctx.lineCap="round"
ctx.lineJoin="round"

let cursors={}
let drawingDetails;
let isEraserActive=false
window.myUserColor = window.myUserColor || "#000000"



// Set tool (brush or eraser)

function setTool(tool){
    isEraserActive=tool==="eraser"

    canvas.style.cursor=tool==="eraser"?"cell":"crosshair"
}

// Brush button event listener
brush.addEventListener("click",()=>{
    setTool("brush")
})

// Eraser button event listener
eraser.addEventListener("click",()=>{
    setTool("eraser")
})

// Clear button event listener
clearBtn.addEventListener("click",()=>{
    const confirmed=confirm("Are you sure you want to clear the canvas? This action cannot be undone and clears the canvas for all users.")
    if(confirmed){
        sendClearCanvasToServer()
    }   
})


// Undo button event listener
undoBtn.addEventListener("click",()=>{
    sendUndoToServer()
})

// Redo button event listener
redoBtn.addEventListener("click",()=>{
    sendRedoToServer()
}) 

// Update users list display
function updateUsersList(totalUsers){
    usersDiv.textContent=`USERS: ${totalUsers}`
    
}       


// Clear the canvas
function clearCanvas(){
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.globalCompositeOperation="source-over"
}


// Draw stroke received from server
function drawStrokeFromServer(data){ 
    if (!data || !data.start || !data.end) return;   
    const {start,end,style,isEraser}=data

    ctx.globalCompositeOperation=isEraser?"destination-out":"source-over"

    ctx.strokeStyle=isEraser?"rgba(0,0,0,1)":style.color
    ctx.lineWidth=style.width    
    ctx.lineCap="round"
    ctx.lineJoin="round"

    ctx.beginPath()
    ctx.moveTo(start.x,start.y)
    ctx.lineTo(end.x,end.y)
    ctx.stroke()

}




// Get mouse position relative to canvas
function getCanvasCoordinates(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}


// Apply brush or eraser style
function applyBrush(style){
    if(isEraserActive){
        ctx.globalCompositeOperation="destination-out"
        ctx.strokeStyle="rgba(0,0,0,1)"
    }
    else{
        ctx.globalCompositeOperation="source-over"
        ctx.strokeStyle=style.color
    }
    
    ctx.lineWidth=style.width
    ctx.lineCap="round"
    ctx.lineJoin="round"
}


// Draw and send stroke to server
function drawAndSend(){
    if(!prevPos || !currentPos){
        rafId=null
        return;
    }

    const style={
        color:color.value,
        width:Number(strokewidth.value)
    }

    applyBrush(style)
    ctx.beginPath()
    ctx.moveTo(prevPos.x,prevPos.y)
    ctx.lineTo(currentPos.x,currentPos.y)
    ctx.stroke()

    drawingDetails={
        type:"drawing_step",
        start:prevPos,
        end:currentPos,
        style,
        isEraser:isEraserActive
    }
    sendToServer(drawingDetails)

    prevPos=currentPos
    rafId=null
}

// Stop drawing
function stopDrawing(){
    isDrawing=false
    prevPos=null
    currentPos=null

    ctx.closePath()

    ctx.globalCompositeOperation="source-over"

    if(rafId){
        cancelAnimationFrame(rafId)
        rafId=null
    }
}


// Update or create remote cursor
function updateRemoteCursor({id,position,color}){
    let cursor=cursors[id]

    if(!cursor){
        cursor=document.createElement("div")
        cursor.className="cursor"
        cursor.style.backgroundColor=color||"black"
        cursor.style.position="fixed"
        cursor.style.width="10px"
        cursor.style.height="10px"
        cursor.style.borderRadius="50%"
        cursor.style.zIndex="9999"
        cursor.style.pointerEvents="none"
        cursor.style.transform="translate(-50%, -50%)"
        
        const label=document.createElement("div")
        label.textContent=id.slice(0,4)
        label.style.position="absolute"
        label.style.top="12px"
        label.style.left="50%"
        label.style.transform="translateX(-50%)"
        label.style.fontSize="10px"
        label.style.color=color||"black"
        label.style.whiteSpace="nowrap"
        cursor.appendChild(label)
        
        document.body.appendChild(cursor)
        cursors[id]=cursor
    }

    const rect = canvas.getBoundingClientRect()
    const screenX = rect.left + (position.x * rect.width)
    const screenY = rect.top + (position.y * rect.height)
    cursor.style.left=`${screenX}px`
    cursor.style.top=`${screenY}px`
}

// Remove remote cursor
function removeRemoteCursor(id){
    if(cursors[id]){
        cursors[id].remove()
        delete cursors[id]
    }
}

// Mouse down event handler
canvas.addEventListener("mousedown",(e)=>{
    isDrawing=true
    prevPos=getCanvasCoordinates(e,canvas)
    currentPos=prevPos
    ctx.beginPath()
    ctx.moveTo(prevPos.x,prevPos.y)

})


// Mouse move event handler
canvas.addEventListener("mousemove",(e)=>{
    const {x,y}=getCanvasCoordinates(e,canvas)

    const normX = x / canvas.width
    const normY = y / canvas.height

    if(typeof sendCursorPositionToServer === "function"){
        sendCursorPositionToServer({x: normX, y: normY},window.myUserColor)
    }

    if(!isDrawing) return
    currentPos={x,y}

    
    if(!rafId){
        rafId=requestAnimationFrame(drawAndSend)
    }
})


// Mouse up event handler
canvas.addEventListener("mouseup",()=>{
    stopDrawing()
})


// Mouse leave event handler
canvas.addEventListener("mouseleave",()=>{
    stopDrawing()
})

