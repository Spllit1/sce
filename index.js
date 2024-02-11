const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

const codeFolder = './Code';
const runCommandFile = path.join(__dirname, 'runCommand.txt');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/save', async (req, res) => {
  try {
    const code = req.body.code;
    let fileName = req.body.fileName || 'untitled.txt';

    // Remove any directory traversal attempts from the filename
    fileName = path.basename(fileName);

    // Ensure the file extension is present
    if (!path.extname(fileName)) {
      fileName += '.txt'; // Default to .txt if no extension is provided
    }

    const folderPath = path.join(__dirname, codeFolder);
    await fs.mkdir(folderPath, { recursive: true });

    const filePath = path.join(folderPath, fileName);

    // Write the file directly without checking for existence, overwriting if needed
    await fs.writeFile(filePath, code);

    res.send(`Code successfully saved to ${fileName}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving code');
  }
});




async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

app.post('/run', async (req, res) => {
  try {
    const runCommand = req.body.runCommand;
    await fs.writeFile(runCommandFile, JSON.stringify({ runCommand }));
    const result = await runCustomCommand(runCommand);
    res.send(`Command executed successfully:\n${result}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error executing command');
  }
});

async function runCustomCommand(command) {
  const { exec } = require('child_process');
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
        return;
      }
      resolve(stdout);
    });
  });
}

app.get('/files', async (req, res) => {
  try {
    const files = await fs.readdir(path.join(__dirname, codeFolder));
    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching file list');
  }
});

app.get('/files/:fileName', async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, codeFolder, fileName);
    const code = await fs.readFile(filePath, 'utf-8');
    res.send(code);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching file');
  }
});


app.post('/save-run-command', async (req, res) => {
  try {
    const runCommand = req.body.runCommand;
    await fs.writeFile(runCommandFile, JSON.stringify({ runCommand }));
    res.send(`Run command successfully saved: ${runCommand}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving run command');
  }
});

app.get('/get-run-command', async (req, res) => {
  try {
    const runCommandData = await fs.readFile(runCommandFile, 'utf-8');
    const { runCommand } = JSON.parse(runCommandData);
    res.json({ runCommand });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching run command');
  }
});

app.listen(port, () => {
  console.log(`Code editor app listening at http://localhost:${port}`);
});
