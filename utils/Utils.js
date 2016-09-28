class Utils {
  constructor(){
    this.pick = this.pick.bind(this);
  }

  pick(o, ...props){
    return Object.assign(
      {},
      ...props.map(prop => ({
        [prop]: o[prop]
      }))
    );
  }
}

export default Utils;
