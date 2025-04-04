const main = document.getElementById("main")
const clock = document.getElementById("clock");

if (localStorage.getItem("editMode") === null) {
    localStorage.setItem("editMode", "false");
}

let editMode = localStorage.getItem("editMode") === "true";

window.addEventListener("storage", (event) => {
    if (event.key === "editMode") {
        console.log("Edit Mode Changed:", event.newValue);
        editMode = event.newValue === "true"; // Update the editMode variable
    }
});

// async function checkForReload() {
//     const response = await fetch("http://localhost:3001/should-reload");
//     const data = await response.json();

//     if (data.reload) {
//         console.log("Reloading script...");
//         location.reload();
//     }

//     setTimeout(checkForReload, 1000);
// }

async function savePosition(id, x, y) {

    const positionData = { [id]: { x, y } };

    const response = await fetch("http://localhost:3001/savePosition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(positionData),
    });
} 

async function getGridSize() {

    const send = await fetch("http://localhost:3001/loadSettings");
    const data = await send.json();
    console.log(data["grid"]);

    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;
    
    let cols = data["grid"].col; // Adjust column count as needed
    let rows = data["grid"].row;  // Adjust row count as needed
    
    return {
        x: Math.floor(screenWidth / cols),
        y: Math.floor(screenHeight / rows)
    };
}

// Function to toggle edit mode
function toggleEditMode() {
    editMode = !editMode;
    localStorage.setItem("editMode", editMode.toString()); // Store as string "true" or "false"
    
    if (editMode) {
        editButton.style.color = "green";
    } else {
        editButton.style.color = "red";
    }
}

async function fetchData() {
    const response1 = await fetch(`http://localhost:3001/`);
    const data1 = await response1.json();
    console.log(data1);
    const response2 = await fetch(`http://localhost:3001/position`);
    const data2 = await response2.json();
    console.log(data2);

    clock.style.left = `${data2["clock"].x}px`;
    clock.style.top = `${data2["clock"].y}px`;

    for (const app in data1) {
        // console.log(data2[app]);
        const button = document.createElement('button');
        button.id = app;
        button.style.left = `${data2[app].x}px`;
        button.style.top = `${data2[app].y}px`;

        main.appendChild(button);

        const img = document.createElement("img");
        img.src = `imgs/${button.id}.png`;
        img.alt = button.id;
        button.prepend(img);

        let moved = false;
        console.log(editMode);
        button.addEventListener("mousedown", async (e) => {

            if (!editMode) return; // ⛔ Only allow dragging in edit mode
            const grid = await getGridSize();
            let offsetX = e.clientX - button.offsetLeft;
            let offsetY = e.clientY - button.offsetTop;
            let isDragging = true;

            button.style.cursor = "grabbing";

            function onMouseMove(e) {
                if (isDragging) {
                    let x = e.clientX - offsetX;
                    let y = e.clientY - offsetY;
                    let snappedX = Math.round(x / grid.x) * grid.x;
                    let snappedY = Math.round(y / grid.y) * grid.y;
                    button.style.left = `${snappedX}px`;
                    button.style.top = `${snappedY}px`;

                    moved = true;
                }
            }

            function onMouseUp() {
                if (isDragging) {
                    let snappedX = Math.round(button.offsetLeft / grid.x) * grid.x;
                    let snappedY = Math.round(button.offsetTop / grid.y) * grid.y;
                    savePosition(app, snappedX, snappedY);
            
                    // Delay setting moved = false to avoid click triggering
                    setTimeout(() => { moved = false; }, 100);
                }
            
                isDragging = false;
                button.style.cursor = "grab";
            
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            }

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });

        button.addEventListener("click", (e) => {
            if (!editMode && !moved) {
                launch_app(button.id);
            }
        });
        
    }
}
fetchData()

async function getEditMode() {
    try {
        const response = await fetch("http://localhost:3001/edit-mode");
        const data = await response.json();
        editMode = data.editMode;
        console.log("Edit mode fetched:", editMode); // Debugging
    } catch (e) {
        console.log(e);
    }
}
getEditMode();
setInterval(getEditMode, 100);

async function launch_app(game_name, cat) {
    console.log(`button pressed: ${game_name}`);

    try {
        const response = await fetch("http://localhost:3001/launch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appName: game_name})
        });

        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error("Error launching game:", error);
    }
}

function updateClock() {
    const now = new Date();

    const hours = (now.getHours() % 12 || 12).toString().padStart(2, '0'); // Convert 24-hour format to 12-hour (0 becomes 12)
    const minutes = now.getMinutes().toString().padStart(2, '0'); // Ensure two digits
    const period = now.getHours() >= 12 ? "PM" : "AM"; // Determine AM/PM
    
    // const timeString = `${hours}: ${minutes}${period}`;
    // const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit' });
    document.getElementById('hours').textContent = `${hours}`;
    document.getElementById('minutes').textContent = `${minutes}`;
    document.getElementById('period').textContent = `${period}`;
}

setInterval(updateClock, 1000);
updateClock();

clock.addEventListener("mousedown", async (e) => {
    console.log("mousedown event triggered");
    if (!editMode) {
        console.log("editMode is false, exiting mousedown");
        return;
    }
    const grid = await getGridSize();
    let offsetX = e.clientX - clock.offsetLeft;
    let offsetY = e.clientY - clock.offsetTop;
    let isDragging = true;
    let moved = false;

    clock.style.cursor = "grabbing";

    function onMouseMove(e) {
        console.log("mousemove event triggered, isDragging:", isDragging);
        if (isDragging) {
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
            let snappedX = Math.round(x / grid.x) * grid.x;
            let snappedY = Math.round(y / grid.y) * grid.y;
            clock.style.left = `${snappedX}px`;
            clock.style.top = `${snappedY}px`;
            moved = true;
        }
    }

    function onMouseUp() {
        console.log("mouseup event triggered, isDragging:", isDragging);
        if (isDragging) {
            let snappedX = Math.round(clock.offsetLeft / grid.x) * grid.x;
            let snappedY = Math.round(clock.offsetTop / grid.y) * grid.y;
            savePosition("clock", snappedX, snappedY);
        }

        isDragging = false;
        clock.style.cursor = "grab";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        console.log("event listeners removed");
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    console.log("event listeners added");
});