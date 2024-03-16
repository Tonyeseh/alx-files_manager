import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const getConnect = async (req, res) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const encodedCred = Buffer.from(authHeader.split(' ')[1], 'base64');

    const decodedCred = encodedCred.toString('ascii');

    const [email, password] = decodedCred.split(':');

    const hashedPwd = crypto.createHash('sha1').update(password).digest('hex');

    const user = await (await dbClient.usersCollection()).findOne({ email });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (user.password !== hashedPwd) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const authToken = uuidv4();
    const key = `auth_${authToken}`;

    await redisClient.set(key, user._id.toString(), 86400);

    res.status(200).json({ token: authToken });
  } catch (error) {
    console.log(error);
    res.status(500).json('Internal Server Error!');
  }
};

const getDisconnect = async (req, res) => {
  const token = req.get('X-Token');

  const userId = await redisClient.get(`auth_${token}`);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  await redisClient.del(`auth_${token}`);

  res.status(204).json();
};

const AuthController = {
  getConnect,
  getDisconnect,
};

export default AuthController;
