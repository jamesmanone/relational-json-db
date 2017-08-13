class DB {
  constructor(models=[]) {
    this._models = [];
    this.register = this.register.bind(this);
    this.register(models);
    this.getAll = this.getAll.bind(this);
    this.getOne = this.getOne.bind(this);
  }
  register(models) {
    const isArray = Array.isArray(models);
    if(isArray && !models.length) return;
    this._models = isArray ?
      [...this._models, ...models] :
      [...this._models, models];
    if(isArray) models.map(model => model.registerDB(this));
    else models.registerDB(this);
  }
  getAll() {
    return [...this._models];
  }
  getOne(model) {
    return this._models.filter(i => i.name === model)[0];
  }
}

module.exports = DB;
