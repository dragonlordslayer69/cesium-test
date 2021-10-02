function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.onload = async() => {
    await sleep(1000);
    propogate();
}