const fs = require('fs');
const btoa = require('btoa');
const Query = require('./Query');

class Model {
  constructor(name, schema, indexFields) {
    this.name = name;
    this.filename = `${name}.json`;
    this.schema = schema;
    this.indexFields = indexFields;
    this.db = JSON.parse(fs.readFileSync(`${this.name}.json`)) || [];
    this.hash = {};
    this.indices = {};
    this.db.map(doc => {
      this.hash[doc.id] = doc;
    });
    this.findById = this.findById.bind(this);
    this.find = this.find.bind(this);
    this.save = this.save.bind(this);
    this.create = this.create.bind(this);
    this.remove = this.remove.bind(this);
    this.findByIdAndUpdate = this.findByIdAndUpdate.bind(this);
    this.registerDB = this.registerDB.bind(this);
    this.schema.injectModel(this);
  }
  findById(id) {
    return new Promise((resolve, reject) => {
      this.hash.hasOwnProperty(id) || reject();
      const doc = this.hash[id];
      resolve(doc);
    });
  }
  find(query) {
    if(Object.keys(query).length === 1 && query.hasOwnProperty('id')) {
      let result = Object.assign({}, this.hash[query[id]]);

    }
    let results = [...this.db];
    if(query) {
      for(let param in query) {
        results = results.filter(result => result[param] === query[param]);
      }
    }
    results = results.map(result => new this.schema(result));
    return new Query(results, this.DB)
  }
  save(doc) {
    return new Promise((resolve, reject) => {
      doc.id || reject();
      this.db = this.db
        .filter(item => item.id !== doc.id)
        .concat([doc]);
      this.hash = Object.assign({}, this.hash, doc.id: doc);
      fs.writeFile(`${this.name}.json`, JSON.stringify(this.db), e => {
        if(e) reject(e);
        resolve(doc);
      });
    });
  }
  create(obj, auto) {
    return new Promise((resolve, reject) => {
      obj || reject();
      const doc = new this.schema(obj);
      doc.injectModel(this);
      if(auto) doc.save().then(resolve, reject);
      else resolve(doc);
    });
  }
  remove(id) {
    typeof id === 'string' || id = id.id;
    id || return false;
    delete this.hash[id]
    this.db = this.db.filter(item => item.id !== id);
    fs.writeFile(this.filename, JSON.stringify(this.db), () => {
      return true;
    });
  }
  findByIdAndUpdate(id, update) {
    return new Promise((resolve, reject) => {
      let doc = this.hash[id];
      doc || reject();
      const op = Object.keys(update)[0];
      switch (op) {
        case '$pull':
          const field = Object.keys(update.$pull)[0];
          doc[field] = doc[field].filter(item => item.id !== update.$pull[field])
          this.save(doc)
            .then(resolve, reject)
          break;
        case '$push':
          const field = Object.keys(update.$push)[0];
          doc[field] = doc[field].concat($push[field])
          this.save(doc)
            .then(resolve, reject)
          break;
        default:
          doc[op] = update[op];
          this.save(doc)
            .then(resolve, reject);
      }
    });
  }
  registerDB(db) {
    this.DB = db;
  }
  // makeIndex(index) {
  //   this.indices[index] = this.db.map(doc => {
  //     this.indices[index][doc[index]] = doc;
  //   });
  // }
}
