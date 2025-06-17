const mongoose = require('mongoose');
const Thread = require('../models/threadModel');

exports.createReply = async (req, res) => {
  const { board } = req.params;
  const { thread_id, text, delete_password } = req.body;

  if (!thread_id || !text || !delete_password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (!mongoose.Types.ObjectId.isValid(thread_id)) {
    return res.status(400).json({ error: 'thread_id inválido' });
  }

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).json({ error: 'Thread no encontrado' });

    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      text,
      delete_password,
      created_on: new Date(),
      reported: false
    };

    thread.replies.push(newReply);
    thread.bumped_on = new Date();
    await thread.save();

    res.redirect(`/b/${board}/${thread_id}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo crear la reply' });
  }
};

exports.getThreadWithReplies = async (req, res) => {
  const { thread_id } = req.query;
  if (!thread_id || !mongoose.Types.ObjectId.isValid(thread_id)) {
    return res.status(400).json({ error: 'thread_id inválido' });
  }

  try {
    const thread = await Thread.findById(thread_id).select('-delete_password -reported');
    if (!thread) return res.status(404).json({ error: 'Thread no encontrado' });

    thread.replies = thread.replies.map(reply => ({
      _id: reply._id,
      text: reply.text,
      created_on: reply.created_on
    }));

    res.json(thread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo obtener el thread' });
  }
};

exports.deleteReply = async (req, res) => {
  const { thread_id, reply_id, delete_password } = req.body;

  if (!thread_id || !reply_id || !delete_password) {
    return res.status(400).send('Faltan campos obligatorios');
  }
  if (!mongoose.Types.ObjectId.isValid(thread_id) || !mongoose.Types.ObjectId.isValid(reply_id)) {
    return res.status(400).send('IDs inválidos');
  }

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('Thread no encontrado');

    const reply = thread.replies.id(reply_id);
    if (!reply) return res.status(404).send('Reply no encontrada');

    if (reply.delete_password !== delete_password) return res.send('incorrect password');

    reply.text = '[deleted]';
    await thread.save();

    res.send('success');
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
};

exports.reportReply = async (req, res) => {
  const { thread_id, reply_id } = req.body;

  if (!thread_id || !reply_id) {
    return res.status(400).send('Faltan campos obligatorios');
  }
  if (!mongoose.Types.ObjectId.isValid(thread_id) || !mongoose.Types.ObjectId.isValid(reply_id)) {
    return res.status(400).send('IDs inválidos');
  }

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('Thread no encontrado');

    const reply = thread.replies.id(reply_id);
    if (!reply) return res.status(404).send('Reply no encontrada');

    reply.reported = true;
    await thread.save();

    res.send('reported');
  } catch (err) {
    console.error(err);
    res.status(500).send('error');
  }
};
