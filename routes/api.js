'use strict';

const boards = {};

module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .put((req, res) => {
    const board     = req.params.board;
    const thread_id = parseInt(req.body.thread_id);
    const thread    = boards[board].threads[thread_id];
    thread.reported = true;
    res.send('reported');
  })
  .delete((req, res) => {
    const board     = req.params.board;
    const thread_id = parseInt(req.body.thread_id);
    const thread    = boards[board].threads[thread_id];
    const password  = req.body.delete_password;

    if (password == thread.delete_password) {
      thread.deleted = true;
      res.send("success");
    } else {
      res.send("incorrect password");
    }
  })
  .post((req, res) => {
    const board = req.params.board;
    if (!boards[board]) boards[board] = {threads:[], top_ten:[]};
    const id  = boards[board].threads.length;
    const now = new Date(Date.now()).toISOString();
    boards[board].threads.push({
      _id            : "" + id,
      text           : req.body.text,
      delete_password: req.body.delete_password,
      created_on     : now,
      bumped_on      : now,
      replies        : [],
      reported       : false,
      replycount     : 0,
      deleted        : false
    });
    boards[board].top_ten.push(id);
    res.json(boards[board].threads[id]);
  })
  .get((req, res) => {
    const board = boards[req.params.board];
    const top = board ? board.top_ten : undefined;
    const result = [];
    if (top) {
      let count = 0;
      for(let i=top.length-1;count < 10 && i >= 0;i--) {
        const id = top[i];
        const thread = boards[req.params.board].threads[id];
        if (thread.deleted) continue;

        let nthread = Object.keys(thread)
          .filter((key) => {
            return key != 'reported' && key != 'delete_password';
          })
          .reduce((r, key) => (
            r[key] = thread[key], r
          ), {});
        
        nthread.replies = thread.replies.slice(Math.max(thread.replies.length - 3, 0));
        nthread.replies.forEach((reply, i) => {
          nthread.replies[i] =
            Object.keys(reply)
              .filter((key) => {
                return key != 'reported' && key != 'delete_password';
              })
              .reduce((r, key) => (
                r[key] = reply[key], r
              ), {});
        });
        
        result.push(nthread);
      }
    }
    res.json(result);
  });
    
  app.route('/api/replies/:board')
  .put((req, res) => {
    const board     = req.params.board;
    const thread_id = parseInt(req.body.thread_id);
    const thread    = boards[board].threads[thread_id];

    const reply_id  = parseInt(req.body.reply_id);
    const reply     = thread.replies[reply_id];
    reply.reported  = true;
    res.send('reported');
  })
  .delete((req, res) => {
    const board     = req.params.board;
    const thread_id = parseInt(req.body.thread_id);
    const thread    = boards[board].threads[thread_id];
    const password  = req.body.delete_password;

    const reply_id  = parseInt(req.body.reply_id);
    const reply     = thread.replies[reply_id];

    if (password   == reply.delete_password) {
      reply.deleted = true;
      reply.text    = "[deleted]";
      res.send("success");
    } else {
      res.send("incorrect password");
    }
  })
  .post((req, res) => {
    const board = req.params.board;
    const thread_id = parseInt(req.body.thread_id);
    const thread = boards[board].threads[thread_id];
    const now = new Date(Date.now()).toISOString();

    let replay = {
      _id            : "" + thread.replies.length,
      text           : req.body.text,
      delete_password: req.body.delete_password,
      reported       : false,
      created_on     : now,
      deleted        : false
    }
    thread.bumped_on = now;
    thread.replycount++;
    thread.replies.push(replay);

    boards[board].top_ten.push(thread_id);
    res.json(replay);
  })
  .get((req, res) => {
    const board = req.params.board;
    const thread_id = parseInt(req.query.thread_id);
    const thread = boards[board].threads[thread_id];
    let result = Object.keys(thread)
      .filter((key) => {
        return key != 'reported' && key != 'delete_password' && key != 'replies';
      })
      .reduce((r, key) => (
        r[key] = thread[key], r
      ), {});
    result.replies = [];
    thread.replies.forEach((reply) => {
      result.replies.push(
        Object.keys(reply)
          .filter((key) => {
            return key != 'reported' && key != 'delete_password';
          })
          .reduce((r, key) => (
            r[key] = reply[key], r
          ), {})
      );
    });
    res.json(result);
  });

};
