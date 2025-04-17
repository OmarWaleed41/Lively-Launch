import { makeDraggable, getGridSize, savePosition } from "/draggable.js";

const body = document.body
const main = document.getElementById("main")
const clock = document.getElementById("clock");

const base_path = window.location.origin;

if (localStorage.getItem("editMode") === null) {
    localStorage.setItem("editMode", "false");
}

let editMode = localStorage.getItem("editMode") === "true";

window.addEventListener("storage", (event) => {
    console.log(`edit mode status: ${editMode}`);
    if (event.key === "editMode") {
        console.log("Edit Mode Changed:", event.newValue);
        editMode = event.newValue === "true";
    }
});

//----------------Getting the Edit Mode status--------------------

const eventSource = new EventSource("http://localhost:3001/edit-mode-stream");

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.editMode !== undefined) {
        editMode = data.editMode;
        localStorage.setItem("editMode", editMode.toString());
        console.log("Edit mode updated via SSE:", editMode);
    }
};

//------------------------------------

async function fetchData() {
    const response1 = await fetch(`http://localhost:3001/`);
    const data1 = await response1.json();

    const response2 = await fetch(`http://localhost:3001/position`);
    const data2 = await response2.json();

    const response3 = await fetch(`http://localhost:3001/widgets`);
    const data3 = await response3.json();
    console.log(data3);

    for (const app in data1) {
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
        button.addEventListener("mousedown", (e) => {
           makeDraggable(button, e, {
                app: app,
                savePosition,
                getGridSize,
                mode: editMode
            }); 
        });
        button.addEventListener("click", (e) => {
            if (!editMode && !moved) {
                launch_app(button.id);
            }
        });
    }
    for (const element in data3) {
        const widget = data3[element];
        const script = document.createElement('script');
        script.type = 'module';
        script.src = String(widget["path"]);
        body.appendChild(script);
    }
}
fetchData()

async function getEditMode() {
    try {
        const response = await fetch("http://localhost:3001/edit-mode");
        const data = await response.json();
        editMode = data.editMode;
    } catch (e) {
        console.log(e);
    }
}

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
