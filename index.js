require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const urlParser = require('url')
const dns = require('dns')

const client = new MongoClient(process.env.DB_URL);

const db = client.db("urlshortner");

const urls = db.collection("shorturls");

app.use(express.json());
app.use(express.urlencoded({'extended' : true}));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  console.log(req.body);
  const url = req.body.url;
  const dnslookup = dns.lookup(urlParser.parse(url).hostname, async (err, addr) =>  {
    if(!addr) {
      res.json({error : "Invalid URL"});
    }
    else {
      const urlCount = (await urls.countDocuments({}));
      const urlDoc = {
        url,
        short_url : urlCount
      }

      const result = await urls.insertOne(urlDoc);
      console.log(result);

      res.json({original_url : url, short_url : urlCount});
    }
  })
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const shortUrl = req.params.short_url;
  const result = await urls.findOne({short_url : +shortUrl});
  res.redirect(result.url);
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
