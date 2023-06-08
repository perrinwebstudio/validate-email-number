const express = require('express');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors')

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());

app.post('/upload', upload.single('csvFile'), async (req, res) => {
  console.log('---- file: ', req.body.email)
  // Check if file exists
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!fs.existsSync('list.json')) {
    fs.writeFileSync('list.json', '[]');
  }

  const list = JSON.parse(fs.readFileSync('list.json'));
  list.push({
    email: req.body.email,
    path: req.file.path,
  });

  fs.writeFileSync('list.json', JSON.stringify(list));

  return res.status(200).json(list);
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
