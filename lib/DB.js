class DB {
  constuctor(models=null) {
    this._models = []
    this.register = this.register.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getOne = this.getOne.bind(this);
    if(models) register(models);
  }
  register(models) {
    const isArray = Array.isArray(models);
    this._models = isArray ?
      [...this._models, ...models] :
      [...this._models, models];
    isArray ? models.map(model => model.registerDB(this)) : models.registerDB(this);
  }
  getAll() {
    return [...this._models];
  }
  getOne(model) {
    return this._models.filter(i => i.name === model)[0];
  }
}

module.exports = DB;
