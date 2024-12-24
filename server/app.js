const cors = require('cors');
const express = require('express');
const app = express();

// Increase payload size limit for JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// If you're using body-parser separately, configure it like this:
const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
})); 