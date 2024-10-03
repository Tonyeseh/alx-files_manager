import { ObjectId } from 'mongodb';
import { v4 } from 'uuid';
import fs from 'fs/promises';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const dataFolder = process.env.FOLDER_PATH || 'C:\\Users\\Tony\\Documents\\works\\alx\\alx-files_manager\\data_folder';
async function postUpload(req, res) {
  try {
    const authToken = req.headers['x-token'];
    if (!authToken) throw new Error('Unauthorized: No token');
    const userId = await redisClient.get(`auth_${authToken}`);

    if (!userId) throw new Error('Unauthorized: No userId');

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });

    if (!user) throw new Error('Unauthorized: No user');

    try {
      const {
        name, type, parentId, isPublic = false, data,

      } = req.body;
      if (!name) throw new Error('Missing name');
      if (!type) throw new Error('Missing type');
      if (type !== 'folder' && !data) throw new Error('Missing data');

      const existingParentId = await dbClient.db.collection('files').findOne({ parentId });

      if (parentId && !existingParentId) throw new Error('Parent not found');

      if (parentId && existingParentId.type !== 'folder') throw new Error('Parent is not a folder');

      if (type === 'folder') {
        const file = await dbClient.db.collection('files').insertOne({
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });
        return res.status(201).json({
          id: file.insertedId,
          userId: user._id.toString(),
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });
      }
      // write to file
      const filePath = v4();

      const decodedData = Buffer.from(data, 'base64').toString('ascii');

      try {
        // await fs.mkdir(dataFolder);
        await fs.writeFile(`${dataFolder}/${filePath}`, decodedData);
      } catch (error) {
        console.log(error);
        return res.status(400).json({ error: 'Error writing to file' });
      }

      const newFile = await dbClient.db.collection('files').insertOne({
        userId: user._id.toString,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
        localPath: `${dataFolder}/${filePath}`,
      });

      return res.status(201).json({
        name,
        userId: user._id.toString(),
        id: newFile.insertedId.toString(),
        type,
        isPublic,
        parentId: parentId || 0,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ error: error.message });
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export default {
  postUpload,
};
