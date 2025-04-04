const add = document.getElementById('addApp');
const remove = document.getElementById('removeApp');
const wallpaper = document.getElementById('wallpaper');
const edit_button = document.getElementById('edit');
const settings = document.getElementById('settings');
const main = document.getElementById('main');

const navButtons = [add, remove, wallpaper, edit_button, settings];

function resetButtons() {
    navButtons.forEach(button => {
        button.classList.remove('button_select');
    });
}

add.addEventListener('click', () =>{
    resetButtons();
    add.classList.add('button_select');
    console.log('add app');
    main.innerHTML = '';
    main.className = "add";
    const Name = document.createElement('Label');
    const NameInput = document.createElement('input');
    const Path = document.createElement('Label');
    const PathInput = document.createElement('input');
    const admin = document.createElement('Label');
    const adminInput = document.createElement('input');
    const Img = document.createElement('Label');
    const ImgInput = document.createElement('input');
    const addButton = document.createElement('button');

    Name.textContent = 'App Name';
    Path.textContent = "App Path";
    admin.textContent = "Does the app require Admin?"
    Img.textContent = "App Icon";
    NameInput.classList.add('input');
    PathInput.classList.add('input');
    adminInput.type = 'checkbox';
    adminInput.classList.add('input');
    adminInput.style.width = '1rem';
    ImgInput.type = 'file';
    ImgInput.classList.add("custom-file-input");
    addButton.textContent = 'Add App';
    addButton.style.width = '10rem';
    addButton.id = 'add';
    main.appendChild(Name);
    main.appendChild(NameInput);
    main.appendChild(Path);
    main.appendChild(PathInput);
    main.appendChild(admin);
    main.appendChild(adminInput);
    main.appendChild(Img);
    main.appendChild(ImgInput);
    main.appendChild(addButton);

    addButton.addEventListener('click', async () => {
        const formData = new FormData();
        formData.append("appName", NameInput.value);
        formData.append("appPath", PathInput.value);
        formData.append("isAdmin", adminInput.checked);
        formData.append("image", ImgInput.files[0]);
        try {
            const response1 = await fetch("http://localhost:3001/addApp", {
                method: "POST",
                body: formData,
            });
    
            const data1 = await response1.json();

            const positionData = { [Name.value]: { x: 0, y: 0 } };
    
            const response2 = await fetch("http://localhost:3001/savePosition", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(positionData),
            });
    
            if (data1.success) {
                console.log(`${Name.value} added successfully.`);
    
                const message = document.createElement('p');
                message.textContent = "App Added Successfully";
                main.appendChild(message);
            }
        } catch (error) {
            console.error("Error launching app:", error);
        }
    });
})
remove.addEventListener('click', async () =>{
    resetButtons();
    remove.classList.add('button_select');
    console.log('remove app');
    main.innerHTML = '';
    main.className = "remove";
    const response1 = await fetch("http://localhost:3001/showApps", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });
    const data1 = await response1.json();
    
    let delay = 100;
    for (const [key, value] of Object.entries(data1)) {
        const container = document.createElement('div');
        container.classList.add('fade-in');
        const img = document.createElement('img');
        const text = document.createElement('p');
        const button = document.createElement('button');

        img.src = `imgs/${key}.png`;
        text.textContent = key;
        text.style.color = "white";
        button.textContent = "Remove";
        container.appendChild(img);
        container.appendChild(text);
        container.appendChild(button);
        main.appendChild(container);

        setTimeout(() => {
            container.classList.add('show');
        }, delay);
        delay += 100;
        button.addEventListener('click', async () => {
            const send = await fetch("http://localhost:3001/removeApp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ key })
            });

            const result = await send.json();

            if (result.success) {
                console.log(`${key} removed successfully.`);
                container.remove();
            }
        })
    }
})
wallpaper.addEventListener('click', () =>{
    resetButtons();
    wallpaper.classList.add('button_select');
    console.log('change the wallpaper');
    main.innerHTML = '';
    main.className = 'wallpaper';
    const label = document.createElement('label');
    const input = document.createElement('input');
    const button = document.createElement('button');

    label.textContent = 'Choose The Wallpaper';
    input.type = 'file';
    input.classList.add("custom-file-input");

    button.textContent = 'Change';

    main.appendChild(label);
    main.appendChild(input);
    main.appendChild(button);

    button.addEventListener('click', async () =>{
        const formData = new FormData();
        formData.append("image",input.files[0]);
        formData.append("appName", "wallpaper");
        const response = await fetch("http://localhost:3001/wallpaper", {
            method: "POST",
            body: formData
        });
        if(response){
            const message = document.createElement('p');
            message.textContent = "Wallpaper Changed Successfully";
            main.appendChild(message);
        }
    })

})
edit_button.addEventListener("click", async () => {
    console.log("edit button");
    let isEditMode = localStorage.getItem("editMode") === "true"; // Get current state
    isEditMode = !isEditMode; // Toggle it

    try {
        const send = await fetch("http://localhost:3001/edit-mode", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ editMode: isEditMode }),
        });
    } catch (e) {
        console.log(e);
    }

    // Update localStorage
    localStorage.setItem("editMode", isEditMode.toString());

    // ✅ Change color based on new state
    if (isEditMode) {
        edit_button.style.backgroundColor = "green";
        edit_button.style.color = "black";
    } else {
        edit_button.style.backgroundColor = "";
        edit_button.style.color = "white";
    }

    console.log("Edit Mode Set to:", isEditMode);
});
settings.addEventListener("click", async ()=>{
    main.classList.remove();
    resetButtons();
    settings.classList.add('button_select');
    const response = await fetch("http://localhost:3001/loadSettings");
    const data = await response.json();
    console.log(data["grid"]);
    let x = data["grid"].col.length;
    let y = data["grid"].row.length;
    
    main.className = "settings";
    main.innerHTML = "";
    const div_cont = document.createElement("div");
    const setting_name = document.createElement('label');
    const label1 = document.createElement('label');
    const label2 = document.createElement('label');
    const columns = document.createElement('input');
    const rows = document.createElement("input");
    const save_button = document.createElement("button");

    setting_name.textContent = "Grid Size"

    label1.textContent = "Columns";
    label2.textContent = "Rows";

    columns.style.width = `${x}rem`;
    columns.type = "number";
    columns.value = data["grid"].col;
    rows.style.width = `${y}rem`;
    rows.type = "number";
    rows.value = data["grid"].row;
    save_button.textContent = "Save";

    main.appendChild(setting_name);
    div_cont.appendChild(label1);
    div_cont.appendChild(columns);
    div_cont.appendChild(label2);
    div_cont.appendChild(rows);
    main.appendChild(div_cont);
    main.appendChild(save_button);

    columns.addEventListener("input", () => {
        const Length = columns.value.length;
        if(Length<2){Length = 2;};
        columns.style.width = `${Length}rem`;
    })
    rows.addEventListener("input", () => {
        const Length = rows.value.length;
        if(Length<2){Length = 2;};
        rows.style.width = `${Length}rem`;
    })
    save_button.addEventListener("click", async () => {
        try {
            const send = await fetch("http://localhost:3001/saveSettings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ grid: {col:columns.value , row: rows.value}})
            });
        } catch (e) {
            console.log(e);
        }
    })
})