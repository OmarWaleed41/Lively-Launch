const { app, BrowserWindow } = require("electron");

const createGui = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        autoHideMenuBar: true,
    });

    win.loadFile("gui.html");
    Menu.setApplicationMenu(null);
};

app.whenReady().then(createGui);
