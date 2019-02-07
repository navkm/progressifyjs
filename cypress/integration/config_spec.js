import { Config } from '../../src/config';

describe('Testing Config object', function () {

  it('001 - Create an empty config object', function () {
    const c = Config.createConfigObject();
    console.log(c);
    // The object must not be null
    assert(c != null);
    assert(c.id==1);
    // cache must be empty
    expect(c.cache).to.be.empty;
  })

  it('002 - Create the default config object', function () {
    const c = Config.getDefaultConfig();
    console.log(c);
    // The object must not be null
    assert(c != null);
    assert(c.id==1);
    //cache must not be empty and should have 1 entry
    expect(c.cache).to.not.be.empty;
    expect(c.cache).to.have.length.of.at.most(1);
  })
})