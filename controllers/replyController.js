const Thread = require('../models/threadModel');

exports.createReply = async (req, res) => {
  const { board } = req.params;
  const { thread_id, text, delete_password } = req.body;

  try {
    const thread = await Thread.findOne({ _id: thread_id, board });
    if (!thread) return res.status(404).send('Thread no encontrado');

    const reply = {
      text,
      delete_password,
      created_on: new Date(),
      reported: false,
    };

    thread.replies.push(reply);
    thread.bumped_on = new Date();
    await thread.save();

    res.redirect(`/b/${board}/${thread_id}`);
  } catch (err) {
    res.status(500).send('No se pudo crear la respuesta');
  }
};

exports.getThreadWithReplies = async (req, res) => {
  const { board } = req.params;
  const { thread_id } = req.query;

  try {
    const thread = await Thread.findOne({ _id: thread_id, board })
      .select('-delete_password -reported -replies.delete_password -replies.reported')
      .lean();

    if (!thread) return res.status(404).send('Thread no encontrado');

    res.json(thread);
  } catch (err) {
    res.status(500).send('No se pudo obtener el thread');
  }
};

exports.deleteReply = async (req, res) => {
  const { board } = req.params;
  const { thread_id, reply_id, delete_password } = req.body;

  try {
    const thread = await Thread.findOne({ _id: thread_id, board });
    if (!thread) return res.status(404).send('Thread no encontrado');

    const reply = thread.replies.id(reply_id);
    if (!reply) return res.status(404).send('Reply no encontrado');

    if (reply.delete_password !== delete_password) {
      return res.send('incorrect password');
    }

    // Instead of deleting reply, change text to "[deleted]"
    reply.text = '[deleted]';
    await thread.save();

    res.send('success');
  } catch (err) {
    res.status(500).send('Error al eliminar reply');
  }
};

exports.reportReply = async (req, res) => {
  const { board } = req.params;
  const { thread_id, reply_id } = req.body;

  try {
    const thread = await Thread.findOne({ _id: thread_id, board });
    if (!thread) return res.status(404).send('Thread no encontrado');

    const reply = thread.replies.id(reply_id);
    if (!reply) return res.status(404).send('Reply no encontrado');

    reply.reported = true;
    await thread.save();

    res.send('reported');
  } catch (err) {
    res.status(500).send('Error al reportar reply');
  }
};
