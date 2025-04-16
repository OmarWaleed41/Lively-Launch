import { makeDraggable, savePosition, getGridSize } from "/draggable.js";

const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const months = ["Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];

const body = document.body;

const clock = document.createElement('div');
const hours = document.createElement('div');
const minutes = document.createElement('div');
const period = document.createElement('div');

clock.className = 'clock';
clock.id = 'clock';

hours.className = 'hours';
hours.id = 'hours';

minutes.className = 'minutes';
minutes.id = 'minutes';

period.className = 'period';
period.id = 'period';
clock.appendChild(hours);
clock.appendChild(minutes);
clock.appendChild(period);
body.appendChild(clock);

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

clock.addEventListener("mousedown", (e) => {
    makeDraggable(clock, e,{
        savePosition,
        getGridSize,
        mode: editMode,
        app: 'clock'
    });
})

async function loadWidget(){
    const response = await fetch(`http://localhost:3001/position`);
    const data = await response.json();
    clock.style.left = `${data["clock"].x}px`;
    clock.style.top = `${data["clock"].y}px`;

    clock.style.position = 'absolute';
}
function updateClock() {
    const now = new Date();
    const currentHour = (now.getHours() % 12 || 12).toString().padStart(2, '0');
    const CurrentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentPeriod = now.getHours() >= 12 ? "PM" : "AM";
    
    hours.textContent = `${currentHour}`;
    minutes.textContent = `${CurrentMinutes}`;
    period.textContent = `${currentPeriod}  ${days[now.getDay()]} - ${now.getDate()} ${months[now.getMonth()]}`;
}
// getEditMode();
loadWidget();
setInterval(updateClock, 1000);
updateClock();