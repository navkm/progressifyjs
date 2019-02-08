import { Config } from '../../src/config';

describe('Testing Config object', function () {

  it('001 - Create an empty config object', function () {
    const c = new Config();
    console.log(c);
    // The object must not be null
    assert.isTrue(c != null,'Check if an Object has been successfully created');
    assert(c.id==1,'Check if the id of the config object is set to 1');
    // cache must be empty
    expect(c.cache).to.be.empty;
    // check for the default swPath
    console.log(c._swPath);
    //assert(c.swPath=='/sw.js');
  })

  it('002 - Create the default config object', function () {
    const c = Config.getDefaultConfig();
    console.log(c);
    // The object must not be null
    assert.isTrue(c != null,'Check if an Object has been successfully created');
    assert(c.id==1,'Check if the id of the config object is set to 1');
    //cache must not be empty and should have 1 entry
    expect(c.cache).to.not.be.empty;
    expect(c.cache).to.have.length.of.at.most(1);
  })
})