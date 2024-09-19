const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');


const PORT = process.env.PORT || 3000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redisClient = redis.createClient(REDIS_PORT);

redisClient.connect().catch(console.error);

const app = express();

// cache middleware
async function cache(req, res, next) {
  const { username } = req.params;
  console.log("Cache search");

  const data = await redisClient.get(username);

  if (data !== null) res.send(data);
  else next();
}

app.get('/user/:username', cache, async (req, res) => {
  try {
    console.log("Fetching data...");

    const { username } = req.params;

    const response = await fetch(`https://api.github.com/users/${username}`);

    if (!response.ok) {
      return res.status(response.status).send({ error: 'User not found' });
    }

    const data = (await response.json())["url"];

    redisClient.setEx(username, 60, data);

    res.send(data);

  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}!`);
});
