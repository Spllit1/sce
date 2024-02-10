const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

// Verzeichnis für den Code
const codeFolder = './Code';

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/save', async (req, res) => {
  try {
    const code = req.body.code;
    const fileName = req.body.fileName || 'savedCode.js'; // Standardname, wenn keiner angegeben ist
    const filePath = path.join(__dirname, codeFolder, fileName);

    await fs.mkdir(path.join(__dirname, codeFolder), { recursive: true });
    await fs.writeFile(filePath, code);

    res.send(`Code successfully saved to ${filePath}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving code');
  }
});

app.post('/run', async (req, res) => {
  try {
    const runCommand = req.body.runCommand;
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


app.listen(port, () => {
  console.log(`Code editor app listening at http://localhost:${port}`);
});
