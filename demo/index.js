import './style.css';

import Viewer from '../src';

let viewer = new Viewer({
  el: '#demo',
});

viewer.setImageList([
  'https://t7.baidu.com/it/u=1819248061,230866778&fm=193&f=GIF',
  'https://t7.baidu.com/it/u=737555197,308540855&fm=193&f=GIF',
  'https://t7.baidu.com/it/u=3203007717,1062852813&fm=193&f=GIF',
  'https://t7.baidu.com/it/u=1819248061,230866778&fm=193&f=GIF',
  'https://t7.baidu.com/it/u=737555197,308540855&fm=193&f=GIF',
  'https://t7.baidu.com/it/u=3203007717,1062852813&fm=193&f=GIF',
  'https://t7.baidu.com/it/u=1819248061,230866778&fm=193&f=GIF',
  'https://t7.baidu.com/it/u=737555197,308540855&fm=193&f=GIF',
  'https://t7.baidu.com/it/u=3203007717,1062852813&fm=193&f=GIF',
  'https://t7.baidu.com/it/u=1819248061,230866778&fm=193&f=GIF',
  'https://t7.baidu.com/it/u=737555197,308540855&fm=193&f=GIF',
  'https://t7.baidu.com/it/u=3203007717,1062852813&fm=193&f=GIF',
]);

window.viewer = viewer;