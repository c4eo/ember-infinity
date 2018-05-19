import { module, test, skip } from 'qunit';
import { setupTest } from 'ember-qunit';
import { A } from '@ember/array';
import RSVP from 'rsvp';
import ArrayProxy from '@ember/array/proxy';
import InfinityModel from 'ember-infinity/lib/infinity-model';

module('Unit | Service | infinity', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.EA = (content) => {
      return ArrayProxy.create({ content: A(content) });
    };
    this.item = { id: 1, title: 'The Great Gatsby' };
  });

  test('it works with empty pushObjects', function(assert) {
    let service = this.owner.lookup('service:infinity');
    let originalArray = InfinityModel.create({ content: A() });
    let newArray = this.EA();
    let result = service.pushObjects(originalArray, newArray);
    assert.equal(result.get('length'), 0);
  });

  test('pushObjects: it works with empty array', function(assert) {
    let service = this.owner.lookup('service:infinity');
    let originalArray = InfinityModel.create({ content: A() });
    let newArray = this.EA([this.item]);
    let result = service.pushObjects(originalArray, newArray);
    assert.equal(result.get('length'), 1);
  });

  test('pushObjects: it works with non empty array', function(assert) {
    let service = this.owner.lookup('service:infinity');
    let originalArray = InfinityModel.create({ content: A([this.item]) });
    let newArray = this.EA([this.item]);
    let result = service.pushObjects(originalArray, newArray);
    assert.equal(result.get('length'), 2);
  });

  test('unshiftObjects: it works with empty original array', function(assert) {
    let service = this.owner.lookup('service:infinity');
    let originalArray = InfinityModel.create({ content: A() });
    let newArray = this.EA();
    let result = service.unshiftObjects(originalArray, newArray);
    assert.equal(result.get('length'), 0);
  });

  test('unshiftObjects: it works', function(assert) {
    let service = this.owner.lookup('service:infinity');
    let originalArray = InfinityModel.create({ content: A([this.item]) });
    let newArray = this.EA();
    let result = service.unshiftObjects(originalArray, newArray);
    assert.equal(result.get('length'), 1);
  });

  test('unshiftObjects: it works non empty new array', function(assert) {
    let service = this.owner.lookup('service:infinity');
    let originalArray = InfinityModel.create({ content: A([this.item]) });
    let newArray = this.EA([{id: 'wat'}]);
    let result = service.unshiftObjects(originalArray, newArray);
    assert.equal(result.get('length'), 2);
    assert.equal(result.get('firstObject').id, 'wat');
  });

  test('replace: it works', function(assert) {
    let service = this.owner.lookup('service:infinity');
    let originalArray = InfinityModel.create({ content: A([this.item]) });
    let newArray = this.EA([{id: 'wat'}]);
    let result = service.replace(originalArray, newArray);
    assert.equal(result.get('length'), 1);
    assert.equal(result.get('firstObject').id, 'wat');
  });

  test('replace: it works with empty array', function(assert) {
    let service = this.owner.lookup('service:infinity');
    let originalArray = InfinityModel.create({ content: A([this.item]) });
    let newArray = this.EA();
    let result = service.replace(originalArray, newArray);
    assert.equal(result.get('length'), 0);
  });

  test('flush: it clears array', function(assert) {
    let service = this.owner.lookup('service:infinity');
    let originalArray = InfinityModel.create({ content: A([this.item]) });
    let newArray = this.EA();
    let result = service.flush(originalArray, newArray);
    assert.equal(result.get('length'), 0);
  });

  test('model hook will always return promise when no cache in options', function(assert) {
    let service = this.owner.lookup('service:infinity');
    service.loadNextPage = () => new RSVP.Promise((resolve) => { resolve(); });
    let model = service.model('post');
    assert.ok(typeof(model.then) === 'function');
    assert.deepEqual(service.get('_cachedCollection'), {}, 'default of _cachedCollection');
    model = service.model('post');
    assert.ok(typeof(model.then) === 'function');
    assert.notOk(model instanceof InfinityModel, 'returns cached model');
  });

  test('model hook can return cached infinity model if pass "cache" with future timestamp', function(assert) {
    let service = this.owner.lookup('service:infinity');
    service.loadNextPage = () => new RSVP.Promise((resolve) => { resolve(); });
    let date = 3600;
    let model = service.model('post', { cache: date });
    assert.ok(typeof(model.then) === 'function');
    assert.ok(Object.keys(service.get('_cachedCollection')['post'])[0] > Date.now(), 'collection has correct key');
    model = service.model('post', { cache: date });
    assert.ok(model instanceof InfinityModel, 'returns cached model');
    model = service.model('post', { cache: date });
    assert.ok(model instanceof InfinityModel, 'returns cached model again');
  });

  test('model hook can return cached infinity model with label', function(assert) {
    let service = this.owner.lookup('service:infinity');
    service.loadNextPage = () => new RSVP.Promise((resolve) => { resolve(); });
    let date = 3600;
    let model = service.model('post', { cache: date, label: 'posts-main' });
    assert.ok(typeof(model.then) === 'function');
    assert.ok(Object.keys(service.get('_cachedCollection')['postposts-main'])[0] > Date.now(), 'collection has correct key');
    model = service.model('post', { cache: date, label: 'posts-main' });
    assert.ok(model instanceof InfinityModel, 'returns cached model');
    model = service.model('post', { cache: date, label: 'diff-label' });
    assert.ok(typeof(model.then) === 'function', 'diff label will return thennable');
    model = service.model('post', { cache: date, label: 'posts-main' });
    assert.ok(model instanceof InfinityModel, 'returns cached model again');
  });

  skip('model hook can break cache', function(assert) {
    let service = this.owner.lookup('service:infinity');
    service.loadNextPage = () => new RSVP.Promise((resolve) => { resolve(); });
    // let past_timestamp = Date.now();
    let date = 1;
    let model = service.model('post', { cache: date });
    assert.ok(typeof(model.then) === 'function');
    // assert.ok(Object.keys(service.get('_cachedCollection')['post'])[0] >= past_timestamp, 'collection has updated timestamp');
    model = service.model('post', { cache: date });
    assert.ok(typeof(model.then) === 'function');
  });
});
