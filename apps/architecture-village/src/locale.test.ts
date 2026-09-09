import test from 'node:test';
import assert from 'node:assert/strict';
import {curriculum,moduleById,villageById} from './curriculum';
import {curriculumView,labView,moduleView,villageView} from './locale';

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

test('English mode provides English lesson, quiz, encounter and lab content',()=>{
  const vietnameseMarks=/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
  const view=curriculumView(curriculum,'en');
  const values:string[]=[];
  for(const module of view.modules){
    values.push(module.title,module.place,module.spirit,...module.objectives);
    for(const section of module.sections)values.push(section.title,section.body,section.example,section.takeaway);
    for(const question of module.quiz)values.push(question.prompt,question.explanation,...question.options);
    values.push(module.encounter.name,module.encounter.intro,module.encounter.reflectionPrompt);
    for(const node of module.encounter.nodes){
      values.push(node.prompt,node.context);
      for(const choice of node.choices)values.push(choice.label,choice.feedback);
    }
    const lab=labView(module.id,'en'),low=lab.run(lab.min,0),high=lab.run(lab.max,Math.min(1,lab.modes.length-1));
    values.push(lab.title,lab.task,lab.label,lab.unit,...lab.modes,low.headline,low.explanation,...low.nodes,high.headline,high.explanation,...high.nodes);
  }
  for(const village of view.villages){
    values.push(village.title,village.subtitle,village.description,village.boss.name,village.boss.intro,village.boss.reflectionPrompt);
    for(const node of village.boss.nodes){
      values.push(node.prompt,node.context);
      for(const choice of node.choices)values.push(choice.label,choice.feedback);
    }
  }
  assert.ok(values.every(value=>!vietnameseMarks.test(value)),values.find(value=>vietnameseMarks.test(value)));
});
