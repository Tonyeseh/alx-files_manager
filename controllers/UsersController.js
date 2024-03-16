import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const postNew = async (req, res) => {
  const { password, email } = req.body;
  if (!email) {
    res.status(400);
    res.json({ error: 'Missing email' });
    return;
  }
  if (!password) {
    res.status(400).json({ error: 'Missing password' });
    return;
  }

  try {
    const existingUser = await (await dbClient.usersCollection()).findOne({ email });

    if (existingUser) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // eslint-disable-next-line max-len
    const user = await (await dbClient.usersCollection()).insertOne({ email, password: hashedPassword });

    res.status(201).json({ id: user.insertedId, email });
    return;
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
    console.log(error);
  }
};

const getMe = async (req, res) => {
  const token = req.get('X-Token');

  const userId = await redisClient.get(`auth_${token}`);
  console.log(userId);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await (await dbClient.usersCollection()).findOne({ _id: ObjectId(userId) });
  console.log(user);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.status(200).json({ id: user._id, email: user.email });
};

const UsersController = { postNew, getMe };
export default UsersController;
