const Thread = require('../models/threadModel');

exports.createThread = async (req, res) => {
  const { board } = req.params;
  const { text, delete_password } = req.body;

  try {
    const thread = new Thread({
      board,
      text,
      delete_password,
      created_on: new Date(),
      bumped_on: new Date(),
      reported: false,
      replies: []
    });
    await thread.save();
    res.redirect(`/b/${board}/`);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo crear el thread' });
  }
};

exports.getThreads = async (req, res) => {
  const { board } = req.params;
  try {
    const threads = await Thread.find({ board })
      .sort({ bumped_on: -1 })
      .limit(10)
      .select('-delete_password -reported')
      .lean();

    // Mostrar solo 3 replies por thread
    threads.forEach(thread => {
      if(thread.replies.length > 3){
        thread.replies = thread.replies.slice(-3);
      }
      thread.replycount = thread.replies.length;
    });

    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron obtener los threads' });
  }
};

exports.deleteThread = async (req, res) => {
  const { board } = req.params;
  const { thread_id, delete_password } = req.body;

  try {
    const thread = await Thread.findOne({ _id: thread_id, board });
    if (!thread) return res.status(404).send('Thread no encontrado');

    if (thread.delete_password !== delete_password) {
      return res.send('incorrect password');
    }

    await Thread.deleteOne({ _id: thread_id });
    res.send('success');
  } catch (err) {
    res.status(500).send('Error al eliminar thread');
  }
};

exports.reportThread = async (req, res) => {
  const { board } = req.params;
  const { thread_id } = req.body;

  try {
    await Thread.findByIdAndUpdate(thread_id, { reported: true });
    res.send('reported');
  } catch (err) {
    res.status(500).send('Error al reportar thread');
  }
};
