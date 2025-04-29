const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/update', (req, res) => {
  const { featuredBrand, expiresAt } = req.body;

  if (!featuredBrand || !expiresAt) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const data = { featuredBrand, expiresAt };

  fs.writeFile('global.json', JSON.stringify(data, null, 2), err => {
    if (err) return res.status(500).json({ error: 'Failed to write file' });
    res.json(data);
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
