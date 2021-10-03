const fs = require('fs'),
    path = require('path'),
    satellite = require('satellite.js')

const orbitals = fs.readFileSync(path.join(__dirname, 'data.txt'), { encoding: 'utf8', flag: 'r' });

let arr = [];
let orbitalsArr = orbitals.split('\n'),
    length = orbitalsArr.length;

for (let i = 0; i < length - 1; i += 3) {
    const satrec = satellite.twoline2satrec(
        orbitalsArr[i + 1].trim(),
        orbitalsArr[i + 2].trim()
    );
    arr.push(satrec)
}

console.log((arr[2]));