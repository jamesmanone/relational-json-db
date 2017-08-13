# Relational JSON Database
## Introduction
Relational JSON Database is a simple, dev-grade psudo-relational database. I designed it to work as similar to mongoose as possible with such a lightweight package. If you want a dev-database that works like mongo but runs on any computer (with node) and doesn't rely on any external programs running, You've found your devDB.
## Installation
Install like you would any other npm package:
```shell
$ npm install -S relational-json-db
```
## Setup
Relational JSON database exposes a few classes for setting up a devDB. Models can be set up as follows:
```javascript
// Post.js

const { Model, Schema, ObjectId } = require('relational-json-db');

class Post extends Schema {
  constructor(data) {
    super(data);
    this.title = data.title;
    this.body = data.body;
    this.author = data.author;
    this.votes = data.votes || 0;
    this.comments = data.comments || [];
    this.addComment = this.addComment.bind(this);
  }
  addComment(comment) {
    this.comments.push(new ObjectId('Comment', comment));
  }
}

module.exports = new Model('Post', Post);

```
<br>

```javascript
// Comment.js

const { Model, Schema, ObjectId } = require('relational-json-db');

class Comment extends Schema {
  constructor(data) {
    super(data);
    this.body = data.body;
    this.author = data.author;
    this.post = new ObjectId('Post', post);
  }
}

module.exports = new Model('Comment', Comment);

```
<br>

```javascript
// Index.js

const { DB } = require('relational-json-db');
const Comment = require('./Comment');
const Post = require('./Post');

const db = new DB([Comment, Post]);

module.exports = {Comment, Post};

```
<br>
That's all it takes to get a devDB going.

## API
From within the rest of your application, import your models from where you initialize your database. Your Schemas are stored within the models, so you needn't import of export them. **For the purpose of these examples we are going to assume you have imported the Post model.** These examples would work replacing **Post** with whatever the name of your model is. Due to it's immense popularity, I'm using Express for most of my example code.

### Create
#### `Post.create(<post:object>[, <autosave:bool>])`
**Input:** an object with all the properties necessary to create an object of type Post. Autosave is an optional parameter. If true, the object will be automatically persisted to the database.

**Returns:** a Promise which resolves with an object of type Post (the schema). Relational-json-db will automatically add an ID and createdAt field.

**Usage:**
```javascript
app.post('/post', (req, res) => {
  const post = req.body.post;
  Post.create(post, true)
    .then(doc => res.json(doc))
    .catch(e => res.status(418).send());
});
```
___
<br>

### Save
#### `document.save();`
**Input:** None

**Returns:** A promise which resolves to be the same document you called save() on.

**Usage:**

```javascript
app.post('/post', (req, res) => {
  const post = req.body.post;
  Post.create(post)
    .then(post => post.save())
    .then(doc => res.json(doc))
    .catch(e => res.status(418).send());
});
```
___
<br>

### Update
#### `Post.findByIdAndUpdate(<update:object>)`
**Input:** An object describing the update. Can be a simple key value pair like `{body: req.body.post.body}` or more complicated array tasks like <br>
`{ comments: { $push: new ObjectId('Comments', comment) } }`
<br>
*Note:* At present, only the `$push` and `$pull` operators are supported, and then only on fields of type [ObjectId].

**Returns:** A promise which resolves to the document you updated. Unlike Mongoose, you do not pass `{new:true}` to get the updated document; this method only resolves the updated document.

**Usage:**

```javascript
app.post('/post/:id/comment', (req, res) => {
  let comment;
  Comment.create(req.body.comment)
    .then(newDoc => {
      comment = newDoc;
      return Post.findByIdAndUpdate(
              req.params.id,
              { comments: $push: newDoc }
            );
    })
    .then(post => {
      comment.save();
      res.json(post);
    })
    .catch(() => res.status(418).send());
});
```
___
<br>

#### Manual Update
Any update you would like to do can also be done by retrieving the document, changing fields, and calling `.save()` on the document.

**Usage:**

```javascript
app.get('/post/:id', (req, res) => {
  const { title, body } = req.body;
  Post.findById(req.id)
    .then(post => {
      if(title) post.title = title;
      if(body) post.body = body;
      return post.save();
    })
    .then(post => res.json(post))
    .catch(() => res.status(404).send());
  // Why is catch a 404? findById rejects if the id is not in the db
});
```
___
<br>

### Query
#### `Post.findById(<postId:string>)`
**Input:** The ID of the object you seek. Type string.

