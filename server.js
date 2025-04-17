const express = require('express');
const cors = require('cors');
const { spawn, execFile, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const electron = require("electron");

const widget_upload = multer({ dest: 'widgets/' });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const base_path = process.cwd();
const jsonPath = path.join(base_path, '/src/path.json');
const positionPath = path.join(base_path, '/src/position.json');
const imgPath = path.join(base_path, 'imgs');
const settingsPath = path.join(base_path, '/src/settings.json');
const widgetsPath = path.join(base_path, '/src/widgets.json');

if (!fs.existsSync(imgPath)) {
  fs.mkdirSync(imgPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imgPath);
  },
  filename: (req, file, cb) => {
    const appName = req.body.appName.replace(/\s+/g, '_');
    cb(null, `${appName}.png`);
  },
});
const upload = multer({ storage });


const wallpaperStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imgPath);
  },
  filename: (req, file, cb) => {
    cb(null, 'wallpaper.png');
  },
});

const wallpaperUpload = multer({ storage: wallpaperStorage });

function loadPath() {
  try {
    const data = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading path.json:', error);
    return {};
  }
}

function loadPos() {
  try {
    const data = fs.readFileSync(positionPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading position.json:', error);
    return {};
  }
}

function loadWidgets() {
  try {
    const data = fs.readFileSync(widgetsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading position.json:', error);
    return {};
  }
}

function removeEntry(pathData, posData) {
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(pathData, null, 2), 'utf-8');
    fs.writeFileSync(positionPath, JSON.stringify(posData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error removing entry:', error);
  }
}

function removeWidget(pathData) {
  try {
    fs.writeFileSync(widgetsPath, JSON.stringify(pathData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error removing entry:', error);
  }
}

function writePath(appName, appPath, img, isAdmin) {
  if (!appName || appName === 'undefined') {
    console.warn('Invalid appName passed to writePath, skipping...');
    return;
  }

  const data = loadPath();
  data[appName] = {
    path: appPath,
    isAdmin: isAdmin,
  };
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');

  const newImgPath = path.join(imgPath, `${appName}.png`);
  const imageBuffer = img.buffer || fs.readFileSync(img.path);
  fs.writeFileSync(newImgPath, imageBuffer);
}


function writePos(newData) {
  console.log(newData);
  const cleanedData = Object.fromEntries(
    Object.entries(newData).filter(([key]) => key && key !== 'undefined')
  );
  console.log(cleanedData);
  if (Object.keys(cleanedData).length === 0) {
    console.warn("data empty");
    return;
  }

  try {
    let data = {};
    if (fs.existsSync(positionPath)) {
      try {
        data = JSON.parse(fs.readFileSync(positionPath, 'utf-8'));
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
      }
    }
    Object.assign(data, cleanedData);
    fs.writeFileSync(positionPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Position saved successfully');
  } catch (error) {
    console.error('Error writing position file:', error);
  }
}

function writeWidget(newData) {
  try {
    const oldPath = newData.path;
    const newFilePath = path.join(`${base_path}/widgets`, newData.originalname);

    fs.renameSync(oldPath, newFilePath);
    console.log('Widget renamed and saved as:', newFilePath);

    const data = loadWidgets();
    data[newData.originalname.replace(".js", "")] = {
      path: `/widgets/${newData.originalname}`
    };
    fs.writeFileSync(widgetsPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to rename widget file:', err);
  }
}



function changeWallpaper(img) {
  const imgPathWall = path.join(imgPath, 'wallpaper.png');
  fs.writeFileSync(imgPathWall, img.buffer);
}

function loadSettings() {
  try {
    const data = fs.readFileSync(settingsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading settings.json:', error);
    return {};
  }
}

function saveSettings(data) {
  try {
    let existingData = {};
    if (fs.existsSync(settingsPath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
      }
    }
    Object.assign(existingData, data);
    fs.writeFileSync(settingsPath, JSON.stringify(existingData, null, 2), 'utf-8');
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Error writing settings file:', error);
  }
}

// App Options Functions
app.get('/', (req, res) => {
  res.json(loadPath());
});

app.get('/position', (req, res) => {
  res.json(loadPos());
});

app.get('/basePath', (req,res) =>{
  res.json(base_path);
})

app.post('/savePosition', (req, res) => {
  try {
    writePos(req.body);
    res.json({ status: 'saved' });
  } catch (error) {
    console.error('Error saving position:', error);
    res.status(500).json({ error: 'Failed to save position' });
  }
});

app.post('/launch', (req, res) => {
    const fData = req.body;
    const data = loadPath();
    const appName = fData.appName;
    console.log(appName);
    if (appName === 'gui') {
      spawn(electron, ["gui.js"], { detached: true, stdio: 'ignore' }).unref();
      res.json({ message: 'GUI Launched!' });
    } else {
      let appPath = data[appName].path;
      console.log(appPath);
      appPath = appPath.replace(/^"(.*)"$/, '$1');
  
      const isAdmin = data[appName].isAdmin;
  
      if (fs.existsSync(appPath) && fs.statSync(appPath).isDirectory()) {
        spawn('explorer', [appPath], { detached: true, stdio: 'ignore' }).unref();
      } else {
        if (isAdmin) {
          try {
            const workingDir = path.dirname(appPath);
            exec(`powershell Start-Process -FilePath \\"${appPath}\\" -Verb RunAs -WorkingDirectory '${workingDir}'`, (error, stdout, stderr) => {
              if (error) {
                console.error(`Error launching ${appPath}: ${error}`);
                res.status(500).json({ error: `Error launching ${appPath}` });
              } else {
                res.json(`Launching ${appName}`);
                console.log(`Launching ${appName}`);
              }
            });
          } catch (e) {
            console.error(`Error launching ${appPath}: ${e}`);
            res.status(500).json({ error: `Error launching ${appPath}` });
          }
        } else {
          const endOfExecutable = appPath.indexOf('" ') + 1;
          const workingDir = path.dirname(appPath);
          const hasArgs = endOfExecutable > 0 && endOfExecutable < appPath.length;
          
          if (hasArgs) {
            console.log("Launching with arguments...");
            exec(appPath, (error, stdout, stderr) => {
              if (error) {
                console.error(`Error launching ${appPath}:`, error);
              }
            });
          } else {
            console.log("Launching without arguments...");
            execFile(appPath, [], { cwd: workingDir }, (error, stdout, stderr) => {
              if (error) {
                console.error(`Error launching ${appPath}:`, error);
              }
            });
          }
          res.json(`Launching ${appName}`);
          console.log(`Launching ${appName}`);
        }
      }
    }
  });

app.post('/showApps', (req, res) => {
  res.json(loadPath());
});

app.post('/addApp', upload.single('image'), (req, res) => {
    const appName = req.body.appName;
    const appPath = req.body.appPath;
    const isAdmin = req.body.isAdmin === 'true';
    
    if (req.file && appName && appName !== 'undefined') {
      writePath(appName, appPath, req.file, isAdmin);
      writePos({ [appName]: { x: 0, y: 0 } });
      res.json({ success: true });
    } else {
      console.log("req.file inside else:", req.file);
      res.status(400).json({ error: 'No image file uploaded' });
    }
  });

app.post('/removeApp', (req, res) => {
  const pathData = loadPath();
  const posData = loadPos();

  const key = req.body.key;
  delete pathData[key];
  delete posData[key];

  removeEntry(pathData, posData);

  const filePath = path.join(imgPath, `${key}.png`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted image: ${filePath}`);
  }

  res.json({ success: true });
});

app.post('/wallpaper', wallpaperUpload.single('image'), (req, res) => {
  changeWallpaper(req.file);
  res.json('Wallpaper Changed');
});

app.get('/loadSettings', (req, res) => {
  res.json(loadSettings());
});

app.post('/saveSettings', (req, res) => {
  saveSettings(req.body);
  res.json({ message: 'Settings saved successfully' });
});

let currentEditMode = false;
let clients = [];

app.post("/edit-mode", (req, res) => {
    currentEditMode = req.body.editMode;
    clients.forEach(client => client.res.write(`data: ${JSON.stringify({ editMode: currentEditMode })}\n\n`));
    res.sendStatus(200);
});

app.get("/edit-mode-stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    clients.push(newClient);

    res.write(`data: ${JSON.stringify({ editMode: currentEditMode })}\n\n`);

    req.on("close", () => {
        clients = clients.filter(c => c.id !== clientId);
    });
});

app.get('/widgets', (req,res) => {
  res.json(loadWidgets());
})

app.post('/addWidget', widget_upload.single('widget'), (req,res) => {
  const uploadedFile = req.file;
  console.log(uploadedFile);
  if (!uploadedFile) {
    return res.status(400).send('No file uploaded.');
  }
  writeWidget(uploadedFile);
})

app.post('/removeWidget', (req, res) => {
  const pathData = loadWidgets();

  const key = req.body.element;
  delete pathData[key];

  removeWidget(pathData);

  const filePath = path.join(`${base_path}/widgets`, `${key}.js`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted widget: ${filePath}`);
  }

  res.json({ success: true });
});

app.listen(3001, () => {
  console.log('Server listening on port 3001');
});
