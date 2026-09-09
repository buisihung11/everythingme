import test from 'node:test';
import assert from 'node:assert/strict';
import {curriculum,moduleById,villageById} from './curriculum';
import {moduleView,villageView} from './locale';

test('English mode localizes every village and module label without changing IDs',()=>{
  for(const village of curriculum.villages){
    const view=villageView(village,'en');
    assert.notEqual(view.title,village.title);
    assert.equal(view.id,village.id);
    for(const id of village.moduleIds){
      const original=moduleById(id), english=moduleView(original,'en');
      assert.equal(english.id,original.id);
      assert.notEqual(english.place,original.place);
      assert.ok(english.objectives.every(value=>/[A-Za-z]/.test(value)));
    }
  }
  assert.equal(moduleView(moduleById('intro'),'vi').title,moduleById('intro').title);
  assert.equal(villageView(villageById('scale'),'vi').title,villageById('scale').title);
});