**Returns:** A promise which resolves to the document with a matching ID (or rejects if no match found)

**Usage:**

```javascript
app.get('/post/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(() => res.status(404).send());
});
```
___
<br>

#### `Post.find([<query:object>])`
**Input:** An optional object where the key value pairs are `{field: value}`. This is a strict equality search, so it must be an exact match. *Note:* If your query contains *only* `{id: <id:string>}` we will use the same optimizations as we use for `findById()` to find the record, but will still return a Query object.

**Returns:** A Query object.

**Usage:**

```javascript
app.get('/post/search/byauthor/:author', (req, res) => {
  Post.find({author: req.params.author}).exec()
    .then(posts => res.json({posts}))
    .catch(() => res.json({posts:[]}));
  /* Whats that exec()? exec() unwraps a query, returning a
   promise that resolves with results, not unlike mongoose */
});
```
___
<br>

#### `Query.filter(<query:object>)`
**Input:** Much like the input to `find()`, but limited to one parameter.

**Returns:** A Query object.

**Usage:**

```javascript
app.get('/post/search/bytitle/:title', (req, res) => {
  Post.find().filter({title: req.params.title}).exec()
  .then(posts => res.json({posts}))
  .catch(() => res.json({posts: []}));
});
```
___
<br>

#### `Query.offset(<offset:int>)`
**Input:** An integer to offset results. Useful along with `.limit()` for pagenation.

**Returns:** A Query object.

#### `Query.limit(<limit:int>)`
**Input:** An integer to limit the size of the return. **Always place AFTER offset**.

**Returns:** A Query object.

**Usage:**

```javascript
app.get('/post/:page', (req, res) => {
  Post.find().offset((req.params.page-1)*10).limit(10).exec()
    .then(posts => res.json({posts}));
    // But why is this better then other devDB options? See below!
});
```
___
<br>

#### `Query.populate(<field:string>)`
**Input:** A string that matches a field name in the documents in the Query object.

**Returns:** A Query object.

**Usage:**

```javascript
app.get('/post/:id', (req, res) => {
  Post.find({id: req.params.id})
    .populate('comments')
    .exec()
    .then(post => res.json({post: post[0]}))
    .catch(() => res.status(404).send());
});
```
___
<br>

#### `Query.exec()`
**Input:** None.

**Returns:** A promise that resolves to an array of documents.

**Usage:** As shown above
<br>

### Delete
#### `document.remove()`
**Input:** None.

**Returns:** Null.

**Usage:**
<br>

```javascript
app.delete('/post/:id', (req, res) => {
  Post.findById(req.param.id)
    .then(post => post.remove())
    .then(() => res.json({success:true}))
    .catch(() => res.json({success:false}));
});
```
___
<br>

### Setup
#### `new Model(<name:string>, <schema: Schema>)`
**Description:** The Model is the work horse of the database. It handles everything from new document creation, to queries, to saves, deletes, and even persistence. Sure, you can call `document.save()` or `document.remove()`, but behind the scenes these methods hook into the model to do the heavy lifting.
___
<br>

#### `class <Name> extends Schema`
**Description:** Schema is the base class all your schema should inherit from. This class adds the methods needed for managing your database, and also will automatically set `.id` and `.createdAt` if you don't define them.
___
<br>

#### `new DB([<models:array||model>])`
**Description:** The DB constructor is essential for the relationships. It is a repository for all your models. When you pass the constructor a model, or an array of models the new DB will inject a reference to itself into each model. Forgot to pass all your models? No worries: see below.
___
<br>

#### `db.register(<models:array||model>)`
**Description:** The DB object has a `register()` method that takes a model or array of models as input. It adds the models to the repository, and then distributes a reference of itself to all the new models. Behind the scenes, the DB object has methods for delivering a reference to any of the models in it's repository to any object that needs it.

## Where's my data?
Your data is stored in a folder in the root directory of you project named `/.data`. Each Model gets it's own .json file, following the naming pattern `${name}.json` where name is the first argument to `new Model()`.

## Contributing
We love contributors! This package it meant to stay lightweight, so before Contributing new features, ask yourself if this really helps for the purpose of a devDB. Of course bug fixes go right to the front of the PR line.

```json
{
  "bugFixes": "always welcome",
  "newFeatures": {
    "byPriority": [
      "indexing",
      "performance boosts",
      "expanded options",
      "regex 'iLike' filter"
    ]
  }
}
```
