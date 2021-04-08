interface CtorOptions {
  el: string | HTMLElement;
  lazy?: boolean;
}

let style = `
.pic-viewer-imgbox {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.pic-viewer-toolbar {
  transition: opacity 0.3s;
  position: absolute;
  left: 50%;
  bottom: 10px;
  width: 300px;
  height: 50px;
  transform: translateX(-50%);
  background-color: #eee;
  opacity: 1;
  display: flex;
  overflow: hidden;
}
.pic-viewer-toolbar:hover {
  opacity: 0.3;
}
.pic-viewer-preview-img {
  transition: border-color 0.3s;
  width: 50px;
  height: 50px;
  object-fit: cover;
  border: 3px solid #aaa;
  box-sizing: border-box;
}
.pic-viewer-preview-img.current {
  border-color: #fff;
  z-index: 1;
}
.pic-viewer-preview-img:hover {
  border-color: #eee;
  z-index: 1;
}
.pic-viewer-preview-img:not(:first-child) {
  margin-left: -3px;
}
.pic-viewer-counter {
  font-family: sans-serif;
  position: absolute;
  left: 10px;
  bottom: 10px;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  color: white;
}
`.trim();

function insertCss(style: string) {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = style;
  document.head.appendChild(styleEl);
}

insertCss(style);

