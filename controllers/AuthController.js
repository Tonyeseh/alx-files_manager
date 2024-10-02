import sha1 from 'sha1';
import { v4 } from 'uuid';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

async function getConnect(req, res) {
  const authHeader = req.headers.authorization;

  try {
    const headerValue = authHeader.split(' ')[1];
    const decodedHeader = Buffer.from(headerValue, 'base64').toString('ascii');

    const [email, password] = decodedHeader.split(':');

    const user = await dbClient.db.collection('users').findOne({ email, password: sha1(password) });

    if (!user) throw new Error('Unauthorized');

    const token = v4();

    await redisClient.set(`auth_${token}`, user._id.toString(), 86400);

    return res.status(200).json({ token });
  } catch (error) {
    console.log(error);

    return res.status(401).json({ error: 'Unauthorized' });
  }
}

async function getDisconnect(req, res) {
  try {
    const authToken = req.headers['x-token'];
    if (!authToken) throw new Error('Unauthorized: No token');
    const userId = await redisClient.get(`auth_${authToken}`);

    if (!userId) throw new Error('Unauthorized: No userId');

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });

    if (!user) throw new Error('Unauthorized: No user');

    await redisClient.del(`auth_${authToken}`);

    return res.status(204).json({});
  } catch (error) {
    console.log(error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

async function getMe(req, res) {
  try {
    const authToken = req.headers['x-token'];
    if (!authToken) throw new Error('Unauthorized: No token');
    const userId = await redisClient.get(`auth_${authToken}`);

    if (!userId) throw new Error('Unauthorized: No userId');

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });

    if (!user) throw new Error('Unauthorized: No user');

    return res.status(200).json({ email: user.email, id: user._id.toString() });
  } catch (error) {
    console.log(error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export default {
  getConnect, getDisconnect, getMe,
};
