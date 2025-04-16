import { makeDraggable, savePosition, getGridSize } from "/draggable.js";

const div = document.createElement('div');
const body = document.body
const img = document.createElement("img");
div.prepend(img);
const temp = document.createElement('p');
div.appendChild(temp)
body.appendChild(div);

let editMode = localStorage.getItem("editMode") === "true";

const eventSource = new EventSource("http://localhost:3001/edit-mode-stream");

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.editMode !== undefined) {
        editMode = data.editMode;
        localStorage.setItem("editMode", editMode.toString());
        console.log("Edit mode updated via SSE:", editMode);
    }
};
async function loadWidget() {
    const response = await fetch(`http://localhost:3001/position`);
    const data = await response.json();


    div.style.left = `${data["widget"].x}px`;
    div.style.top = `${data["widget"].y}px`;

    div.style.position = 'absolute';
    div.className = 'widget';
    div.id = 'widget';

    const response2 = await fetch("http://api.weatherapi.com/v1/current.json?key=1b7219347ef742b9b11181215232409&q=cairo");
    const weather = await response2.json();
    
    img.src = `https:${weather["current"]["condition"]["icon"]}`;

    temp.textContent = `${Math.round(weather['current']['temp_c'])} ºC`;

    div.addEventListener("mousedown", (e) => {
        makeDraggable(div, e,{
            app: div.id,
            savePosition,
            getGridSize,
            mode: editMode
        })
    })
}
(async function init() {
    // await getEditMode();
    loadWidget();
    setInterval(loadWidget, 1800000);
    // setInterval(getEditMode, 100);
})();
