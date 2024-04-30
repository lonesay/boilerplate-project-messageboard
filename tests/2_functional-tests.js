const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.assert;
const server = require('../server');

chai.use(chaiHttp);
let id  = null;
let rid = null;

suite('Functional Tests', function() {
    test("Creating a new thread", done => {
        chai.request(server)
            .post('/api/threads/test')
            .type("form")
            .send({
                text           : "Hello World",
                delete_password: "delete"
            })
            .end((err, res) => {
                assert.containsAllKeys(res.body, {
                    _id            : "",
                    text           : "",
                    delete_password: "",
                    created_on     : "",
                    bumped_on      : "",
                    replies        : "",
                    reported       : "",
                });
                id = res.body._id;
                assert.typeOf(res.body._id            , "string" );
                assert.typeOf(res.body.text           , "string" );
                assert.typeOf(res.body.delete_password, "string" );
                assert.typeOf(res.body.created_on     , "string" );
                assert.typeOf(res.body.bumped_on      , "string" );
                assert.typeOf(res.body.replies        , "array"  );
                assert.typeOf(res.body.reported       , "boolean");
                done();
            });
    });

    test("Viewing the 10 most recent threads with 3 replies each", done => {
        chai.request(server)
            .get('/api/threads/test')
            .end((err, res) => {
                assert.typeOf  (res.body       , "array");
                assert.isAtMost(res.body.length, 10     );
                let last = new Date(Date.now()).valueOf();
                res.body.forEach(thread => {
                    const date = new Date(thread.bumped_on).valueOf();
                    assert.isAtMost(date, last);
                    last = date;
                    assert.typeOf  (thread.replies       , "array");
                    assert.isAtMost(thread.replies.length, 3      );
                });
                done();
            });
    });

    test("Deleting a thread with the incorrect password", done => {
        chai.request(server)
            .delete('/api/threads/test')
            .send({
                delete_password: 'notvalid',
                thread_id      : id
            })
            .end((err, res) => {
                assert.equal(res.text, "incorrect password");
                done();
            });
    });

    test("Deleting a thread with the correct password", done => {
        chai.request(server)
            .delete('/api/threads/test')
            .send({
                delete_password: 'delete',
                thread_id      : id
            })
            .end((err, res) => {
                assert.equal(res.text, "success");
                done();
            });
    });

    test("Reporting a thread", done => {
        chai.request(server)
            .put('/api/threads/test')
            .send({
                thread_id: id
            })
            .end((err, res) => {
                assert.equal(res.text, "reported");
                done();
            });
    });

    test("Creating a new reply", done => {
        chai.request(server)
            .post('/api/replies/test')
            .send({
                thread_id      : id,
                text           : "Hello dude",
                delete_password: "123"
            })
            .end((err, res) => {
                assert.containsAllKeys(res.body, {
                    _id            : "",
                    text           : "",
                    delete_password: "",
                    created_on     : "",
                    reported       : "",
                });
                rid = res.body._id;
                assert.typeOf(res.body._id            , "string" );
                assert.typeOf(res.body.text           , "string" );
                assert.typeOf(res.body.delete_password, "string" );
                assert.typeOf(res.body.created_on     , "string" );
                assert.typeOf(res.body.reported       , "boolean");
                done();
            });
    });

    test("Viewing a single thread with all replies", done => {
        chai.request(server)
            .get('/api/replies/test')
            .query({thread_id:id})
            .end((err, res) => {
                assert.containsAllKeys(res.body, {
                    _id            : "",
                    text           : "",
                    created_on     : "",
                });
                assert.doesNotHaveAnyKeys(res.body, ['delete_password', 'reported']);
                done();
            });
    });

    test("Deleting a reply with the incorrect password", done => {
        chai.request(server)
            .delete('/api/replies/test')
            .send({
                thread_id      :id,
                reply_id       :rid,
                delete_password:"Hello"
            })
            .end((err, res) => {
                assert.equal(res.text, "incorrect password");
                done();
            });
    });

    test("Deleting a reply with the correct password", done => {
        chai.request(server)
            .delete('/api/replies/test')
            .send({
                thread_id      :id,
                reply_id       :rid,
                delete_password:"123"
            })
            .end((err, res) => {
                assert.equal(res.text, "success");
                done();
            });
    });

    test("Reporting a reply", done => {
        chai.request(server)
            .put('/api/replies/test')
            .send({
                thread_id      :id,
                reply_id       :rid
            })
            .end((err, res) => {
                assert.equal(res.text, "reported");
                done();
            });
    });    

});
