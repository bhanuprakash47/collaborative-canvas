const users={}
const cursorPositions={}

const RAINBOW_COLORS = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "indigo",
    "violet"
];

// Get list of used colors
const getUsedColors = () => {
    return Object.values(users).map(user => user.color);
};

// Get an available color from the rainbow colors
const getAvailableColor = () => {
    const usedColors = getUsedColors();
    return RAINBOW_COLORS.find(color => !usedColors.includes(color))||"#000000";
};

// Add a new user with a unique color
const addUser=(socketId)=>{
    users[socketId]={
        id:socketId,
        color:getAvailableColor()
    }
    return users[socketId]
}

// Remove a user and their cursor
const removeUser=(socketId)=>{
    delete users[socketId]
    delete cursorPositions[socketId]
}

// Get all users
const getUsers=()=>{
    return users
}

// Get a specific user
const getUser=(socketId)=>{
    return users[socketId]
}

// Add or update a cursor position
const addCursor=(socketId,position)=>{
    cursorPositions[socketId]=position
}

// Get all cursor positions
const getCursors=()=>{
    return cursorPositions
}

// Remove a cursor position
const removeCursors=(socketId)=>{
    delete cursorPositions[socketId]
}

// Export the state manager functions
module.exports ={
    addUser,   
    removeUser,
    getUsers,
    getUser,
    addCursor,
    getCursors,
    removeCursors,
}