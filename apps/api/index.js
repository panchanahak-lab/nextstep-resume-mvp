const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
const port = 3005;

app.use(cors());
app.use(express.json());

// Set up multer to keep files in memory
const upload = multer({ storage: multer.memoryStorage() });

app.post('/parse', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const buffer = req.file.buffer;
    const originalname = req.file.originalname.toLowerCase();
    let text = '';

    if (originalname.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (originalname.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: buffer });
      text = result.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or DOCX file.' });
    }

    if (!text || text.trim() === '') {
      return res.status(422).json({ error: 'Failed to extract text from file.' });
    }

    return res.json({ text: text.trim() });
  } catch (err) {
    console.error('Error parsing file:', err);
    return res.status(500).json({ error: 'An error occurred while parsing the file.' });
  }
});

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
