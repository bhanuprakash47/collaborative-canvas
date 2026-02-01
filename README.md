# Collaborative Canvas

This project is a real-time collaborative drawing  application where multiple users can draw on the same canvas at same time, and users can able to undo/redo  others drawing. This project uses Socket.IO for real-time synchronization.

## Features

- Real-time drawing synchronization between all users.
- Global undo and redo functionality.
- Live user count display.
- Users can see others drawing in real-time.
- Color selection and adjustable stroke width.

## Technologies Used

### Frontend technologies
- HTML
- CSS
- JavaScript

### Backend technologies
- Node.js
- Express.js
- Socket.IO

## Project Structure


```
collaborative-canvas/
    client/
        - index.html
        - style.css
        - canvas.js
        - main.js
        - websocket.js
    server/
        - server.js
        - state-manager.js
    - package-lock.json
    - package.json
    - README.md
    - ARCHITECTURE.md     
 ```   

## How It Works

- When user draw on canvas client captures mouse movements.
- The drawing coordinates, stroke width,stroke color information is sent to server using Socket.IO.
- The server receives this drawing information and stores in stroke history.
- The server broadcasts the drawing to all other users in real time.
- Other users receive this drawing data and render it into canvas.
- The server maintains stroke history,redo history for undo and redo operations.
- When a user do undo or redo all others users can see changes in real time.
- when a user clicks on clear canvas, the stroke history is cleared and all other users canvas are also cleared.
- When a new user joins, the server sends the existing stroke history so the canvas can be rebuit.
- Cursor positions are also shared so users can see other users cursors in real time.

## How To Run The Project

### Prerequisites
- Node.js installed on the system

### Steps To Install And Run
1. Clone the project repository.
2. Open the project folder in a terminal.
3. Install the required dependencies: npm install
4. Start the server: npm start
5. open the browser and navigate to: http://localhost:3000

## Testing The Application with Multiple Users

- Open the application in different tabs.
- Draw on canvas and observe the drawing in other tabs in real time.
- Perform operations like undo/redo and clear canvas and verify changes is all tabs are synced in real time.
- Check the user count update when user leave or join.
- Observe cursor movements of other users in real time.

## Known Issues and Limitations

- Once a user clear the canvas , it cant be undo.
- Only one shared canvas is supported.
- No user authentication or authorization.