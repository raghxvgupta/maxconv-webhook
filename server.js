const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text()); // Add this to handle sendBeacon text data

const clients = [];

app.get('/', (req, res) => {
  res.json({ 
    status: 'MaxConv Webhook Server Running',
    connectedClients: clients.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  
  clients.push(res);
  console.log(`Dashboard connected. Total: ${clients.length}`);
  
  req.on('close', () => {
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
      console.log(`Dashboard disconnected. Total: ${clients.length}`);
    }
  });
});

app.post('/maxconv/click', (req, res) => {
  let clickData;
  
  // Handle sendBeacon (sends as text) or regular fetch (sends as JSON)
  try {
    if (typeof req.body === 'string') {
      clickData = JSON.parse(req.body);
    } else {
      clickData = req.body;
    }
  } catch(e) {
    clickData = req.body;
  }
  
  const formattedData = {
    type: 'click',
    offer: clickData.offer || 'Unknown',
    source: clickData.source || 'Direct',
    subid: clickData.subid || 'N/A',
    country: clickData.country || 'Unknown',
    timestamp: new Date().toISOString()
  };
  
  console.log('Click received:', formattedData);
  
  clients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(formattedData)}\n\n`);
    } catch (err) {
      console.error('Error sending to client:', err);
    }
  });
  
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
