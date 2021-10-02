const satArr = getData();

let viewer = loadViewer();

for (let i = 0; i < satArr.length; i++) {
    addToViewer(satArr[i]);
}