(async() => {
    const satArr = await getData();

    let viewer = await loadViewer();

    for (let i = 0; i < satArr.length; i++) {
        addToViewer(satArr[i], viewer);
    }
})();