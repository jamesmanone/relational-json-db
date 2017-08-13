class ObjectId {
  constructor(model, id) {

    this.model = model;
    this.id = typeof id === 'string' ? id : id.id;
  }
}

module.exports = ObjectId;
