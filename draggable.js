export async function savePosition(id, x, y) {
    
    const positionData = { [id]: { x, y } };

    const response = await fetch("http://localhost:3001/savePosition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(positionData),
    });
} 

export async function getGridSize() {

    const send = await fetch("http://localhost:3001/loadSettings");
    const data = await send.json();
    // console.log(data["grid"]);

    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;
    
    let cols = data["grid"].col; // Adjust column count as needed
    let rows = data["grid"].row;  // Adjust row count as needed
    
    return {
        x: Math.floor(screenWidth / cols),
        y: Math.floor(screenHeight / rows)
    };
}

export async function makeDraggable(object, e,options = {}) {
    const {
        getGridSize = async () => ({ x: 50, y: 50 }),
        savePosition = (app, x, y) => {},
        mode = true,
        app = ""
    } = options;

    let moved = false;

    if (!mode) return;

    const grid = await getGridSize();
    let offsetX = e.clientX - object.offsetLeft;
    let offsetY = e.clientY - object.offsetTop;
    let isDragging = true;

    object.style.cursor = "grabbing";

    function onMouseMove(e) {
        if (isDragging) {
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
            let snappedX = Math.round(x / grid.x) * grid.x;
            let snappedY = Math.round(y / grid.y) * grid.y;
            object.style.left = `${snappedX}px`;
            object.style.top = `${snappedY}px`;

            moved = true;
        }
    }

    function onMouseUp() {
        if (isDragging) {
            let snappedX = Math.round(object.offsetLeft / grid.x) * grid.x;
            let snappedY = Math.round(object.offsetTop / grid.y) * grid.y;
            savePosition(app, snappedX, snappedY);

            setTimeout(() => { moved = false; }, 100);
        }

        isDragging = false;
        object.style.cursor = "grab";

        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}