export default class Viewer {
  el: HTMLElement;
  images: HTMLImageElement[];
  _currentIndex: number;
  imgBox: HTMLDivElement;
  counter: HTMLDivElement;
  previewBar: HTMLDivElement;
  raf: number;
  pRaf: number;
  intouch: boolean;
  bounding: DOMRect;
  lazy: boolean;
  constructor(options: CtorOptions) {
    const {
      el,
      lazy = false
    } = options;
    this.lazy = lazy;
    this.el = null;
    if (typeof el === 'string') {
      this.el = document.querySelector(el)
    } else {
      this.el = el;
    }
    if (!this.el) {
      throw new TypeError('el should be a valid selector or HTMLElement');
    }
    this.raf = null;
    this.pRaf = null;
    this.images = [];
    this._currentIndex = 0;
    this.el.innerHTML =
      `<div style="position: relative; height: 100%; width: 100%; background-color: #ccc">
    <div class="pic-viewer-imgbox"></div>
</div>`;
    this.counter = document.createElement('div');
    this.counter.className = 'pic-viewer-counter';
    this.el.firstElementChild.appendChild(this.counter);
    this.counter.innerText = '1/' + this.images.length;
    this.bounding = this.el.getBoundingClientRect();
    if (this.bounding.width > 600 && !lazy) {
      const toolbar = document.createElement('div');
      toolbar.addEventListener('click', (e) => {
        const idx = (e.target as HTMLElement).dataset['index']
        if (idx) {
          const i = parseInt(idx);
          this.currentIndex = i;
        }
      });
      this.previewBar = toolbar;
      toolbar.classList.add('pic-viewer-toolbar');
      this.el.firstElementChild.appendChild(toolbar);
    }
    this.imgBox = this.el.querySelector('.pic-viewer-imgbox');
    this.imgBox.addEventListener('wheel', (e) => {
      if (e.deltaY > 0) {
        if (this.currentIndex >= this.images.length - 1) {
          return;
        }
        this.currentIndex++;
      } else {
        if (this.currentIndex <= 0) {
          return;
        }
        this.currentIndex--;
      }
      // this.imgBox.scrollLeft = e.deltaY + this.imgBox.scrollLeft;
    });
    this.intouch = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let scaleStart = 0;
    let inScale = false;
    let curScale = 1;
    let lastScale = 1;
    let dir = 0;
    let lastLeft = 0;
    let lastTop = 0;
    let cY = 0;
    let cX = 0;
    let transformScale = '';
    this.imgBox.addEventListener('dblclick', (e) => {
      const img = this.images[this.currentIndex];
      if (curScale > 1) {
        transformScale = 'scale(1)';
        img.style.left = 0 + 'px';
        img.style.top = 0 + 'px';
        img.style.transform = transformScale;
        curScale = 1;
      } else {
        transformScale = 'scale(2)';
        img.style.left = 0 + 'px';
        img.style.top = 0 + 'px';
        img.style.transform = transformScale;
        cX = 0;
        cY = 0;
        curScale = 2;
      }
    });
    this.imgBox.addEventListener('touchstart', (e) => {
      this.intouch = true;
      if (e.touches.length > 1) {
        lastScale = curScale;
        this.intouch = false;
        inScale = true;
        this.currentIndex = this.currentIndex;
        const x1 = e.touches[0].clientX;
        const y1 = e.touches[0].clientY;
        const x2 = e.touches[1].clientX;
        const y2 = e.touches[1].clientY;
        scaleStart = Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
      } else {
        inScale = false;
      }
      lastLeft = cX;
      lastTop = cY;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startLeft = this.imgBox.scrollLeft;
    });
    this.imgBox.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (inScale) {
        const x1 = e.touches[0].clientX;
        const y1 = e.touches[0].clientY;
        const x2 = e.touches[1].clientX;
        const y2 = e.touches[1].clientY;
        const curScaleLen = Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
        curScale = curScaleLen / scaleStart * lastScale;
        curScale = curScale < 1 ? 1 : curScale > 5 ? 5 : curScale;
        transformScale = `scale(${curScale})`;
        this.images[this.currentIndex].style.transform = transformScale;
      }
      if (curScale > 1) {
        const x1 = e.touches[0].clientX;
        const y1 = e.touches[0].clientY;
        cX = x1 - startX + lastLeft;
        cY = y1 - startY + lastTop;
        const img = this.images[this.currentIndex];
        const offsetWidth = img.offsetWidth;
        const offsetHeight = img.offsetHeight;
        const maxWidth = img.offsetWidth * curScale;
        const maxHeight = img.offsetHeight * curScale;
        const maxOverflowWidth = (maxWidth - offsetWidth) / 2;
        const maxOverflowHeight = (maxHeight - offsetHeight) / 2;
        cX = cX > maxOverflowWidth ? maxOverflowWidth : cX < -maxOverflowWidth ? -maxOverflowWidth : cX;
        cY = cY > maxOverflowHeight ? maxOverflowHeight : cY < -maxOverflowHeight ? -maxOverflowHeight : cY
        img.style.left = cX + 'px';
        img.style.top = cY + 'px';
        img.style.transform = transformScale;
      }
      if (!this.intouch || curScale > 1) {
        return;
      }
      const x = e.touches[0].clientX;
      const dis = x - startX;
      if (dis > 50) {
        dir = -1;
      } else if (dis < -50) {
        dir = 1;
      } else {
        dir = 0;
      }
      const img = this.images[this.currentIndex];
      transformScale = 'scale(1)';
      img.style.left = 0 + 'px';
      img.style.top = 0 + 'px';
      img.style.transform = transformScale;
      cX = 0
      cY = 0;
      curScale = 1;
      this.imgBox.scrollLeft = startLeft - dis;
    });
    this.imgBox.addEventListener('touchend', (e) => {
      this.intouch = false;
      inScale = false;
      if (dir !== 0) {
        scaleStart = 0;
        inScale = false;
        curScale = 1;
        lastScale = 1;
        this.images[this.currentIndex].style.transform = `scale(1)`;
        if (dir < 0) {
          if (this.currentIndex <= 0) return;
          this.currentIndex--;
        } else {
          if (this.currentIndex >= this.images.length - 1) return;
          this.currentIndex++;
        }

      } else {
        this.currentIndex = this.currentIndex;
      }
      dir = 0;
    });
  }
  get currentIndex() {
    return this._currentIndex;
  }
  set currentIndex(v) {
    if (v < 0 || v >= this.images.length) {
      console.warn('index is out of range: [0, ' + (this.images.length - 1) + ']')
    }
    const lastIndex = this._currentIndex;
    this._currentIndex = v;
    if (this.images[v].dataset['src']) {
      this.images[v].src = this.images[v].dataset['src'];
      this.images[v].dataset['src'] = '';
    }
    this.counter.innerText = v + 1 + '/' + this.images.length;
    this.previewBar && this._scrollPreviewBarToIndex(lastIndex, v);
    this._scrollToIndex(v);
  }
  _scrollPreviewBarToIndex(lastIndex: number, idx: number) {
    this.previewBar.children[lastIndex].classList.remove('current');
    const curPreviewImg = this.previewBar.children[idx] as HTMLImageElement;
    curPreviewImg.classList.add('current');
    let scrollLeft = curPreviewImg.offsetLeft - curPreviewImg.parentElement.clientWidth / 2 + curPreviewImg.offsetWidth / 2;
    scrollLeft = scrollLeft < 0 ? 0 : scrollLeft;
    const start = curPreviewImg.parentElement.scrollLeft;
    const end = scrollLeft;
    cancelAnimationFrame(this.pRaf);
    let cur = start;
    const scrollTo = () => {
      let step = (end - cur) / 5;
      if (end > start && cur >= end - 1 || end < start && cur <= end + 1) {
        this.previewBar.scrollLeft = end;
        return;
      }
      cur += step;
      if (cur <= 1) {
        this.previewBar.scrollLeft = 0;
        return;
      } else if (cur >= this.previewBar.scrollWidth - 1) {
        this.previewBar.scrollLeft = this.previewBar.scrollWidth;
        return;
      }
      this.previewBar.scrollLeft = cur;
      this.pRaf = requestAnimationFrame(scrollTo);
    }
    scrollTo();
  }
  _scrollToIndex(idx: number) {
    cancelAnimationFrame(this.raf);
    const end = this.images[idx].parentElement.offsetLeft;
    let start = this.imgBox.scrollLeft;
    let cur = start;
    const scrollTo = () => {
      let step = (end - cur) / 5;
      if (end > start && cur >= end - 1 || end < start && cur <= end + 1) {
        this.imgBox.scrollLeft = end;
        return;
      }
      cur += step;
      if (cur <= 1) {
        this.imgBox.scrollLeft = 0;
        return;
      } else if (cur >= this.imgBox.scrollWidth - 1) {
        this.imgBox.scrollLeft = this.imgBox.scrollWidth;
        return;
      }
      this.imgBox.scrollLeft = cur;
      this.raf = requestAnimationFrame(scrollTo);
    }
    scrollTo();
  }
  setImageList(imgUrls: string[] | HTMLImageElement[]) {
    let images: HTMLImageElement[] = [];
    const frg = document.createDocumentFragment();
    const previewFrg = document.createDocumentFragment();
    let idx = -1;
    for (let imgUrl of imgUrls) {
      idx++;
      let img = null;
      if (typeof imgUrl === 'string') {
        img = document.createElement('img');
        if (this.lazy && idx !== 0) {
          img.dataset['src'] = imgUrl;
        } else {
          img.src = imgUrl;
        }
      } else {
        img = imgUrl;
      }
      const box = this._imgBoxFactory(img);
      images.push(img);
      if (this.previewBar) {
        const previewImg = document.createElement('img');
        previewImg.className = 'pic-viewer-preview-img';
        previewImg.dataset['index'] = '' + idx;
        previewImg.src = img.src;
        previewFrg.appendChild(previewImg);
      }
      frg.appendChild(box);
    }
    if (this.previewBar) {
      this.previewBar.innerHTML = '';
      this.previewBar.appendChild(previewFrg);
    }
    this.counter.innerText = this.currentIndex + 1 + '/' + images.length;
    this.images = images;
    this.imgBox.innerHTML = '';
    this.imgBox.appendChild(frg);
  }
  _imgBoxFactory(img: HTMLImageElement) {
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.position = 'relative';
    const div = document.createElement('div');
    div.style.cssText = 'min-width: 100%;height: 100%;display: flex;justify-content: center;align-items: center;';
    div.appendChild(img);
    return div;
  }
  destroy() {
    this.el.innerHTML = '';
    this.images = [];
  }
}