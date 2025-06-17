const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let threadId;
let replyId;

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {

    test('POST to create a new thread', function(done) {
      chai.request(server)
        .post('/api/threads/testboard')
        .send({ text: 'Thread test', delete_password: 'pass123' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('GET 10 most recent threads with 3 replies', function(done) {
      chai.request(server)
        .get('/api/threads/testboard')
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtMost(res.body.length, 10);
          const thread = res.body[0];
          assert.property(thread, '_id');
          assert.property(thread, 'text');
          assert.isArray(thread.replies);
          assert.isAtMost(thread.replies.length, 3);
          threadId = thread._id;
          done();
        });
    });

    test('PUT to report a thread', function(done) {
      chai.request(server)
        .put('/api/threads/testboard')
        .send({ report_id: threadId })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('DELETE thread with incorrect password', function(done) {
      chai.request(server)
        .delete('/api/threads/testboard')
        .send({ thread_id: threadId, delete_password: 'wrongpass' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('DELETE thread with correct password', function(done) {
      // Creamos uno nuevo para borrarlo, así no rompemos el resto de los tests
      chai.request(server)
        .post('/api/threads/testboard')
        .send({ text: 'Thread to delete', delete_password: 'delete123' })
        .end((err, res) => {
          chai.request(server)
            .get('/api/threads/testboard')
            .end((err, res) => {
              const newThreadId = res.body.find(t => t.text === 'Thread to delete')._id;
              chai.request(server)
                .delete('/api/threads/testboard')
                .send({ thread_id: newThreadId, delete_password: 'delete123' })
                .end((err, res) => {
                  assert.equal(res.status, 200);
                  assert.equal(res.text, 'success');
                  done();
                });
            });
        });
    });

  });

  suite('API ROUTING FOR /api/replies/:board', function() {

    test('POST to create a reply', function(done) {
      chai.request(server)
        .post('/api/replies/testboard')
        .send({ thread_id: threadId, text: 'Reply test', delete_password: 'replypass' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('GET a thread with all replies', function(done) {
      chai.request(server)
        .get('/api/replies/testboard')
        .query({ thread_id: threadId })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.property(res.body, 'replies');
          assert.isArray(res.body.replies);
          const reply = res.body.replies.find(r => r.text === 'Reply test');
          replyId = reply._id;
          done();
        });
    });

    test('PUT to report a reply', function(done) {
      chai.request(server)
        .put('/api/replies/testboard')
        .send({ thread_id: threadId, reply_id: replyId })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('DELETE reply with incorrect password', function(done) {
      chai.request(server)
        .delete('/api/replies/testboard')
        .send({ thread_id: threadId, reply_id: replyId, delete_password: 'wrongpass' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('DELETE reply with correct password', function(done) {
      chai.request(server)
        .delete('/api/replies/testboard')
        .send({ thread_id: threadId, reply_id: replyId, delete_password: 'replypass' })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

  });

});
