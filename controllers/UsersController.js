import sha1 from 'sha1';
import dbClient from '../utils/db';

async function postNew(req, res) {
  try {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const existingEmail = await dbClient.db.collection('users').findOne({ email });

    if (existingEmail) return res.status(400).json({ error: 'Already exist' });

    const newUser = await dbClient.db.collection('users').insertOne({ email, password: sha1(password) });

    return res.status(201).json({
      email, id: newUser.insertedId,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: 'Invalid payload' });
  }
}

export default {
  postNew,
};
