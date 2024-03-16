import fs from 'fs';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

try {
  if (!fs.existsSync(FOLDER_PATH)) {
    fs.mkdirSync(FOLDER_PATH);
  }
} catch (error) {
  console.error(error);
}

const postUpload = async (req, res) => {
  const token = req.get('X-Token');

  const userId = await redisClient.get(`auth_${token}`);

  const user = await (await dbClient.usersCollection()).findOne({ _id: ObjectId(userId) });

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const {
    name, type, parentId = 0, isPublic = false, data,
  } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Missing name' });
    return;
  }
  if (!type && !['folder', 'file', 'image'].includes(type)) {
    res.status(400).json({ error: 'Missing type' });
    return;
  }
  if (!data && type !== 'folder') {
    res.status(400).json({ error: 'Missing data' });
    return;
  }
  if (parentId) {
    const result = await (await dbClient.filesCollection()).findOne({ _id: ObjectId(parentId) });

    if (!result) {
      res.status(400).json({ error: 'Parent not found' });
      return;
    }

    if (result.type !== 'folder') {
      res.status(400).json({ error: 'Parent is not a folder' });
    }
  }

  try {
    if (type === 'folder') {
      const newFile = await (await dbClient.filesCollection()).insertOne({
        userId: user._id,
        name,
        type,
        parentId,
        isPublic,
      });

      res.status(201).json({
        id: newFile.insertedId.toString(),
        name,
        userId,
        type,
        isPublic,
        parentId,
      });
      return;
    }
    const localPath = `${FOLDER_PATH}/${uuidv4()}`;
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
    const newFile = await (await dbClient.filesCollection()).insertOne({
      userId: user._id,
      name,
      type,
      isPublic,
      parentId,
      localPath,
    });
    res.status(201).json({
      userId: user._id,
      name,
      type,
      isPublic,
      parentId,
      id: newFile.insertedId.toString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getShow = async (req, res) => {
  const token = req.get('X-Token');

  const userId = await redisClient.get(`auth_${token}`);

  const user = await (await dbClient.usersCollection()).findOne({ _id: ObjectId(userId) });

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const fileId = req.params.id;
  const file = await (await dbClient.filesCollection()).findOne({
    _id: ObjectId(fileId), userId: user._id,
  });

  if (!file) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({
    id: file._id,
    userId: file.userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId,
  });
};

const getIndex = async (req, res) => {
  const token = req.get('X-Token');
  const userId = await redisClient.get(`auth_${token}`);

  const user = await (await dbClient.usersCollection()).findOne({ _id: ObjectId(userId) });

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { parentId = 0, page = 0 } = req.query;

  const result = await (await dbClient.filesCollection()).aggregate([
    { $match: { userId: user._id, parentId } },
    { $skip: page * 20 },
    { $limit: 20 },
  ]);
  const files = [];
  for await (const doc of result) {
    files.push(doc);
  }
  res.json(files);
};

const FilesController = {
  postUpload,
  getShow,
  getIndex,
};
export default FilesController;
